package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"rabbitmq"
	"restaurant-service/internal/domain"
)

type RestaurantServiceImpl struct {
	repo         domain.RestaurantRepository
	rabbitClient *rabbitmq.Client
}

func NewRestaurantServiceImpl(repo domain.RestaurantRepository, rabbitClient *rabbitmq.Client) *RestaurantServiceImpl {
	return &RestaurantServiceImpl{
		repo:         repo,
		rabbitClient: rabbitClient,
	}
}

func (s *RestaurantServiceImpl) publishRestaurantEvent(ctx context.Context, action string, rest *domain.Restaurant) {
	if s.rabbitClient == nil {
		return
	}
	payload := map[string]any{
		"action": action,
		"restaurant": map[string]any{
			"id":          rest.ID,
			"name":        rest.Name,
			"description": rest.Description,
			"address":     rest.Address,
		},
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal restaurant event", "error", err)
		return
	}
	routingKey := "restaurant.created"
	if action == "update" {
		routingKey = "restaurant.updated"
	}
	err = s.rabbitClient.Publish(ctx, "restaurants.exchange", routingKey, payloadBytes)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to publish restaurant event", "error", err, "routingKey", routingKey)
	} else {
		slog.InfoContext(ctx, "Published restaurant event", "action", action, "restaurant_id", rest.ID)
	}
}

func (s *RestaurantServiceImpl) publishMenuEvent(ctx context.Context, action string, item *domain.MenuItem) {
	if s.rabbitClient == nil {
		return
	}
	var restaurantID string
	cat, err := s.repo.GetCategoryByID(ctx, item.CategoryID)
	if err == nil && cat != nil {
		restaurantID = cat.RestaurantID
	}

	payload := map[string]any{
		"action": action,
		"menu_item": map[string]any{
			"id":            item.ID,
			"restaurant_id": restaurantID,
			"category_id":   item.CategoryID,
			"name":          item.Name,
			"description":   item.Description,
			"price":         item.Price,
			"available":     item.Available,
		},
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to marshal menu event", "error", err)
		return
	}
	err = s.rabbitClient.Publish(ctx, "restaurants.exchange", "menu.updated", payloadBytes)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to publish menu event", "error", err)
	} else {
		slog.InfoContext(ctx, "Published menu event", "action", action, "item_id", item.ID)
	}
}

func (s *RestaurantServiceImpl) CreateRestaurant(ctx context.Context, name, description, address string) (*domain.Restaurant, error) {
	rest := &domain.Restaurant{
		Name:        name,
		Description: description,
		Address:     address,
	}
	err := s.repo.Create(ctx, rest)
	if err != nil {
		return nil, err
	}
	s.publishRestaurantEvent(ctx, "create", rest)
	return rest, nil
}

func (s *RestaurantServiceImpl) UpdateRestaurant(ctx context.Context, id, name, description, address string) (*domain.Restaurant, error) {
	rest, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	rest.Name = name
	rest.Description = description
	rest.Address = address

	err = s.repo.Update(ctx, rest)
	if err != nil {
		return nil, err
	}
	s.publishRestaurantEvent(ctx, "update", rest)
	return rest, nil
}

func (s *RestaurantServiceImpl) GetRestaurant(ctx context.Context, id string) (*domain.Restaurant, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *RestaurantServiceImpl) ListRestaurants(ctx context.Context) ([]*domain.Restaurant, error) {
	return s.repo.List(ctx)
}

func (s *RestaurantServiceImpl) CreateCategory(ctx context.Context, restaurantID, name string) (*domain.Category, error) {
	// Verify restaurant exists first
	_, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}

	cat := &domain.Category{
		RestaurantID: restaurantID,
		Name:         name,
	}
	err = s.repo.CreateCategory(ctx, cat)
	if err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *RestaurantServiceImpl) ListCategories(ctx context.Context, restaurantID string) ([]*domain.Category, error) {
	// Verify restaurant exists
	_, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}

	return s.repo.ListCategories(ctx, restaurantID)
}

func (s *RestaurantServiceImpl) CreateMenuItem(ctx context.Context, categoryID, name, description string, price float64) (*domain.MenuItem, error) {
	item := &domain.MenuItem{
		CategoryID:  categoryID,
		Name:         name,
		Description: description,
		Price:       price,
		Available:   true,
	}
	err := s.repo.CreateMenuItem(ctx, item)
	if err != nil {
		return nil, err
	}
	s.publishMenuEvent(ctx, "upsert", item)
	return item, nil
}

func (s *RestaurantServiceImpl) UpdateMenuItem(ctx context.Context, id, name, description string, price float64, available bool) (*domain.MenuItem, error) {
	item, err := s.repo.GetMenuItemByID(ctx, id)
	if err != nil {
		return nil, err
	}

	item.Name = name
	item.Description = description
	item.Price = price
	item.Available = available

	err = s.repo.UpdateMenuItem(ctx, item)
	if err != nil {
		return nil, err
	}
	s.publishMenuEvent(ctx, "upsert", item)
	return item, nil
}

func (s *RestaurantServiceImpl) DeleteMenuItem(ctx context.Context, id string) error {
	item, err := s.repo.GetMenuItemByID(ctx, id)
	if err != nil {
		return err
	}
	err = s.repo.DeleteMenuItem(ctx, id)
	if err != nil {
		return err
	}
	s.publishMenuEvent(ctx, "delete", item)
	return nil
}

func (s *RestaurantServiceImpl) GetMenu(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error) {
	// Verify restaurant exists
	_, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}

	return s.repo.GetMenu(ctx, restaurantID)
}
