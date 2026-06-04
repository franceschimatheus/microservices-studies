package repository

import (
	"context"
	"errors"
	"sync"

	"order/internal/domain"
)

type PostgresRepository struct {
	mu     sync.RWMutex
	orders map[string]*domain.Order
}

func NewPostgresRepository() *PostgresRepository {
	return &PostgresRepository{
		orders: make(map[string]*domain.Order),
	}
}

func (r *PostgresRepository) Save(ctx context.Context, order *domain.Order) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.orders[order.ID] = order
	// TODO(security): Implement parameterized SQL queries when database integration is introduced
	// e.g., db.ExecContext(ctx, "INSERT INTO orders (id, customer_id, ...) VALUES ($1, $2, ...)", ...)
	return nil
}

func (r *PostgresRepository) FindByID(ctx context.Context, id string) (*domain.Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	order, ok := r.orders[id]
	if !ok {
		return nil, errors.New("order not found")
	}
	return order, nil
}

func (r *PostgresRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	order, ok := r.orders[id]
	if !ok {
		return errors.New("order not found")
	}
	order.Status = status
	return nil
}
