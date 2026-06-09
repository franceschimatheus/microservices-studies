package domain

import (
	"context"
	"encoding/json"
	"time"
)

type RawEvent struct {
	ID           string          `json:"id"`
	EventType    string          `json:"event_type"`
	Payload      json.RawMessage `json:"payload"`
	Processed    bool            `json:"processed"`
	ErrorMessage *string         `json:"error_message,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	ProcessedAt  *time.Time      `json:"processed_at,omitempty"`
}

// OrderCreatedPayload represents the order.created JSON payload
type OrderCreatedPayload struct {
	OrderID string  `json:"order_id"`
	UserID  string  `json:"user_id"`
	Total   float64 `json:"total"`
}

// OrderUpdatedPayload represents the order.updated JSON payload
type OrderUpdatedPayload struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
	Status  string `json:"status"`
}

// PaymentCompletedPayload represents the payment.completed JSON payload
type PaymentCompletedPayload struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
	UserID    string `json:"user_id"`
}

// PaymentFailedPayload represents the payment.failed JSON payload
type PaymentFailedPayload struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
	Reason  string `json:"reason"`
}

// DeliveryAssignedPayload represents the delivery.assigned JSON payload
type DeliveryAssignedPayload struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
}

// DeliveryCompletedPayload represents the delivery.completed JSON payload
type DeliveryCompletedPayload struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
}

// DeliveryUpdatedPayload represents the delivery.updated JSON payload
type DeliveryUpdatedPayload struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}

type OrderRefined struct {
	OrderID    string    `json:"order_id"`
	UserID     string    `json:"user_id"`
	TotalPrice float64   `json:"total_price"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type PaymentRefined struct {
	PaymentID string    `json:"payment_id"`
	OrderID   string    `json:"order_id"`
	UserID    string    `json:"user_id"`
	Status    string    `json:"status"`
	Amount    float64   `json:"amount"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

type DeliveryRefined struct {
	OrderID     string     `json:"order_id"`
	UserID      string     `json:"user_id"`
	Status      string     `json:"status"`
	AssignedAt  *time.Time `json:"assigned_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// AnalyticsRepository defines the database operations abstraction for the domain
type AnalyticsRepository interface {
	SaveRawEvent(ctx context.Context, id string, eventType string, payload []byte) error
	GetUnprocessedRawEvents(ctx context.Context, limit int) ([]*RawEvent, error)
	MarkRawEventProcessed(ctx context.Context, id string, processErr error) error
	UpsertOrderRefined(ctx context.Context, order *OrderRefined) error
	UpsertPaymentRefined(ctx context.Context, payment *PaymentRefined) error
	UpsertDeliveryRefined(ctx context.Context, delivery *DeliveryRefined) error
}

// PipelineService defines the batch event processing use case abstraction for the domain
type PipelineService interface {
	ProcessNextBatch(ctx context.Context, batchSize int) (int, error)
}

