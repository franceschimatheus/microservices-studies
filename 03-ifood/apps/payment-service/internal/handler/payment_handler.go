package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"payment-service/internal/domain"
	"rabbitmq"
)

type OrderCreatedEvent struct {
	OrderID string  `json:"order_id"`
	Total   float64 `json:"total"`
}

type PaymentCompletedEvent struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
}

type PaymentFailedEvent struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

type PaymentHandler struct {
	repo         domain.PaymentRepository
	payService   domain.PaymentService
	rabbitClient *rabbitmq.Client
}

func NewPaymentHandler(repo domain.PaymentRepository, payService domain.PaymentService, rabbitClient *rabbitmq.Client) *PaymentHandler {
	return &PaymentHandler{
		repo:         repo,
		payService:   payService,
		rabbitClient: rabbitClient,
	}
}

func (h *PaymentHandler) HandleOrderCreated(ctx context.Context, body []byte) error {
	var event OrderCreatedEvent
	if err := json.Unmarshal(body, &event); err != nil {
		slog.ErrorContext(ctx, "Failed to unmarshal order.created event", "error", err)
		return nil // Avoid requeuing bad JSON formats
	}

	slog.InfoContext(ctx, "Handling order.created event", "order_id", event.OrderID, "amount", event.Total)

	// Idempotency check: see if we already processed this order's payment
	existing, err := h.repo.GetByOrderID(ctx, event.OrderID)
	if err != nil && !errors.Is(err, domain.ErrPaymentNotFound) {
		slog.ErrorContext(ctx, "Database error during idempotency check", "error", err)
		return err
	}

	if existing != nil {
		slog.InfoContext(ctx, "Payment already processed (idempotent action)", "order_id", event.OrderID, "status", existing.Status)
		// Publish result again to ensure subsequent services receive it (in case of dropped messages)
		if existing.Status == "COMPLETED" {
			return h.publishCompleted(ctx, event.OrderID, existing.ID)
		} else {
			return h.publishFailed(ctx, event.OrderID, "Payment failed during previous attempt")
		}
	}

	// Create a new pending payment record
	paymentID := uuid.New().String()
	p := &domain.Payment{
		ID:        paymentID,
		OrderID:   event.OrderID,
		Amount:    event.Total,
		Status:    "PENDING",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := h.repo.Create(ctx, p); err != nil {
		slog.ErrorContext(ctx, "Failed to save initial payment record", "error", err)
		return err
	}

	// Process the simulated payment transaction
	success, err := h.payService.ProcessPayment(ctx, event.Total)
	if err != nil {
		slog.ErrorContext(ctx, "Error processing payment gateway transaction", "error", err)
		_ = h.repo.UpdateStatus(ctx, paymentID, "FAILED")
		_ = h.publishFailed(ctx, event.OrderID, "Internal gateway error")
		return err
	}

	if !success {
		slog.WarnContext(ctx, "Payment transaction was rejected/failed", "order_id", event.OrderID)
		_ = h.repo.UpdateStatus(ctx, paymentID, "FAILED")
		return h.publishFailed(ctx, event.OrderID, "Transaction rejected by processor")
	}

	slog.InfoContext(ctx, "Payment transaction succeeded", "order_id", event.OrderID, "payment_id", paymentID)
	_ = h.repo.UpdateStatus(ctx, paymentID, "COMPLETED")
	return h.publishCompleted(ctx, event.OrderID, paymentID)
}

func (h *PaymentHandler) publishCompleted(ctx context.Context, orderID, paymentID string) error {
	payload, err := json.Marshal(PaymentCompletedEvent{
		OrderID:   orderID,
		PaymentID: paymentID,
	})
	if err != nil {
		return err
	}
	return h.rabbitClient.Publish(ctx, "payments.exchange", "payment.completed", payload)
}

func (h *PaymentHandler) publishFailed(ctx context.Context, orderID, reason string) error {
	payload, err := json.Marshal(PaymentFailedEvent{
		OrderID: orderID,
		Reason:  reason,
	})
	if err != nil {
		return err
	}
	return h.rabbitClient.Publish(ctx, "payments.exchange", "payment.failed", payload)
}
