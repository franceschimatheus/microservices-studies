package handler

import (
	"context"

	"cart-service/internal/domain"
	pb "cart-service/pb"
)

type GrpcCartHandler struct {
	pb.UnimplementedCartServiceServer
	service domain.CartService
}

func NewGrpcCartHandler(service domain.CartService) *GrpcCartHandler {
	return &GrpcCartHandler{service: service}
}

func (h *GrpcCartHandler) AddItem(ctx context.Context, req *pb.AddItemRequest) (*pb.CartResponse, error) {
	cart, err := h.service.AddItem(ctx, req.UserId, req.RestaurantId, req.MenuItemId, req.Name, req.Price, req.Quantity)
	if err != nil {
		return nil, err
	}
	return h.toProtoResponse(cart), nil
}

func (h *GrpcCartHandler) RemoveItem(ctx context.Context, req *pb.RemoveItemRequest) (*pb.CartResponse, error) {
	cart, err := h.service.RemoveItem(ctx, req.UserId, req.MenuItemId)
	if err != nil {
		return nil, err
	}
	return h.toProtoResponse(cart), nil
}

func (h *GrpcCartHandler) GetCart(ctx context.Context, req *pb.GetCartRequest) (*pb.CartResponse, error) {
	cart, err := h.service.GetCart(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	return h.toProtoResponse(cart), nil
}

func (h *GrpcCartHandler) ClearCart(ctx context.Context, req *pb.ClearCartRequest) (*pb.ClearCartResponse, error) {
	err := h.service.ClearCart(ctx, req.UserId)
	if err != nil {
		return &pb.ClearCartResponse{Success: false}, err
	}
	return &pb.ClearCartResponse{Success: true}, nil
}

func (h *GrpcCartHandler) toProtoResponse(cart *domain.Cart) *pb.CartResponse {
	items := make([]*pb.CartItem, len(cart.Items))
	for i, item := range cart.Items {
		items[i] = &pb.CartItem{
			MenuItemId: item.MenuItemID,
			Name:       item.Name,
			Price:      item.Price,
			Quantity:   item.Quantity,
		}
	}

	return &pb.CartResponse{
		UserId:       cart.UserID,
		RestaurantId: cart.RestaurantID,
		Items:        items,
		TotalPrice:   cart.TotalPrice,
	}
}
