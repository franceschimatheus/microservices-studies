package handler

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	authpb "auth-service/pb"
)

type SystemHandler struct {
	authClient authpb.AuthServiceClient
}

func NewSystemHandler(authClient authpb.AuthServiceClient) *SystemHandler {
	return &SystemHandler{
		authClient: authClient,
	}
}

func (h *SystemHandler) ResetSystem(c *fiber.Ctx) error {
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

	// 2. Verify admin permission
	if authResp.Role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Admin access required"})
	}

	// 3. Trigger bootstrap-service reset
	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Post("http://bootstrap-service:8090/reset", "application/json", nil)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to call bootstrap-service /reset", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to trigger system reset"})
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		slog.ErrorContext(ctx, "Bootstrap-service returned error", "status", resp.Status, "body", string(bodyBytes))
		return c.Status(resp.StatusCode).Send(bodyBytes)
	}

	return c.Status(fiber.StatusOK).Send(bodyBytes)
}
