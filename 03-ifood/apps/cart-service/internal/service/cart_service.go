package service

import (
	"context"
	"fmt"

	"cart-service/internal/domain"
)

type CartServiceImpl struct {
	repo domain.CartRepository
}

func NewCartServiceImpl(repo domain.CartRepository) *CartServiceImpl {
	return &CartServiceImpl{repo: repo}
}

func (s *CartServiceImpl) AddItem(ctx context.Context, userID, restaurantID, menuItemID, name string, price float64, quantity int32) (*domain.Cart, error) {
	if quantity <= 0 {
		quantity = 1
	}

	cart, err := s.repo.Get(ctx, userID)
	if err != nil {
		return nil, err
	}

	// If the cart already has items from a different restaurant, reject the add.
	// The caller must clear the cart first before switching restaurants.
	if cart.RestaurantID != "" && restaurantID != "" && cart.RestaurantID != restaurantID && len(cart.Items) > 0 {
		return nil, fmt.Errorf("cart already contains items from restaurant %s; clear cart before adding from a different restaurant", cart.RestaurantID)
	}

	// Set or keep the restaurant
	if restaurantID != "" {
		cart.RestaurantID = restaurantID
	}

	// Find if item already exists in the cart
	found := false
	for _, item := range cart.Items {
		if item.MenuItemID == menuItemID {
			item.Quantity += quantity
			found = true
			break
		}
	}

	if !found {
		cart.Items = append(cart.Items, &domain.CartItem{
			MenuItemID: menuItemID,
			Name:       name,
			Price:      price,
			Quantity:   quantity,
		})
	}

	s.recalculateTotal(cart)

	if err := s.repo.Save(ctx, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func (s *CartServiceImpl) RemoveItem(ctx context.Context, userID, menuItemID string) (*domain.Cart, error) {
	cart, err := s.repo.Get(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Filter out the item
	newItems := []*domain.CartItem{}
	for _, item := range cart.Items {
		if item.MenuItemID != menuItemID {
			newItems = append(newItems, item)
		}
	}
	cart.Items = newItems

	s.recalculateTotal(cart)

	if err := s.repo.Save(ctx, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func (s *CartServiceImpl) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	return s.repo.Get(ctx, userID)
}

func (s *CartServiceImpl) ClearCart(ctx context.Context, userID string) error {
	return s.repo.Delete(ctx, userID)
}

func (s *CartServiceImpl) recalculateTotal(cart *domain.Cart) {
	var total float64
	for _, item := range cart.Items {
		total += item.Price * float64(item.Quantity)
	}
	cart.TotalPrice = total
}
