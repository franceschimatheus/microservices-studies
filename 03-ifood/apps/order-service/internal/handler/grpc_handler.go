package handler

import (
	"context"
	"time"

	"order-service/internal/domain"
	"order-service/internal/service"
	pb "order-service/pb"
)

type GrpcOrderHandler struct {
	pb.UnimplementedOrderServiceServer
	service service.OrderService
}

func NewGrpcOrderHandler(service service.OrderService) *GrpcOrderHandler {
	return &GrpcOrderHandler{service: service}
}

func (h *GrpcOrderHandler) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.OrderResponse, error) {
	var domainItems []domain.OrderItem
	for _, item := range req.Items {
		domainItems = append(domainItems, domain.OrderItem{
			MenuItemID: item.MenuItemId,
			Name:       item.Name,
			Price:      item.Price,
			Quantity:   int(item.Quantity),
		})
	}

	order, err := h.service.CreateOrder(ctx, req.UserId, req.RestaurantId, domainItems)
	if err != nil {
		return nil, err
	}

	return h.toProtoResponse(order), nil
}

func (h *GrpcOrderHandler) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.OrderResponse, error) {
	order, err := h.service.GetOrder(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return h.toProtoResponse(order), nil
}

func (h *GrpcOrderHandler) ListOrders(ctx context.Context, req *pb.ListOrdersRequest) (*pb.ListOrdersResponse, error) {
	orders, err := h.service.ListOrders(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	var protoOrders []*pb.OrderResponse
	for _, order := range orders {
		protoOrders = append(protoOrders, h.toProtoResponse(order))
	}

	return &pb.ListOrdersResponse{Orders: protoOrders}, nil
}

func (h *GrpcOrderHandler) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusRequest) (*pb.OrderResponse, error) {
	order, err := h.service.UpdateOrderStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}
	return h.toProtoResponse(order), nil
}

func (h *GrpcOrderHandler) toProtoResponse(order *domain.Order) *pb.OrderResponse {
	var protoItems []*pb.OrderItem
	for _, item := range order.Items {
		protoItems = append(protoItems, &pb.OrderItem{
			MenuItemId: item.MenuItemID,
			Name:       item.Name,
			Price:      item.Price,
			Quantity:   int32(item.Quantity),
		})
	}

	return &pb.OrderResponse{
		Id:           order.ID,
		UserId:       order.UserID,
		RestaurantId: order.RestaurantID,
		TotalPrice:   order.TotalPrice,
		Status:       order.Status,
		Items:        protoItems,
		CreatedAt:    order.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    order.UpdatedAt.Format(time.RFC3339),
	}
}
