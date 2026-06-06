package service

import (
	"context"
	"crypto/rand"
	"math/big"
	"time"
)

type PaymentServiceImpl struct{}

func NewPaymentServiceImpl() *PaymentServiceImpl {
	return &PaymentServiceImpl{}
}

func (s *PaymentServiceImpl) ProcessPayment(ctx context.Context, amount float64) (bool, error) {
	// Simulate gateway latency (between 500ms and 1500ms)
	time.Sleep(800 * time.Millisecond)

	// Simulate failure rate: 10% chance of failure
	nBig, err := rand.Int(rand.Reader, big.NewInt(100))
	if err != nil {
		return false, err
	}
	randomNum := nBig.Int64()
	if randomNum < 10 {
		return false, nil // Failed payment
	}

	return true, nil // Successful payment
}
