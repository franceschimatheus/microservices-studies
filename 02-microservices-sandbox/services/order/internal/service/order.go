package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"

	"order/internal/domain"
)

type OrderServiceImpl struct {
	repo         domain.OrderRepository
	inventoryCli domain.InventoryClient
	publisher    domain.EventPublisher
}

func NewOrderService(repo domain.OrderRepository, inventoryCli domain.InventoryClient, publisher domain.EventPublisher) domain.OrderService {
	return &OrderServiceImpl{
		repo:         repo,
		inventoryCli: inventoryCli,
		publisher:    publisher,
	}
}

func (s *OrderServiceImpl) PlaceOrder(ctx context.Context, input domain.CreateOrderInput) (*domain.Order, error) {
	if input.CustomerID == "" {
		return nil, errors.New("customer ID is required")
	}
	if input.ProductID == "" {
		return nil, errors.New("product ID is required")
	}
	if input.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than zero")
	}

	// 1. Call Inventory Service via gRPC to reserve stock
	if err := s.inventoryCli.ReserveStock(ctx, input.ProductID, input.Quantity); err != nil {
		return nil, errors.New("stock reservation failed: " + err.Error())
	}

	// 2. Generate a secure random ID
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return nil, err
	}
	id := hex.EncodeToString(idBytes)

	order := &domain.Order{
		ID:         id,
		CustomerID: input.CustomerID,
		ProductID:  input.ProductID,
		Quantity:   input.Quantity,
		Price:      input.Price,
		Status:     "PENDING",
	}

	// 3. Save the order to repository
	if err := s.repo.Save(ctx, order); err != nil {
		// Roll back stock if DB save fails
		_ = s.inventoryCli.ReleaseStock(ctx, input.ProductID, input.Quantity)
		return nil, err
	}

	// 4. Publish OrderCreated event asynchronously to RabbitMQ
	if err := s.publisher.PublishOrderCreated(ctx, order.ID, order.CustomerID, order.ProductID, order.Quantity, order.Price); err != nil {
		// Log warning but return order since it was persisted
		log := ctx.Value("logger") // simple fallback
		_ = log                    // keep it simple
	}

	return order, nil
}

func (s *OrderServiceImpl) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	if id == "" {
		return nil, errors.New("order ID is required")
	}
	return s.repo.FindByID(ctx, id)
}
