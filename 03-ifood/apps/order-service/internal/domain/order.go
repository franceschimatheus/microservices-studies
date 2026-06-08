package domain

import (
	"context"
	"time"
)

type OrderItem struct {
	ID         string  `json:"id"`
	OrderID    string  `json:"order_id"`
	MenuItemID string  `json:"menu_item_id"`
	Name       string  `json:"name"`
	Price      float64 `json:"price"`
	Quantity   int     `json:"quantity"`
}

type Order struct {
	ID           string       `json:"id"`
	UserID       string       `json:"user_id"`
	RestaurantID string       `json:"restaurant_id"`
	TotalPrice   float64      `json:"total_price"`
	Status       string       `json:"status"`
	Items        []OrderItem  `json:"items"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type OutboxEvent struct {
	Exchange   string
	RoutingKey string
	Payload    []byte
}

type OrderRepository interface {
	Create(ctx context.Context, order *Order, events ...OutboxEvent) error
	GetByID(ctx context.Context, id string) (*Order, error)
	ListByUserID(ctx context.Context, userID string) ([]*Order, error)
	UpdateStatus(ctx context.Context, id string, status string, events ...OutboxEvent) error
}

