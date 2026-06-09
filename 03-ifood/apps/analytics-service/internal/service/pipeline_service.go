package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"analytics-service/internal/domain"
)

type PipelineServiceImpl struct {
	repo domain.AnalyticsRepository
}

func NewPipelineService(repo domain.AnalyticsRepository) domain.PipelineService {
	return &PipelineServiceImpl{repo: repo}
}

func (s *PipelineServiceImpl) ProcessNextBatch(ctx context.Context, batchSize int) (int, error) {
	events, err := s.repo.GetUnprocessedRawEvents(ctx, batchSize)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch raw events for processing: %w", err)
	}

	if len(events) == 0 {
		return 0, nil
	}

	slog.InfoContext(ctx, "Processing analytics events batch", "count", len(events))
	processedCount := 0

	for _, ev := range events {
		processErr := s.processEvent(ctx, ev)
		if err := rxtxMarkProcessed(ctx, s.repo, ev.ID, processErr); err != nil {
			slog.ErrorContext(ctx, "Failed to update processed status of event", "event_id", ev.ID, "error", err)
			continue
		}
		if processErr != nil {
			slog.ErrorContext(ctx, "Error processing event payload", "event_id", ev.ID, "event_type", ev.EventType, "error", processErr)
		} else {
			processedCount++
		}
	}

	return processedCount, nil
}

func rxtxMarkProcessed(ctx context.Context, repo domain.AnalyticsRepository, id string, processErr error) error {
	return repo.MarkRawEventProcessed(ctx, id, processErr)
}

func (s *PipelineServiceImpl) processEvent(ctx context.Context, ev *domain.RawEvent) error {
	switch ev.EventType {
	case "order.created":
		var p domain.OrderCreatedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal order.created payload: %w", err)
		}
		if p.OrderID == "" || p.UserID == "" {
			return errors.New("missing order_id or user_id in payload")
		}
		order := &domain.OrderRefined{
			OrderID:    p.OrderID,
			UserID:     p.UserID,
			TotalPrice: p.Total,
			Status:     "PENDING",
			CreatedAt:  ev.CreatedAt,
			UpdatedAt:  ev.CreatedAt,
		}
		return s.repo.UpsertOrderRefined(ctx, order)

	case "order.updated":
		var p domain.OrderUpdatedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal order.updated payload: %w", err)
		}
		if p.OrderID == "" || p.UserID == "" {
			return errors.New("missing order_id or user_id in payload")
		}
		order := &domain.OrderRefined{
			OrderID:    p.OrderID,
			UserID:     p.UserID,
			TotalPrice: 0.00, // ON CONFLICT DO UPDATE will preserve the existing total price
			Status:     p.Status,
			CreatedAt:  ev.CreatedAt,
			UpdatedAt:  ev.CreatedAt,
		}
		return s.repo.UpsertOrderRefined(ctx, order)

	case "payment.completed":
		var p domain.PaymentCompletedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal payment.completed payload: %w", err)
		}
		if p.PaymentID == "" || p.OrderID == "" || p.UserID == "" {
			return errors.New("missing payment_id, order_id, or user_id in payload")
		}
		payment := &domain.PaymentRefined{
			PaymentID: p.PaymentID,
			OrderID:   p.OrderID,
			UserID:    p.UserID,
			Status:    "COMPLETED",
			Amount:    0.00, // Will be updated if order is found, or queried separately
			Reason:    "",
			CreatedAt: ev.CreatedAt,
		}
		return s.repo.UpsertPaymentRefined(ctx, payment)

	case "payment.failed":
		var p domain.PaymentFailedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal payment.failed payload: %w", err)
		}
		if p.OrderID == "" || p.UserID == "" {
			return errors.New("missing order_id or user_id in payload")
		}
		payment := &domain.PaymentRefined{
			PaymentID: fmt.Sprintf("failed-%s", p.OrderID), // Generate pseudo payment ID for failure logging
			OrderID:   p.OrderID,
			UserID:    p.UserID,
			Status:    "FAILED",
			Amount:    0.00,
			Reason:    p.Reason,
			CreatedAt: ev.CreatedAt,
		}
		return s.repo.UpsertPaymentRefined(ctx, payment)

	case "delivery.assigned":
		var p domain.DeliveryAssignedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal delivery.assigned payload: %w", err)
		}
		if p.OrderID == "" || p.UserID == "" {
			return errors.New("missing order_id or user_id in payload")
		}
		now := ev.CreatedAt
		delivery := &domain.DeliveryRefined{
			OrderID:    p.OrderID,
			UserID:     p.UserID,
			Status:     "ON_DELIVERY",
			AssignedAt: &now,
			CreatedAt:  ev.CreatedAt,
		}
		return s.repo.UpsertDeliveryRefined(ctx, delivery)

	case "delivery.completed":
		var p domain.DeliveryCompletedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal delivery.completed payload: %w", err)
		}
		if p.OrderID == "" || p.UserID == "" {
			return errors.New("missing order_id or user_id in payload")
		}
		now := ev.CreatedAt
		delivery := &domain.DeliveryRefined{
			OrderID:     p.OrderID,
			UserID:      p.UserID,
			Status:      "DELIVERED",
			CompletedAt: &now,
			CreatedAt:   ev.CreatedAt,
		}
		return s.repo.UpsertDeliveryRefined(ctx, delivery)

	case "delivery.updated":
		var p domain.DeliveryUpdatedPayload
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return fmt.Errorf("failed to unmarshal delivery.updated payload: %w", err)
		}
		if p.OrderID == "" || p.Status == "" {
			return errors.New("missing order_id or status in payload")
		}
		delivery := &domain.DeliveryRefined{
			OrderID:   p.OrderID,
			UserID:    "", // Will be merged on update
			Status:    p.Status,
			CreatedAt: ev.CreatedAt,
		}
		return s.repo.UpsertDeliveryRefined(ctx, delivery)

	default:
		slog.WarnContext(ctx, "Skipping processing for unhandled event type", "event_type", ev.EventType)
		return nil
	}
}
