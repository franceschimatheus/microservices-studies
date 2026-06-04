package service

import (
	"context"
	"errors"
	"log"

	"notification/internal/domain"
)

type NotificationServiceImpl struct{}

func NewNotificationService() domain.NotificationService {
	return &NotificationServiceImpl{}
}

func (s *NotificationServiceImpl) SendOrderNotification(ctx context.Context, orderID string, recipient string, message string) error {
	if orderID == "" {
		return errors.New("order ID is required")
	}
	if recipient == "" {
		return errors.New("recipient is required")
	}
	if message == "" {
		return errors.New("message content is required")
	}

	// In a real system, we'd integrate with an SMTP client or Twilio/SNS SMS gateway.
	// For this study sandbox, we log the notification event.
	log.Printf("[NOTIFICATION SENT] To: %s | Order: %s | Message: %s", recipient, orderID, message)
	return nil
}
