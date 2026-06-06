package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"payment-service/internal/domain"
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
	query := `
		INSERT INTO payments (id, order_id, amount, status, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.db.Exec(ctx, query, p.ID, p.OrderID, p.Amount, p.Status, p.CreatedAt, p.UpdatedAt)
	return err
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
