package handler

import (
	"context"

	"analytics-service/internal/domain"
	pb "analytics-service/pb"
)

type GrpcAnalyticsHandler struct {
	pb.UnimplementedAnalyticsServiceServer
	repo domain.AnalyticsRepository
}

func NewGrpcAnalyticsHandler(repo domain.AnalyticsRepository) *GrpcAnalyticsHandler {
	return &GrpcAnalyticsHandler{repo: repo}
}

func (h *GrpcAnalyticsHandler) GetKPIs(ctx context.Context, req *pb.GetKPIsRequest) (*pb.GetKPIsResponse, error) {
	kpi, err := h.repo.GetKPIs(ctx)
	if err != nil {
		return nil, err
	}

	return &pb.GetKPIsResponse{
		TotalOrders:           kpi.TotalOrders,
		TotalRevenue:          kpi.TotalRevenue,
		TotalDeliveredOrders:  kpi.TotalDeliveredOrders,
		TotalCancelledOrders:  kpi.TotalCancelledOrders,
		PaymentSuccessRate:    kpi.PaymentSuccessRate,
		AvgDeliverySeconds:    kpi.AvgDeliverySeconds,
	}, nil
}
