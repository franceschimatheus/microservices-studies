package handler

import (
	"context"

	"inventory/internal/domain"
	"inventory/pkg/pb"
)

type GRPCHandler struct {
	pb.UnimplementedInventoryServiceServer
	service domain.InventoryService
}

func NewGRPCHandler(service domain.InventoryService) *GRPCHandler {
	return &GRPCHandler{
		service: service,
	}
}

func (h *GRPCHandler) CheckStock(ctx context.Context, req *pb.CheckStockRequest) (*pb.CheckStockResponse, error) {
	stock, err := h.service.CheckStock(ctx, req.GetProductId())
	if err != nil {
		return nil, err
	}
	return &pb.CheckStockResponse{
		ProductId: req.GetProductId(),
		Stock:     int32(stock),
	}, nil
}

func (h *GRPCHandler) ReserveStock(ctx context.Context, req *pb.ReserveStockRequest) (*pb.ReserveStockResponse, error) {
	err := h.service.Reserve(ctx, req.GetProductId(), int(req.GetQuantity()))
	if err != nil {
		return &pb.ReserveStockResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}
	return &pb.ReserveStockResponse{
		Success: true,
		Message: "stock reserved successfully",
	}, nil
}

func (h *GRPCHandler) ReleaseStock(ctx context.Context, req *pb.ReleaseStockRequest) (*pb.ReleaseStockResponse, error) {
	err := h.service.Release(ctx, req.GetProductId(), int(req.GetQuantity()))
	if err != nil {
		return &pb.ReleaseStockResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}
	return &pb.ReleaseStockResponse{
		Success: true,
		Message: "stock released successfully",
	}, nil
}
