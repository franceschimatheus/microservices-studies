package repository

import (
	"context"
	"errors"
	"sync"

	"payment/internal/domain"
)

type PostgresRepository struct {
	mu           sync.RWMutex
	transactions map[string]*domain.Transaction
}

func NewPostgresRepository() *PostgresRepository {
	return &PostgresRepository{
		transactions: make(map[string]*domain.Transaction),
	}
}

func (r *PostgresRepository) Save(ctx context.Context, tx *domain.Transaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.transactions[tx.ID] = tx
	return nil
}

func (r *PostgresRepository) FindByOrderID(ctx context.Context, orderID string) (*domain.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, tx := range r.transactions {
		if tx.OrderID == orderID {
			return tx, nil
		}
	}
	return nil, errors.New("transaction not found")
}
