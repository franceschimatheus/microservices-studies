package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"payment-service/internal/domain"
	"rabbitmq"
)

type PostgresPaymentRepository struct {
	db *pgxpool.Pool
}

func NewPostgresPaymentRepository(db *pgxpool.Pool) *PostgresPaymentRepository {
	return &PostgresPaymentRepository{db: db}
}

func (r *PostgresPaymentRepository) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	query := `
		SELECT id, order_id, amount, status, created_at, updated_at 
		FROM payments 
		WHERE order_id = $1
	`
	var p domain.Payment
	err := r.db.QueryRow(ctx, query, orderID).Scan(
		&p.ID, &p.OrderID, &p.Amount, &p.Status, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrPaymentNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *PostgresPaymentRepository) Create(ctx context.Context, p *domain.Payment) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Idempotency check: insert event ID if present in context
	if messageID, ok := ctx.Value(rabbitmq.MessageIDKey).(string); ok && messageID != "" {
		processedQuery := `INSERT INTO processed_events (id, handler_name) VALUES ($1, $2)`
		_, err = tx.Exec(ctx, processedQuery, messageID, "payment-service.Create")
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
				return domain.ErrDuplicateEvent
			}
			return err
		}
	}

	query := `
		INSERT INTO payments (id, order_id, amount, status, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = tx.Exec(ctx, query, p.ID, p.OrderID, p.Amount, p.Status, p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *PostgresPaymentRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	query := `
		UPDATE payments 
		SET status = $1, updated_at = $2 
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, status, time.Now(), id)
	return err
}
