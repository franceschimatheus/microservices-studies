package domain

import "context"

type RestaurantDocument struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Address     string `json:"address"`
}

type MenuItemDocument struct {
	ID           string  `json:"id"`
	RestaurantID string  `json:"restaurant_id"`
	CategoryID   string  `json:"category_id"`
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	Price        float64 `json:"price"`
	Available    bool    `json:"available"`
}

type SearchRepository interface {
	IndexRestaurant(ctx context.Context, doc *RestaurantDocument) error
	IndexMenuItem(ctx context.Context, doc *MenuItemDocument) error
	DeleteMenuItem(ctx context.Context, id string) error
	SearchRestaurants(ctx context.Context, query string) ([]*RestaurantDocument, error)
	SearchMenuItems(ctx context.Context, query string) ([]*MenuItemDocument, error)
}
