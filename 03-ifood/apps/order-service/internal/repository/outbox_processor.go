package repository

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"rabbitmq"
)

type OutboxProcessor struct {
	db           *pgxpool.Pool
	rabbitClient *rabbitmq.Client
	interval     time.Duration
}

func NewOutboxProcessor(db *pgxpool.Pool, rabbitClient *rabbitmq.Client, interval time.Duration) *OutboxProcessor {
	if interval == 0 {
		interval = 500 * time.Millisecond
	}
	return &OutboxProcessor{
		db:           db,
		rabbitClient: rabbitClient,
		interval:     interval,
	}
}

func (p *OutboxProcessor) Start(ctx context.Context) {
	slog.Info("Starting background Outbox Processor")
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Stopping background Outbox Processor")
			return
		case <-ticker.C:
			if err := p.processPendingEvents(ctx); err != nil {
				slog.Error("Error processing pending outbox events", "error", err)
			}
		}
	}
}

func (p *OutboxProcessor) processPendingEvents(ctx context.Context) error {
	tx, err := p.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Select pending outbox events, locking them for the transaction
	query := `SELECT id, exchange, routing_key, payload FROM outbox 
	          WHERE status = 'PENDING' 
	          ORDER BY created_at ASC 
	          FOR UPDATE SKIP LOCKED 
	          LIMIT 20`
	rows, err := tx.Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	type pendingEvent struct {
		id         string
		exchange   string
		routingKey string
		payload    []byte
	}

	var events []pendingEvent
	for rows.Next() {
		var ev pendingEvent
		if err := rows.Scan(&ev.id, &ev.exchange, &ev.routingKey, &ev.payload); err != nil {
			return err
		}
		events = append(events, ev)
	}
	rows.Close() // Close rows immediately so we can run updates on the transaction

	if len(events) == 0 {
		return nil
	}

	slog.Info("Processing outbox events", "count", len(events))

	updateQuery := `UPDATE outbox SET status = $1, processed_at = $2 WHERE id = $3`

	for _, ev := range events {
		// Publish the event to RabbitMQ
		publishCtx := context.WithValue(ctx, rabbitmq.MessageIDKey, ev.id)
		err = p.rabbitClient.Publish(publishCtx, ev.exchange, ev.routingKey, ev.payload)
		if err != nil {
			slog.Error("Failed to publish outbox event", "id", ev.id, "routing_key", ev.routingKey, "error", err)
			// On publish error, rollback transaction so we retry on the next tick
			return err
		}

		// Update outbox event status to PROCESSED
		_, err = tx.Exec(ctx, updateQuery, "PROCESSED", time.Now(), ev.id)
		if err != nil {
			return err
		}
		slog.Info("Successfully processed outbox event", "id", ev.id, "routing_key", ev.routingKey)
	}

	return tx.Commit(ctx)
}
