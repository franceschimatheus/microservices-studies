package domain

import (
	"context"
	"errors"
	"time"
)

var ErrPaymentNotFound = errors.New("payment not found")

type Payment struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PaymentRepository interface {
	GetByOrderID(ctx context.Context, orderID string) (*Payment, error)
	Create(ctx context.Context, payment *Payment) error
	UpdateStatus(ctx context.Context, id string, status string) error
}

type PaymentService interface {
	ProcessPayment(ctx context.Context, amount float64) (bool, error)
}
