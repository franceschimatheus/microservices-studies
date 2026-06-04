package domain

import "context"

// Notification represents a message sent to a customer.
type Notification struct {
	ID        string `json:"id"`
	OrderID   string `json:"order_id"`
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
	Type      string `json:"type"` // e.g., EMAIL, SMS
}

// NotificationService defines core business logic for sending notifications.
type NotificationService interface {
	SendOrderNotification(ctx context.Context, orderID string, recipient string, message string) error
}
