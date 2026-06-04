package domain

import "context"

// Transaction represents a payment transaction.
type Transaction struct {
	ID        string  `json:"id"`
	OrderID   string  `json:"order_id"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"` // e.g., SUCCESS, FAILED
	Reference string  `json:"reference"`
}

// PaymentRepository defines database operations for transactions.
type PaymentRepository interface {
	Save(ctx context.Context, tx *Transaction) error
	FindByOrderID(ctx context.Context, orderID string) (*Transaction, error)
}

// PaymentService defines core business logic for processing payments.
type PaymentService interface {
	ProcessPayment(ctx context.Context, orderID string, amount float64) (*Transaction, error)
}
