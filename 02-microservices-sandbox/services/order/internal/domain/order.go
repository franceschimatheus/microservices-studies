package domain

import "context"

// Order represents an order placed by a customer.
type Order struct {
	ID         string  `json:"id"`
	CustomerID string  `json:"customer_id"`
	ProductID  string  `json:"product_id"`
	Quantity   int     `json:"quantity"`
	Price      float64 `json:"price"`
	Status     string  `json:"status"` // e.g., PENDING, COMPLETED, CANCELLED
}

// CreateOrderInput holds parameters to place a new order.
type CreateOrderInput struct {
	CustomerID string  `json:"customer_id"`
	ProductID  string  `json:"product_id"`
	Quantity   int     `json:"quantity"`
	Price      float64 `json:"price"`
}

// OrderRepository defines the interface for database operations on orders.
type OrderRepository interface {
	Save(ctx context.Context, order *Order) error
	FindByID(ctx context.Context, id string) (*Order, error)
	UpdateStatus(ctx context.Context, id string, status string) error
}

// InventoryClient defines the interface for checking and reserving product stock.
type InventoryClient interface {
	CheckStock(ctx context.Context, productID string) (int, error)
	ReserveStock(ctx context.Context, productID string, quantity int) error
	ReleaseStock(ctx context.Context, productID string, quantity int) error
}

// EventPublisher defines the interface for publishing order events.
type EventPublisher interface {
	PublishOrderCreated(ctx context.Context, orderID string, customerID string, productID string, quantity int, price float64) error
}

// OrderService defines the core business logic interface for orders.
type OrderService interface {
	PlaceOrder(ctx context.Context, input CreateOrderInput) (*Order, error)
	GetOrder(ctx context.Context, id string) (*Order, error)
}
