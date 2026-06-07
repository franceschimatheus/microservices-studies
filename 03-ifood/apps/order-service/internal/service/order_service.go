package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"order-service/internal/domain"
	"rabbitmq"
)

type OrderService interface {
	CreateOrder(ctx context.Context, userID, restaurantID string, items []domain.OrderItem) (*domain.Order, error)
	GetOrder(ctx context.Context, id string) (*domain.Order, error)
	ListOrders(ctx context.Context, userID string) ([]*domain.Order, error)
	UpdateOrderStatus(ctx context.Context, id string, status string) (*domain.Order, error)
}

type OrderServiceImpl struct {
	repo         domain.OrderRepository
	rabbitClient *rabbitmq.Client
}

func NewOrderService(repo domain.OrderRepository, rabbitClient *rabbitmq.Client) *OrderServiceImpl {
	return &OrderServiceImpl{
		repo:         repo,
		rabbitClient: rabbitClient,
	}
}

func (s *OrderServiceImpl) CreateOrder(ctx context.Context, userID, restaurantID string, items []domain.OrderItem) (*domain.Order, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}
	if restaurantID == "" {
		return nil, errors.New("restaurant_id is required")
	}
	if len(items) == 0 {
		return nil, errors.New("order must have at least one item")
	}

	var totalPrice float64
	for _, item := range items {
		if item.MenuItemID == "" {
			return nil, errors.New("menu_item_id is required for all items")
		}
		if item.Quantity <= 0 {
			return nil, errors.New("quantity must be greater than zero")
		}
		if item.Price < 0 {
			return nil, errors.New("price cannot be negative")
		}
		totalPrice += item.Price * float64(item.Quantity)
	}

	order := &domain.Order{
		UserID:       userID,
		RestaurantID: restaurantID,
		TotalPrice:   totalPrice,
		Items:        items,
	}

	if err := s.repo.Create(ctx, order); err != nil {
		slog.ErrorContext(ctx, "failed to create order in repo", "error", err)
		return nil, err
	}

	slog.InfoContext(ctx, "order created successfully", "order_id", order.ID, "total_price", order.TotalPrice)

	// Publish order.created event to RabbitMQ
	eventPayload := map[string]any{
		"order_id": order.ID,
		"user_id":  order.UserID,
		"total":    order.TotalPrice,
	}
	payloadBytes, err := json.Marshal(eventPayload)
	if err != nil {
		slog.ErrorContext(ctx, "failed to marshal order.created event", "error", err)
	} else {
		err = s.rabbitClient.Publish(ctx, "orders.exchange", "order.created", payloadBytes)
		if err != nil {
			slog.ErrorContext(ctx, "failed to publish order.created event", "error", err)
		} else {
			slog.InfoContext(ctx, "order.created event published", "order_id", order.ID)
		}
	}

	return order, nil
}

func (s *OrderServiceImpl) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	if id == "" {
		return nil, errors.New("order_id is required")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *OrderServiceImpl) ListOrders(ctx context.Context, userID string) ([]*domain.Order, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}
	return s.repo.ListByUserID(ctx, userID)
}

func (s *OrderServiceImpl) UpdateOrderStatus(ctx context.Context, id string, status string) (*domain.Order, error) {
	if id == "" {
		return nil, errors.New("order_id is required")
	}
	if status == "" {
		return nil, errors.New("status is required")
	}

	// Simple status validation
	validStatuses := map[string]bool{
		"PENDING":   true,
		"CONFIRMED": true,
		"PREPARING": true,
		"DELIVERED": true,
		"CANCELLED": true,
	}
	if !validStatuses[status] {
		return nil, fmt.Errorf("invalid status: %s", status)
	}

	order, err := s.repo.GetByID(ctx, id)
	if err != nil {
		slog.ErrorContext(ctx, "failed to get order before status update", "order_id", id, "error", err)
		return nil, err
	}

	if err := s.repo.UpdateStatus(ctx, id, status); err != nil {
		slog.ErrorContext(ctx, "failed to update order status", "order_id", id, "status", status, "error", err)
		return nil, err
	}

	slog.InfoContext(ctx, "order status updated", "order_id", id, "status", status)

	// Publish order.updated event
	eventPayload := map[string]any{
		"order_id": id,
		"user_id":  order.UserID,
		"status":   status,
	}
	payloadBytes, err := json.Marshal(eventPayload)
	if err != nil {
		slog.ErrorContext(ctx, "failed to marshal order.updated event", "error", err)
	} else {
		err = s.rabbitClient.Publish(ctx, "orders.exchange", "order.updated", payloadBytes)
		if err != nil {
			slog.ErrorContext(ctx, "failed to publish order.updated event", "error", err)
		} else {
			slog.InfoContext(ctx, "order.updated event published", "order_id", id, "status", status)
		}
	}

	order.Status = status
	return order, nil
}
