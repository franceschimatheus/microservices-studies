package handler

import (
	"context"
	"encoding/json"
	"log/slog"

	"go.opentelemetry.io/otel"

	"order-service/internal/service"
)

type PaymentCompletedEvent struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
}

type PaymentFailedEvent struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

type PaymentConsumer struct {
	orderService service.OrderService
}

func NewPaymentConsumer(orderService service.OrderService) *PaymentConsumer {
	return &PaymentConsumer{orderService: orderService}
}

func (h *PaymentConsumer) HandlePaymentCompleted(ctx context.Context, body []byte) error {
	tr := otel.Tracer("order-service")
	ctx, span := tr.Start(ctx, "HandlePaymentCompleted")
	defer span.End()

	var event PaymentCompletedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal payment.completed event", "error", err)
		return nil // Avoid requeuing bad JSON formats
	}

	slog.InfoContext(ctx, "Handling payment.completed event", "order_id", event.OrderID, "payment_id", event.PaymentID)

	_, err := h.orderService.UpdateOrderStatus(ctx, event.OrderID, "CONFIRMED")
	if err != nil {
		slog.ErrorContext(ctx, "Failed to update order status to CONFIRMED", "order_id", event.OrderID, "error", err)
		return err
	}

	return nil
}

func (h *PaymentConsumer) HandlePaymentFailed(ctx context.Context, body []byte) error {
	tr := otel.Tracer("order-service")
	ctx, span := tr.Start(ctx, "HandlePaymentFailed")
	defer span.End()

	var event PaymentFailedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal payment.failed event", "error", err)
		return nil // Avoid requeuing bad JSON formats
	}

	slog.InfoContext(ctx, "Handling payment.failed event", "order_id", event.OrderID, "reason", event.Reason)

	_, err := h.orderService.UpdateOrderStatus(ctx, event.OrderID, "CANCELLED")
	if err != nil {
		slog.ErrorContext(ctx, "Failed to update order status to CANCELLED", "order_id", event.OrderID, "error", err)
		return err
	}

	return nil
}
