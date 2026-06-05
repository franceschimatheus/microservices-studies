package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	pb "auth-service/pb"
)

type AuthHandler struct {
	authClient pb.AuthServiceClient
}

func NewAuthHandler(authClient pb.AuthServiceClient) *AuthHandler {
	return &AuthHandler{authClient: authClient}
}

func (h *AuthHandler) SignUp(c *fiber.Ctx) error {
	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.authClient.SignUp(ctx, &pb.SignUpRequest{
		Email:    req.Email,
		Password: req.Password,
		Role:     req.Role,
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"user_id": resp.UserId,
		"email":   resp.Email,
		"role":    resp.Role,
	})
}

func (h *AuthHandler) SignIn(c *fiber.Ctx) error {
	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.authClient.SignIn(ctx, &pb.SignInRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "__Secure-session-token",
		Value:    resp.Token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{
		"user_id": resp.UserId,
		"email":   resp.Email,
		"role":    resp.Role,
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	token := c.Cookies("__Secure-session-token")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.authClient.ValidateToken(ctx, &pb.ValidateTokenRequest{
		Token: token,
	})
	if err != nil || !resp.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	return c.JSON(fiber.Map{
		"user_id": resp.UserId,
		"email":   resp.Email,
		"role":    resp.Role,
	})
}

func (h *AuthHandler) SignOut(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "__Secure-session-token",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{"message": "Sign out successful"})
}
