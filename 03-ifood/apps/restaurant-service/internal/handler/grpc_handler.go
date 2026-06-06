package handler

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"restaurant-service/internal/domain"
	pb "restaurant-service/pb"
)

type GrpcRestaurantHandler struct {
	pb.UnimplementedRestaurantServiceServer
	service domain.RestaurantService
}

func NewGrpcRestaurantHandler(service domain.RestaurantService) *GrpcRestaurantHandler {
	return &GrpcRestaurantHandler{service: service}
}

func (h *GrpcRestaurantHandler) CreateRestaurant(ctx context.Context, req *pb.CreateRestaurantRequest) (*pb.RestaurantResponse, error) {
	rest, err := h.service.CreateRestaurant(ctx, req.GetName(), req.GetDescription(), req.GetAddress())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create restaurant: %v", err)
	}

	return &pb.RestaurantResponse{
		Id:          rest.ID,
		Name:        rest.Name,
		Description: rest.Description,
		Address:     rest.Address,
		CreatedAt:   rest.CreatedAt.String(),
	}, nil
}

func (h *GrpcRestaurantHandler) UpdateRestaurant(ctx context.Context, req *pb.UpdateRestaurantRequest) (*pb.RestaurantResponse, error) {
	rest, err := h.service.UpdateRestaurant(ctx, req.GetId(), req.GetName(), req.GetDescription(), req.GetAddress())
	if err != nil {
		if errors.Is(err, domain.ErrRestaurantNotFound) {
			return nil, status.Error(codes.NotFound, "restaurant not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to update restaurant: %v", err)
	}

	return &pb.RestaurantResponse{
		Id:          rest.ID,
		Name:        rest.Name,
		Description: rest.Description,
		Address:     rest.Address,
		CreatedAt:   rest.CreatedAt.String(),
	}, nil
}

func (h *GrpcRestaurantHandler) GetRestaurant(ctx context.Context, req *pb.GetRestaurantRequest) (*pb.RestaurantResponse, error) {
	rest, err := h.service.GetRestaurant(ctx, req.GetId())
	if err != nil {
		if errors.Is(err, domain.ErrRestaurantNotFound) {
			return nil, status.Error(codes.NotFound, "restaurant not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get restaurant: %v", err)
	}

	return &pb.RestaurantResponse{
		Id:          rest.ID,
		Name:        rest.Name,
		Description: rest.Description,
		Address:     rest.Address,
		CreatedAt:   rest.CreatedAt.String(),
	}, nil
}

func (h *GrpcRestaurantHandler) ListRestaurants(ctx context.Context, req *pb.ListRestaurantsRequest) (*pb.ListRestaurantsResponse, error) {
	rests, err := h.service.ListRestaurants(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list restaurants: %v", err)
	}

	var pbRests []*pb.RestaurantResponse
	for _, rest := range rests {
		pbRests = append(pbRests, &pb.RestaurantResponse{
			Id:          rest.ID,
			Name:        rest.Name,
			Description: rest.Description,
			Address:     rest.Address,
			CreatedAt:   rest.CreatedAt.String(),
		})
	}

	return &pb.ListRestaurantsResponse{Restaurants: pbRests}, nil
}

func (h *GrpcRestaurantHandler) CreateCategory(ctx context.Context, req *pb.CreateCategoryRequest) (*pb.CategoryResponse, error) {
	cat, err := h.service.CreateCategory(ctx, req.GetRestaurantId(), req.GetName())
	if err != nil {
		if errors.Is(err, domain.ErrRestaurantNotFound) {
			return nil, status.Error(codes.NotFound, "restaurant not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to create category: %v", err)
	}

	return &pb.CategoryResponse{
		Id:           cat.ID,
		RestaurantId: cat.RestaurantID,
		Name:         cat.Name,
	}, nil
}

func (h *GrpcRestaurantHandler) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	cats, err := h.service.ListCategories(ctx, req.GetRestaurantId())
	if err != nil {
		if errors.Is(err, domain.ErrRestaurantNotFound) {
			return nil, status.Error(codes.NotFound, "restaurant not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to list categories: %v", err)
	}

	var pbCats []*pb.CategoryResponse
	for _, cat := range cats {
		pbCats = append(pbCats, &pb.CategoryResponse{
			Id:           cat.ID,
			RestaurantId: cat.RestaurantID,
			Name:         cat.Name,
		})
	}

	return &pb.ListCategoriesResponse{Categories: pbCats}, nil
}

func (h *GrpcRestaurantHandler) CreateMenuItem(ctx context.Context, req *pb.CreateMenuItemRequest) (*pb.MenuItemResponse, error) {
	item, err := h.service.CreateMenuItem(ctx, req.GetCategoryId(), req.GetName(), req.GetDescription(), req.GetPrice())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create menu item: %v", err)
	}

	return &pb.MenuItemResponse{
		Id:          item.ID,
		CategoryId:  item.CategoryID,
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Available:   item.Available,
	}, nil
}

func (h *GrpcRestaurantHandler) UpdateMenuItem(ctx context.Context, req *pb.UpdateMenuItemRequest) (*pb.MenuItemResponse, error) {
	item, err := h.service.UpdateMenuItem(ctx, req.GetId(), req.GetName(), req.GetDescription(), req.GetPrice(), req.GetAvailable())
	if err != nil {
		if errors.Is(err, domain.ErrMenuItemNotFound) {
			return nil, status.Error(codes.NotFound, "menu item not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to update menu item: %v", err)
	}

	return &pb.MenuItemResponse{
		Id:          item.ID,
		CategoryId:  item.CategoryID,
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Available:   item.Available,
	}, nil
}

func (h *GrpcRestaurantHandler) DeleteMenuItem(ctx context.Context, req *pb.DeleteMenuItemRequest) (*pb.DeleteMenuItemResponse, error) {
	err := h.service.DeleteMenuItem(ctx, req.GetId())
	if err != nil {
		if errors.Is(err, domain.ErrMenuItemNotFound) {
			return nil, status.Error(codes.NotFound, "menu item not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to delete menu item: %v", err)
	}

	return &pb.DeleteMenuItemResponse{Success: true}, nil
}

func (h *GrpcRestaurantHandler) GetMenu(ctx context.Context, req *pb.GetMenuRequest) (*pb.GetMenuResponse, error) {
	items, err := h.service.GetMenu(ctx, req.GetRestaurantId())
	if err != nil {
		if errors.Is(err, domain.ErrRestaurantNotFound) {
			return nil, status.Error(codes.NotFound, "restaurant not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get menu: %v", err)
	}

	var pbItems []*pb.MenuItemResponse
	for _, item := range items {
		pbItems = append(pbItems, &pb.MenuItemResponse{
			Id:          item.ID,
			CategoryId:  item.CategoryID,
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Available:   item.Available,
		})
	}

	return &pb.GetMenuResponse{Items: pbItems}, nil
}
