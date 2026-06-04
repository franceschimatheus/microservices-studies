package service

import (
	"context"
	"errors"

	"inventory/internal/domain"
)

type InventoryServiceImpl struct {
	repo domain.InventoryRepository
}

func NewInventoryService(repo domain.InventoryRepository) domain.InventoryService {
	return &InventoryServiceImpl{
		repo: repo,
	}
}

func (s *InventoryServiceImpl) CheckStock(ctx context.Context, productID string) (int, error) {
	if productID == "" {
		return 0, errors.New("product ID is required")
	}
	return s.repo.GetStock(ctx, productID)
}

func (s *InventoryServiceImpl) Reserve(ctx context.Context, productID string, quantity int) error {
	if productID == "" {
		return errors.New("product ID is required")
	}
	if quantity <= 0 {
		return errors.New("quantity must be greater than zero")
	}
	return s.repo.ReserveStock(ctx, productID, quantity)
}

func (s *InventoryServiceImpl) Release(ctx context.Context, productID string, quantity int) error {
	if productID == "" {
		return errors.New("product ID is required")
	}
	if quantity <= 0 {
		return errors.New("quantity must be greater than zero")
	}
	return s.repo.ReleaseStock(ctx, productID, quantity)
}
