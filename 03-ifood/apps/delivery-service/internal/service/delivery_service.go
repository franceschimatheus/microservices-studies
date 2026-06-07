package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"go.opentelemetry.io/otel"

	"rabbitmq"
)

type DeliveryService interface {
	StartDeliverySimulation(ctx context.Context, orderID, userID string)
}

type DeliveryServiceImpl struct {
	rabbitClient *rabbitmq.Client
}

func NewDeliveryService(rabbitClient *rabbitmq.Client) DeliveryService {
	return &DeliveryServiceImpl{
		rabbitClient: rabbitClient,
	}
}

func (s *DeliveryServiceImpl) StartDeliverySimulation(ctx context.Context, orderID, userID string) {
	// Start async background simulation
	// Propagate trace context to background goroutine
	tr := otel.Tracer("delivery-service")
	bgCtx, span := tr.Start(context.Background(), "StartDeliverySimulationBackground")
	// Note: we close the span at the end of the simulation goroutine

	go func() {
		defer span.End()
		slog.InfoContext(bgCtx, "🚀 Starting delivery simulation workflow", "order_id", orderID, "user_id", userID)

		// 1. Wait 5s: Food Preparation starts
		time.Sleep(5 * time.Second)
		s.publishStatus(bgCtx, orderID, "PREPARING", "delivery.updated")

		// 2. Wait 5s: Food is Ready
		time.Sleep(5 * time.Second)
		s.publishStatus(bgCtx, orderID, "READY", "delivery.updated")

		// 3. Wait 5s: Driver Assigned / Out for delivery
		time.Sleep(5 * time.Second)
		s.publishEvent(bgCtx, orderID, userID, "delivery.assigned")

		// 4. Wait 5s: Delivered
		time.Sleep(5 * time.Second)
		s.publishEvent(bgCtx, orderID, userID, "delivery.completed")

		slog.InfoContext(bgCtx, "🏁 Delivery simulation completed successfully", "order_id", orderID)
	}()
}

func (s *DeliveryServiceImpl) publishStatus(ctx context.Context, orderID string, status string, routingKey string) {
	payload := map[string]any{
		"order_id": orderID,
		"status":   status,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal delivery status update payload", "error", err)
		return
	}

	err = s.rabbitClient.Publish(ctx, "delivery.exchange", routingKey, payloadBytes)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to publish delivery update", "status", status, "error", err)
	} else {
		slog.InfoContext(ctx, "Published delivery update event", "status", status, "order_id", orderID)
	}
}

func (s *DeliveryServiceImpl) publishEvent(ctx context.Context, orderID string, userID string, routingKey string) {
	payload := map[string]any{
		"order_id": orderID,
		"user_id":  userID,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal delivery event payload", "error", err)
		return
	}

	err = s.rabbitClient.Publish(ctx, "delivery.exchange", routingKey, payloadBytes)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to publish delivery event", "routing_key", routingKey, "error", err)
	} else {
		slog.InfoContext(ctx, "Published delivery event", "routing_key", routingKey, "order_id", orderID, "user_id", userID)
	}
}
