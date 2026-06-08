package handler

import (
	"context"
	"encoding/json"
	"log/slog"

	"errors"
	"go.opentelemetry.io/otel"

	"order-service/internal/domain"
	"order-service/internal/service"
)

type DeliveryEvent struct {
	OrderID string `json:"order_id"`
	UserID  string `json:"user_id"`
}

type DeliveryUpdatedEvent struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}

type DeliveryConsumer struct {
	orderService service.OrderService
}

func NewDeliveryConsumer(orderService service.OrderService) *DeliveryConsumer {
	return &DeliveryConsumer{orderService: orderService}
}

func (h *DeliveryConsumer) HandleDeliveryUpdated(ctx context.Context, body []byte) error {
	tr := otel.Tracer("order-service")
	ctx, span := tr.Start(ctx, "HandleDeliveryUpdated")
	defer span.End()

	var event DeliveryUpdatedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal delivery.updated event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling delivery.updated event", "order_id", event.OrderID, "status", event.Status)

	_, err := h.orderService.UpdateOrderStatus(ctx, event.OrderID, event.Status)
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateEvent) {
			slog.WarnContext(ctx, "Duplicate delivery.updated event detected and ignored", "order_id", event.OrderID, "status", event.Status)
			return nil
		}
		slog.ErrorContext(ctx, "Failed to update order status from delivery update", "order_id", event.OrderID, "status", event.Status, "error", err)
		return err
	}

	return nil
}

func (h *DeliveryConsumer) HandleDeliveryAssigned(ctx context.Context, body []byte) error {
	tr := otel.Tracer("order-service")
	ctx, span := tr.Start(ctx, "HandleDeliveryAssigned")
	defer span.End()

	var event DeliveryEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal delivery.assigned event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling delivery.assigned event", "order_id", event.OrderID)

	_, err := h.orderService.UpdateOrderStatus(ctx, event.OrderID, "ON_DELIVERY")
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateEvent) {
			slog.WarnContext(ctx, "Duplicate delivery.assigned event detected and ignored", "order_id", event.OrderID)
			return nil
		}
		slog.ErrorContext(ctx, "Failed to update order status to ON_DELIVERY", "order_id", event.OrderID, "error", err)
		return err
	}

	return nil
}

func (h *DeliveryConsumer) HandleDeliveryCompleted(ctx context.Context, body []byte) error {
	tr := otel.Tracer("order-service")
	ctx, span := tr.Start(ctx, "HandleDeliveryCompleted")
	defer span.End()

	var event DeliveryEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal delivery.completed event", "error", err)
		return nil
	}

	slog.InfoContext(ctx, "Handling delivery.completed event", "order_id", event.OrderID)

	_, err := h.orderService.UpdateOrderStatus(ctx, event.OrderID, "DELIVERED")
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateEvent) {
			slog.WarnContext(ctx, "Duplicate delivery.completed event detected and ignored", "order_id", event.OrderID)
			return nil
		}
		slog.ErrorContext(ctx, "Failed to update order status to DELIVERED", "order_id", event.OrderID, "error", err)
		return err
	}

	return nil
}
