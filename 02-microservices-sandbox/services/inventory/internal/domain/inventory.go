package domain

import "context"

// Item represents a product's stock information.
type Item struct {
	ProductID string `json:"product_id"`
	Stock     int    `json:"stock"`
}

// InventoryRepository defines database operations for stock.
type InventoryRepository interface {
	GetStock(ctx context.Context, productID string) (int, error)
	ReserveStock(ctx context.Context, productID string, quantity int) error
	ReleaseStock(ctx context.Context, productID string, quantity int) error
}

// InventoryService defines core business logic for inventory.
type InventoryService interface {
	CheckStock(ctx context.Context, productID string) (int, error)
	Reserve(ctx context.Context, productID string, quantity int) error
	Release(ctx context.Context, productID string, quantity int) error
}
