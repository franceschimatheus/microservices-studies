package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

type NotificationService interface {
	SendEmail(ctx context.Context, userID, subject, body string) error
	PublishToSSE(ctx context.Context, userID string, eventType string, payload any) error
}

type NotificationServiceImpl struct {
	redisClient *redis.Client
}

func NewNotificationService(redisClient *redis.Client) NotificationService {
	return &NotificationServiceImpl{
		redisClient: redisClient,
	}
}

func (s *NotificationServiceImpl) SendEmail(ctx context.Context, userID, subject, body string) error {
	// Simulate sending email using structured logging
	slog.InfoContext(ctx, "✉️ [EMAIL SIMULATION] Sending Email",
		"recipient_user_id", userID,
		"subject", subject,
		"message_body", body,
	)
	return nil
}

func (s *NotificationServiceImpl) PublishToSSE(ctx context.Context, userID string, eventType string, payload any) error {
	msg := map[string]any{
		"type":    eventType,
		"payload": payload,
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal SSE payload", "error", err)
		return err
	}

	channel := "notifications:user:" + userID
	err = s.redisClient.Publish(ctx, channel, msgBytes).Err()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to publish SSE event to Redis Pub/Sub", "channel", channel, "error", err)
		return err
	}

	slog.InfoContext(ctx, "📶 Published real-time update to Redis Pub/Sub", "channel", channel, "event_type", eventType)
	return nil
}
