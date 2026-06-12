package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"analytics-service/internal/domain"
)

type AnalyticsHandler struct {
	repo        domain.AnalyticsRepository
	redisClient *redis.Client
}

func NewAnalyticsHandler(repo domain.AnalyticsRepository, redisClient *redis.Client) *AnalyticsHandler {
	return &AnalyticsHandler{repo: repo, redisClient: redisClient}
}

func (h *AnalyticsHandler) broadcastLog(ctx context.Context, eventType string, body []byte) {
	if h.redisClient == nil {
		return
	}

	payload := map[string]interface{}{
		"type":      eventType,
		"timestamp": time.Now().Format(time.RFC3339),
		"payload":   json.RawMessage(body),
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal log payload", "error", err)
		return
	}

	if err := h.redisClient.Publish(ctx, "admin:logs", payloadBytes).Err(); err != nil {
		slog.ErrorContext(ctx, "Failed to publish log to Redis", "error", err)
	}
}

func (h *AnalyticsHandler) HandleOrderCreated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting order.created event to Bronze")
	h.broadcastLog(ctx, "order.created", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "order.created", body)
}

func (h *AnalyticsHandler) HandleOrderUpdated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting order.updated event to Bronze")
	h.broadcastLog(ctx, "order.updated", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "order.updated", body)
}

func (h *AnalyticsHandler) HandlePaymentCompleted(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting payment.completed event to Bronze")
	h.broadcastLog(ctx, "payment.completed", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "payment.completed", body)
}

func (h *AnalyticsHandler) HandlePaymentFailed(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting payment.failed event to Bronze")
	h.broadcastLog(ctx, "payment.failed", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "payment.failed", body)
}

func (h *AnalyticsHandler) HandleDeliveryAssigned(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.assigned event to Bronze")
	h.broadcastLog(ctx, "delivery.assigned", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.assigned", body)
}

func (h *AnalyticsHandler) HandleDeliveryCompleted(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.completed event to Bronze")
	h.broadcastLog(ctx, "delivery.completed", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.completed", body)
}

func (h *AnalyticsHandler) HandleDeliveryUpdated(ctx context.Context, body []byte) error {
	slog.DebugContext(ctx, "Ingesting delivery.updated event to Bronze")
	h.broadcastLog(ctx, "delivery.updated", body)
	return h.repo.SaveRawEvent(ctx, uuid.New().String(), "delivery.updated", body)
}
