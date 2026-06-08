package service

import (
	"context"

	"search-service/internal/domain"
)

type SearchService interface {
	SearchRestaurants(ctx context.Context, query string) ([]*domain.RestaurantDocument, error)
	SearchMenus(ctx context.Context, query string) ([]*domain.MenuItemDocument, error)
	IndexRestaurant(ctx context.Context, doc *domain.RestaurantDocument) error
	IndexMenuItem(ctx context.Context, doc *domain.MenuItemDocument) error
	DeleteMenuItem(ctx context.Context, id string) error
}

type SearchServiceImpl struct {
	repo domain.SearchRepository
}

func NewSearchService(repo domain.SearchRepository) SearchService {
	return &SearchServiceImpl{repo: repo}
}

func (s *SearchServiceImpl) SearchRestaurants(ctx context.Context, query string) ([]*domain.RestaurantDocument, error) {
	return s.repo.SearchRestaurants(ctx, query)
}

func (s *SearchServiceImpl) SearchMenus(ctx context.Context, query string) ([]*domain.MenuItemDocument, error) {
	return s.repo.SearchMenuItems(ctx, query)
}

func (s *SearchServiceImpl) IndexRestaurant(ctx context.Context, doc *domain.RestaurantDocument) error {
	return s.repo.IndexRestaurant(ctx, doc)
}

func (s *SearchServiceImpl) IndexMenuItem(ctx context.Context, doc *domain.MenuItemDocument) error {
	return s.repo.IndexMenuItem(ctx, doc)
}

func (s *SearchServiceImpl) DeleteMenuItem(ctx context.Context, id string) error {
	return s.repo.DeleteMenuItem(ctx, id)
}
