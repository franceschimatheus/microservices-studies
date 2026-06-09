package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"analytics-service/internal/domain"
)

type PostgresAnalyticsRepository struct {
	db *pgxpool.Pool
}

func NewPostgresAnalyticsRepository(db *pgxpool.Pool) *PostgresAnalyticsRepository {
	return &PostgresAnalyticsRepository{db: db}
}

func (r *PostgresAnalyticsRepository) SaveRawEvent(ctx context.Context, id string, eventType string, payload []byte) error {
	query := `
		INSERT INTO raw_events (id, event_type, payload, processed, created_at)
		VALUES ($1, $2, $3, FALSE, NOW())
		ON CONFLICT (id) DO NOTHING;
	`
	_, err := r.db.Exec(ctx, query, id, eventType, payload)
	if err != nil {
		return fmt.Errorf("failed to save raw event: %w", err)
	}
	return nil
}

func (r *PostgresAnalyticsRepository) GetUnprocessedRawEvents(ctx context.Context, limit int) ([]*domain.RawEvent, error) {
	query := `
		SELECT id, event_type, payload, processed, error_message, created_at, processed_at
		FROM raw_events
		WHERE processed = FALSE
		ORDER BY created_at ASC
		LIMIT $1;
	`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query unprocessed raw events: %w", err)
	}
	defer rows.Close()

	var events []*domain.RawEvent
	for rows.Next() {
		var ev domain.RawEvent
		var errStr sql.NullString
		var processedAt sql.NullTime

		err := rows.Scan(&ev.ID, &ev.EventType, &ev.Payload, &ev.Processed, &errStr, &ev.CreatedAt, &processedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan raw event: %w", err)
		}

		if errStr.Valid {
			ev.ErrorMessage = &errStr.String
		}
		if processedAt.Valid {
			ev.ProcessedAt = &processedAt.Time
		}
		events = append(events, &ev)
	}

	return events, nil
}

func (r *PostgresAnalyticsRepository) MarkRawEventProcessed(ctx context.Context, id string, processErr error) error {
	var errStr *string
	if processErr != nil {
		s := processErr.Error()
		errStr = &s
	}

	query := `
		UPDATE raw_events
		SET processed = TRUE, error_message = $1, processed_at = NOW()
		WHERE id = $2;
	`
	_, err := r.db.Exec(ctx, query, errStr, id)
	if err != nil {
		return fmt.Errorf("failed to mark raw event as processed: %w", err)
	}
	return nil
}

func (r *PostgresAnalyticsRepository) UpsertOrderRefined(ctx context.Context, order *domain.OrderRefined) error {
	query := `
		INSERT INTO orders_refined (order_id, user_id, total_price, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (order_id) 
		DO UPDATE SET 
			status = EXCLUDED.status,
			total_price = CASE WHEN EXCLUDED.total_price > 0.00 THEN EXCLUDED.total_price ELSE orders_refined.total_price END,
			updated_at = NOW();
	`
	_, err := r.db.Exec(ctx, query, order.OrderID, order.UserID, order.TotalPrice, order.Status, order.CreatedAt, order.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to upsert refined order: %w", err)
	}
	return nil
}

func (r *PostgresAnalyticsRepository) UpsertPaymentRefined(ctx context.Context, payment *domain.PaymentRefined) error {
	query := `
		INSERT INTO payments_refined (payment_id, order_id, user_id, status, amount, reason, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (payment_id) 
		DO UPDATE SET 
			status = EXCLUDED.status,
			reason = EXCLUDED.reason;
	`
	_, err := r.db.Exec(ctx, query, payment.PaymentID, payment.OrderID, payment.UserID, payment.Status, payment.Amount, payment.Reason, payment.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to upsert refined payment: %w", err)
	}
	return nil
}

func (r *PostgresAnalyticsRepository) UpsertDeliveryRefined(ctx context.Context, delivery *domain.DeliveryRefined) error {
	query := `
		INSERT INTO deliveries_refined (order_id, user_id, status, assigned_at, completed_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (order_id) 
		DO UPDATE SET 
			status = EXCLUDED.status,
			assigned_at = COALESCE(EXCLUDED.assigned_at, deliveries_refined.assigned_at),
			completed_at = COALESCE(EXCLUDED.completed_at, deliveries_refined.completed_at);
	`
	_, err := r.db.Exec(ctx, query, delivery.OrderID, delivery.UserID, delivery.Status, delivery.AssignedAt, delivery.CompletedAt, delivery.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to upsert refined delivery: %w", err)
	}
	return nil
}
