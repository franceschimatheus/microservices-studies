package domain

import (
	"context"
	"time"
)

type SystemEvent struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`      // e.g., OrderCreated, PaymentProcessed, NotificationSent
	Source    string    `json:"source"`    // e.g., order-service, payment-service, notification-service
	Payload   string    `json:"payload"`   // JSON raw payload
	Timestamp time.Time `json:"timestamp"`
}

type SystemMetrics struct {
	TotalOrders            int64   `json:"total_orders"`
	TotalPaymentsProcessed int64   `json:"total_payments_processed"`
	TotalPaymentsSuccess   int64   `json:"total_payments_success"`
	TotalPaymentsFailed    int64   `json:"total_payments_failed"`
	TotalNotificationsSent int64   `json:"total_notifications_sent"`
	SystemHealth           float64 `json:"system_health"` // Percentage of successful actions
}

type AuditService interface {
	AddEvent(ctx context.Context, event SystemEvent)
	GetEvents(ctx context.Context) []SystemEvent
	GetMetrics(ctx context.Context) SystemMetrics
}
