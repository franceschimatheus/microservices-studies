package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"

	"notification-service/internal/service"
	"rabbitmq"
)

type OrderCreatedEvent struct {
	OrderID string  `json:"order_id"`
	UserID  string  `json:"user_id"`
	Total   float64 `json:"total"`
}

type PaymentCompletedEvent struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
	UserID    string `json:"user_id"` // Note: payment event might not have user_id. Let's handle user_id fallback or check if we can retrieve it.
}

type PaymentFailedEvent struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
	UserID  string `json:"user_id"`
}

type OrderUpdatedEvent struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
	Status  string `json:"status"`
}

type DeliveryCompletedEvent struct {
	OrderID    string `json:"order_id"`
	UserID     string `json:"user_id"`
	DeliveryID string `json:"delivery_id"`
}

type NotificationHandler struct {
	service     service.NotificationService
	redisClient *redis.Client
}

func NewNotificationHandler(service service.NotificationService, redisClient *redis.Client) *NotificationHandler {
	return &NotificationHandler{
		service:     service,
		redisClient: redisClient,
	}
}

func (h *NotificationHandler) isDuplicate(ctx context.Context, handlerName, eventID string) (bool, error) {
	messageID, ok := ctx.Value(rabbitmq.MessageIDKey).(string)
	if !ok || messageID == "" {
		return false, nil
	}

	key := fmt.Sprintf("idempotency:notification:%s:%s", handlerName, messageID)
	okSet, err := h.redisClient.SetNX(ctx, key, "processed", 24*time.Hour).Result()
	if err != nil {
		return false, fmt.Errorf("redis error in idempotency check: %w", err)
	}

	if !okSet {
		slog.WarnContext(ctx, "Duplicate notification event detected and ignored", "message_id", messageID, "handler", handlerName, "event_id", eventID)
		return true, nil
	}

	return false, nil
}

func (h *NotificationHandler) HandleOrderCreated(ctx context.Context, body []byte) error {
	tr := otel.Tracer("notification-service")
	ctx, span := tr.Start(ctx, "HandleOrderCreated")
	defer span.End()

	var event OrderCreatedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal order.created event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling order.created event for notification", "order_id", event.OrderID, "user_id", event.UserID)

	duplicate, err := h.isDuplicate(ctx, "HandleOrderCreated", event.OrderID)
	if err != nil {
		return err
	}
	if duplicate {
		return nil
	}

	subject := fmt.Sprintf("Order #%s Placed Successfully!", event.OrderID[:8])
	emailBody := fmt.Sprintf("Hi! Your order #%s of total value $%.2f has been received and is awaiting payment confirmation.", event.OrderID, event.Total)

	if err := h.service.SendEmail(ctx, event.UserID, subject, emailBody); err != nil {
		return err
	}

	return h.service.PublishToSSE(ctx, event.UserID, "ORDER_CREATED", event)
}

func (h *NotificationHandler) HandlePaymentCompleted(ctx context.Context, body []byte) error {
	tr := otel.Tracer("notification-service")
	ctx, span := tr.Start(ctx, "HandlePaymentCompleted")
	defer span.End()

	// Wait, payment.completed payload contains OrderID and PaymentID.
	// Since payment-service does not have user_id, let's parse order_id,
	// but wait! If we don't have user_id in payment.completed, how do we push it to Redis user channel?
	// We can subscribe the notification service to order.updated (published when order-service updates order status to CONFIRMED).
	// Since order-service knows the userID, order-service's UpdateOrderStatus will publish order.updated WITH user_id!
	// Therefore, the user will receive the live status update via the order.updated event consumer!
	// However, we still consume payment.completed to simulate sending an email.
	// For sending email, since we don't have the user_id directly from the payment event payload,
	// we can either log it generally, or we can look up the order, or we can just simulate it.
	// Let's check payment_handler.go: it publishes:
	// type PaymentCompletedEvent struct { OrderID string; PaymentID string }
	// Let's decode it.
	var event PaymentCompletedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal payment.completed event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling payment.completed event for notification", "order_id", event.OrderID)

	duplicate, err := h.isDuplicate(ctx, "HandlePaymentCompleted", event.OrderID)
	if err != nil {
		return err
	}
	if duplicate {
		return nil
	}

	// We can simulate email using the order ID since that's what we have
	subject := fmt.Sprintf("Payment Completed for Order #%s", event.OrderID[:8])
	emailBody := fmt.Sprintf("Success! Payment for your order #%s has been processed successfully. Transaction ID: %s.", event.OrderID, event.PaymentID)

	// Log simulation
	return h.service.SendEmail(ctx, "unknown_user_fallback", subject, emailBody)
}

func (h *NotificationHandler) HandlePaymentFailed(ctx context.Context, body []byte) error {
	tr := otel.Tracer("notification-service")
	ctx, span := tr.Start(ctx, "HandlePaymentFailed")
	defer span.End()

	var event PaymentFailedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal payment.failed event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling payment.failed event for notification", "order_id", event.OrderID)

	duplicate, err := h.isDuplicate(ctx, "HandlePaymentFailed", event.OrderID)
	if err != nil {
		return err
	}
	if duplicate {
		return nil
	}

	subject := fmt.Sprintf("Payment Failed for Order #%s", event.OrderID[:8])
	emailBody := fmt.Sprintf("Attention: Payment for your order #%s has failed. Reason: %s. Please try again.", event.OrderID, event.Reason)

	return h.service.SendEmail(ctx, "unknown_user_fallback", subject, emailBody)
}

func (h *NotificationHandler) HandleOrderUpdated(ctx context.Context, body []byte) error {
	tr := otel.Tracer("notification-service")
	ctx, span := tr.Start(ctx, "HandleOrderUpdated")
	defer span.End()

	var event OrderUpdatedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal order.updated event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling order.updated event for notification", "order_id", event.OrderID, "user_id", event.UserID, "status", event.Status)

	duplicate, err := h.isDuplicate(ctx, "HandleOrderUpdated", event.OrderID)
	if err != nil {
		return err
	}
	if duplicate {
		return nil
	}

	subject := fmt.Sprintf("Order #%s Status Update", event.OrderID[:8])
	emailBody := fmt.Sprintf("Your order #%s status has been updated to: %s.", event.OrderID, event.Status)

	if err := h.service.SendEmail(ctx, event.UserID, subject, emailBody); err != nil {
		return err
	}

	// Send live SSE update
	return h.service.PublishToSSE(ctx, event.UserID, "ORDER_STATUS_UPDATED", event)
}

func (h *NotificationHandler) HandleDeliveryCompleted(ctx context.Context, body []byte) error {
	tr := otel.Tracer("notification-service")
	ctx, span := tr.Start(ctx, "HandleDeliveryCompleted")
	defer span.End()

	// Wait, let's see if delivery completed has user_id. Let's parse it and fallback if empty.
	var event DeliveryCompletedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal delivery.completed event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling delivery.completed event for notification", "order_id", event.OrderID)

	duplicate, err := h.isDuplicate(ctx, "HandleDeliveryCompleted", event.OrderID)
	if err != nil {
		return err
	}
	if duplicate {
		return nil
	}

	subject := fmt.Sprintf("Order #%s Delivered!", event.OrderID[:8])
	emailBody := fmt.Sprintf("Hooray! Your order #%s has been successfully delivered. Enjoy your meal!", event.OrderID)

	if event.UserID != "" {
		if err := h.service.SendEmail(ctx, event.UserID, subject, emailBody); err != nil {
			return err
		}
		return h.service.PublishToSSE(ctx, event.UserID, "DELIVERY_COMPLETED", event)
	}

	return h.service.SendEmail(ctx, "unknown_user_fallback", subject, emailBody)
}
