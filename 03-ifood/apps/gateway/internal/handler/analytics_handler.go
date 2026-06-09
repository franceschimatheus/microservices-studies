package handler

import (
	"context"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	pb "analytics-service/pb"
	authpb "auth-service/pb"
)

type AnalyticsHandler struct {
	analyticsClient pb.AnalyticsServiceClient
	authClient      authpb.AuthServiceClient
}

func NewAnalyticsHandler(analyticsClient pb.AnalyticsServiceClient, authClient authpb.AuthServiceClient) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsClient: analyticsClient,
		authClient:      authClient,
	}
}

func (h *AnalyticsHandler) GetKPIs(c *fiber.Ctx) error {
	token := c.Cookies("__Secure-session-token")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	// 1. Validate session
	authResp, err := h.authClient.ValidateToken(ctx, &authpb.ValidateTokenRequest{Token: token})
	if err != nil || !authResp.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 2. Check authorization (Admin role required)
	if authResp.Role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Admin access required"})
	}

	// 3. Query KPIs from analytics microservice
	resp, err := h.analyticsClient.GetKPIs(ctx, &pb.GetKPIsRequest{})
	if err != nil {
		slog.ErrorContext(ctx, "Failed to query analytics KPIs via gRPC", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch platform metrics"})
	}

	return c.JSON(fiber.Map{
		"total_orders":           resp.TotalOrders,
		"total_revenue":          resp.TotalRevenue,
		"total_delivered_orders": resp.TotalDeliveredOrders,
		"total_cancelled_orders": resp.TotalCancelledOrders,
		"payment_success_rate":    resp.PaymentSuccessRate,
		"avg_delivery_seconds":    resp.AvgDeliverySeconds,
	})
}
