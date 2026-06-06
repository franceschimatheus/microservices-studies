package service

import (
	"context"

	"restaurant-service/internal/domain"
)

type RestaurantServiceImpl struct {
	repo domain.RestaurantRepository
}

func NewRestaurantServiceImpl(repo domain.RestaurantRepository) *RestaurantServiceImpl {
	return &RestaurantServiceImpl{repo: repo}
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
	return item, nil
}

func (s *RestaurantServiceImpl) DeleteMenuItem(ctx context.Context, id string) error {
	return s.repo.DeleteMenuItem(ctx, id)
}

func (s *RestaurantServiceImpl) GetMenu(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error) {
	// Verify restaurant exists
	_, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}

	return s.repo.GetMenu(ctx, restaurantID)
}
