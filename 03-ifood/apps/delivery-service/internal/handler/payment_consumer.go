package handler

import (
	"context"
	"encoding/json"
	"log/slog"

	"go.opentelemetry.io/otel"

	"delivery-service/internal/service"
)

type PaymentCompletedEvent struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
	UserID    string `json:"user_id"`
}

type PaymentConsumer struct {
	deliveryServ service.DeliveryService
}

func NewPaymentConsumer(deliveryServ service.DeliveryService) *PaymentConsumer {
	return &PaymentConsumer{
		deliveryServ: deliveryServ,
	}
}

func (h *PaymentConsumer) HandlePaymentCompleted(ctx context.Context, body []byte) error {
	tr := otel.Tracer("delivery-service")
	ctx, span := tr.Start(ctx, "HandlePaymentCompleted")
	defer span.End()

	var event PaymentCompletedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal payment.completed event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling payment.completed event in delivery-service", "order_id", event.OrderID, "user_id", event.UserID)

	h.deliveryServ.StartDeliverySimulation(ctx, event.OrderID, event.UserID)
	return nil
}
