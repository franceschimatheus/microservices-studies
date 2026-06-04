package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"

	"payment/internal/domain"
)

type PaymentServiceImpl struct {
	repo domain.PaymentRepository
}

func NewPaymentService(repo domain.PaymentRepository) domain.PaymentService {
	return &PaymentServiceImpl{
		repo: repo,
	}
}

func (s *PaymentServiceImpl) ProcessPayment(ctx context.Context, orderID string, amount float64) (*domain.Transaction, error) {
	if orderID == "" {
		return nil, errors.New("order ID is required")
	}
	if amount <= 0 {
		return nil, errors.New("amount must be greater than zero")
	}

	// Generate transaction ID
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return nil, err
	}
	txID := hex.EncodeToString(idBytes)

	// Generate external reference mock
	refBytes := make([]byte, 8)
	_, _ = rand.Read(refBytes)
	reference := "pay_ref_" + hex.EncodeToString(refBytes)

	tx := &domain.Transaction{
		ID:        txID,
		OrderID:   orderID,
		Amount:    amount,
		Status:    "SUCCESS", // Default to success in mock
		Reference: reference,
	}

	// Simulate payment policy: amount > 1000 fails (for Saga/failure path tests)
	if amount > 1000 {
		tx.Status = "FAILED"
	}

	if err := s.repo.Save(ctx, tx); err != nil {
		return nil, err
	}

	return tx, nil
}
