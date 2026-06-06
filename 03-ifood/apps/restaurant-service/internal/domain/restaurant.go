package domain

import (
	"context"
	"errors"
	"time"
)

var (
	ErrRestaurantNotFound = errors.New("restaurant not found")
	ErrCategoryNotFound   = errors.New("category not found")
	ErrMenuItemNotFound   = errors.New("menu item not found")
)

type Restaurant struct {
	ID          string
	Name        string
	Description string
	Address     string
	CreatedAt   time.Time
}

type Category struct {
	ID           string
	RestaurantID string
	Name         string
}

type MenuItem struct {
	ID          string
	CategoryID  string
	Name        string
	Description string
	Price       float64
	Available   bool
	CreatedAt   time.Time
}

type RestaurantRepository interface {
	Create(ctx context.Context, rest *Restaurant) error
	Update(ctx context.Context, rest *Restaurant) error
	GetByID(ctx context.Context, id string) (*Restaurant, error)
	List(ctx context.Context) ([]*Restaurant, error)

	CreateCategory(ctx context.Context, cat *Category) error
	ListCategories(ctx context.Context, restaurantID string) ([]*Category, error)

	CreateMenuItem(ctx context.Context, item *MenuItem) error
	UpdateMenuItem(ctx context.Context, item *MenuItem) error
	DeleteMenuItem(ctx context.Context, id string) error
	GetMenuItemByID(ctx context.Context, id string) (*MenuItem, error)
	GetMenu(ctx context.Context, restaurantID string) ([]*MenuItem, error)
}

type RestaurantService interface {
	CreateRestaurant(ctx context.Context, name, description, address string) (*Restaurant, error)
	UpdateRestaurant(ctx context.Context, id, name, description, address string) (*Restaurant, error)
	GetRestaurant(ctx context.Context, id string) (*Restaurant, error)
	ListRestaurants(ctx context.Context) ([]*Restaurant, error)

	CreateCategory(ctx context.Context, restaurantID, name string) (*Category, error)
	ListCategories(ctx context.Context, restaurantID string) ([]*Category, error)

	CreateMenuItem(ctx context.Context, categoryID, name, description string, price float64) (*MenuItem, error)
	UpdateMenuItem(ctx context.Context, id, name, description string, price float64, available bool) (*MenuItem, error)
	DeleteMenuItem(ctx context.Context, id string) error
	GetMenu(ctx context.Context, restaurantID string) ([]*MenuItem, error)
}
