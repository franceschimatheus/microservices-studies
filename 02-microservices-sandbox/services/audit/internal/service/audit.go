package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"sync"
	"time"

	"audit/internal/domain"
)

type AuditServiceImpl struct {
	mu     sync.RWMutex
	events []domain.SystemEvent
}

func NewAuditService() domain.AuditService {
	return &AuditServiceImpl{
		events: make([]domain.SystemEvent, 0),
	}
}

func (s *AuditServiceImpl) AddEvent(ctx context.Context, event domain.SystemEvent) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Generate ID if missing
	if event.ID == "" {
		idBytes := make([]byte, 8)
		_, _ = rand.Read(idBytes)
		event.ID = hex.EncodeToString(idBytes)
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Prepend to show newest first, capping at 100 logs
	s.events = append([]domain.SystemEvent{event}, s.events...)
	if len(s.events) > 100 {
		s.events = s.events[:100]
	}
}

func (s *AuditServiceImpl) GetEvents(ctx context.Context) []domain.SystemEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Return a copy to avoid race conditions
	copied := make([]domain.SystemEvent, len(s.events))
	copy(copied, s.events)
	return copied
}

func (s *AuditServiceImpl) GetMetrics(ctx context.Context) domain.SystemMetrics {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var metrics domain.SystemMetrics
	for _, event := range s.events {
		switch event.Type {
		case "OrderCreated":
			metrics.TotalOrders++
		case "PaymentProcessed":
			metrics.TotalPaymentsProcessed++
			if strings.Contains(event.Payload, `"FAILED"`) || strings.Contains(event.Payload, `"status":"FAILED"`) {
				metrics.TotalPaymentsFailed++
			} else {
				metrics.TotalPaymentsSuccess++
			}
		case "NotificationSent":
			metrics.TotalNotificationsSent++
		}
	}

	// Calculate system health percentage based on payment failure rates
	totalActions := metrics.TotalOrders + metrics.TotalPaymentsProcessed + metrics.TotalNotificationsSent
	if totalActions > 0 {
		failureRate := float64(metrics.TotalPaymentsFailed) / float64(totalActions)
		metrics.SystemHealth = (1.0 - failureRate) * 100.0
	} else {
		metrics.SystemHealth = 100.0
	}

	return metrics
}
