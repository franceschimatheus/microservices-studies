package handler

import (
	"context"
	"log/slog"

	"github.com/google/uuid"

	"analytics-service/internal/domain"
)

type AnalyticsHandler struct {
	repo domain.AnalyticsRepository
}

func NewAnalyticsHandler(repo domain.AnalyticsRepository) *AnalyticsHandler {
	return &AnalyticsHandler{repo: repo}
}

func (h *AnalyticsHandler) HandleOrderCreated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting order.created event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "order.created", body)
}

func (h *AnalyticsHandler) HandleOrderUpdated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting order.updated event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "order.updated", body)
}

func (h *AnalyticsHandler) HandlePaymentCompleted(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting payment.completed event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "payment.completed", body)
}

func (h *AnalyticsHandler) HandlePaymentFailed(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting payment.failed event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "payment.failed", body)
}

func (h *AnalyticsHandler) HandleDeliveryAssigned(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.assigned event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.assigned", body)
}

func (h *AnalyticsHandler) HandleDeliveryCompleted(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.completed event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.completed", body)
}

func (h *AnalyticsHandler) HandleDeliveryUpdated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.updated event to Bronze")
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.updated", body)
}
