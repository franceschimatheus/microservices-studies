package repository

import (
	"context"
	"errors"
	"sync"

	"inventory/internal/domain"
)

type PostgresRepository struct {
	mu    sync.RWMutex
	items map[string]*domain.Item
}

func NewPostgresRepository() *PostgresRepository {
	repo := &PostgresRepository{
		items: make(map[string]*domain.Item),
	}
	// Seed database with mock products
	repo.items["prod_laptop"] = &domain.Item{ProductID: "prod_laptop", Stock: 50}
	repo.items["prod_phone"] = &domain.Item{ProductID: "prod_phone", Stock: 10}
	repo.items["prod_headphones"] = &domain.Item{ProductID: "prod_headphones", Stock: 0}
	return repo
}

func (r *PostgresRepository) GetStock(ctx context.Context, productID string) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	item, ok := r.items[productID]
	if !ok {
		return 0, nil // Or product not found error. Let's return 0 for simplicity.
	}
	return item.Stock, nil
}

func (r *PostgresRepository) ReserveStock(ctx context.Context, productID string, quantity int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	item, ok := r.items[productID]
	if !ok {
		return errors.New("product not found")
	}
	if item.Stock < quantity {
		return errors.New("insufficient stock")
	}
	item.Stock -= quantity
	return nil
}

func (r *PostgresRepository) ReleaseStock(ctx context.Context, productID string, quantity int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	item, ok := r.items[productID]
	if !ok {
		return errors.New("product not found")
	}
	item.Stock += quantity
	return nil
}
