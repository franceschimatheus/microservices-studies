package domain

import (
	"context"
	"errors"
)

var (
	ErrCartNotFound = errors.New("cart not found")
)

type CartItem struct {
	MenuItemID string  `json:"menu_item_id"`
	Name       string  `json:"name"`
	Price      float64 `json:"price"`
	Quantity   int32   `json:"quantity"`
}

type Cart struct {
	UserID       string      `json:"user_id"`
	RestaurantID string      `json:"restaurant_id"`
	Items        []*CartItem `json:"items"`
	TotalPrice   float64     `json:"total_price"`
}

type CartRepository interface {
	Get(ctx context.Context, userID string) (*Cart, error)
	Save(ctx context.Context, cart *Cart) error
	Delete(ctx context.Context, userID string) error
}

type CartService interface {
	AddItem(ctx context.Context, userID, restaurantID, menuItemID, name string, price float64, quantity int32) (*Cart, error)
	RemoveItem(ctx context.Context, userID, menuItemID string) (*Cart, error)
	GetCart(ctx context.Context, userID string) (*Cart, error)
	ClearCart(ctx context.Context, userID string) error
}
