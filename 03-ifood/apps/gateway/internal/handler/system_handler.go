package handler

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os/exec"
	"strings"
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

type ServiceStateRequest struct {
	Action string `json:"action"` // "start" or "stop"
}

// GetServiceStatuses uses the local docker CLI to query container status
func (h *SystemHandler) GetServiceStatuses(c *fiber.Ctx) error {
	ctx := context.Background()
	
	// Execute: docker ps -a --format '{{.Names}} {{.State}}'
	cmd := exec.CommandContext(ctx, "docker", "ps", "-a", "--format", "{{.Names}}={{.State}}")
	output, err := cmd.Output()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to run docker ps", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get service statuses"})
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	statuses := make(map[string]string)
	
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			name := parts[0]
			state := parts[1]
			// e.g. "order-service-ifood" -> "order-service"
			if strings.HasSuffix(name, "-ifood") {
				svcName := strings.TrimSuffix(name, "-ifood")
				statuses[svcName] = state
			}
		}
	}

	return c.Status(fiber.StatusOK).JSON(statuses)
}

// ToggleServiceState uses docker start/stop to simulate a crash
func (h *SystemHandler) ToggleServiceState(c *fiber.Ctx) error {
	ctx := context.Background()
	name := c.Params("name")
	
	var req ServiceStateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Action != "start" && req.Action != "stop" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Action must be 'start' or 'stop'"})
	}

	// Gateway and DBs should ideally not be stopped via this UI, but we'll let it be a true chaos tool.
	// We append -ifood to match the container name
	containerName := fmt.Sprintf("%s-ifood", name)

	cmd := exec.CommandContext(ctx, "docker", req.Action, containerName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		slog.ErrorContext(ctx, "Failed to toggle container", "container", containerName, "action", req.Action, "error", err, "output", string(output))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Failed to %s container: %s", req.Action, string(output))})
	}

	slog.InfoContext(ctx, "Successfully toggled container", "container", containerName, "action", req.Action)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "container": containerName, "action": req.Action})
}
