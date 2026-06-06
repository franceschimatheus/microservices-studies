package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	authpb "auth-service/pb"
	pb "cart-service/pb"
)

type CartHandler struct {
	client     pb.CartServiceClient
	authClient authpb.AuthServiceClient
}

func NewCartHandler(client pb.CartServiceClient, authClient authpb.AuthServiceClient) *CartHandler {
	return &CartHandler{
		client:     client,
		authClient: authClient,
	}
}

func (h *CartHandler) getAuthenticatedUserID(c *fiber.Ctx) (string, error) {
	token := c.Cookies("__Secure-session-token")
	if token == "" {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Unauthorized")
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.authClient.ValidateToken(ctx, &authpb.ValidateTokenRequest{
		Token: token,
	})
	if err != nil || !resp.Valid {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Unauthorized")
	}

	return resp.UserId, nil
}

func formatCartResponse(resp *pb.CartResponse) fiber.Map {
	items := resp.Items
	if items == nil {
		items = []*pb.CartItem{}
	}
	return fiber.Map{
		"user_id":       resp.UserId,
		"restaurant_id": resp.RestaurantId,
		"items":         items,
		"total_price":   resp.TotalPrice,
	}
}

func (h *CartHandler) GetCart(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.GetCart(ctx, &pb.GetCartRequest{
		UserId: userID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(formatCartResponse(resp))
}

func (h *CartHandler) AddItem(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	type Request struct {
		MenuItemID   string  `json:"menu_item_id"`
		RestaurantID string  `json:"restaurant_id"`
		Name         string  `json:"name"`
		Price        float64 `json:"price"`
		Quantity     int32   `json:"quantity"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.AddItem(ctx, &pb.AddItemRequest{
		UserId:       userID,
		RestaurantId: req.RestaurantID,
		MenuItemId:   req.MenuItemID,
		Name:         req.Name,
		Price:        req.Price,
		Quantity:     req.Quantity,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(formatCartResponse(resp))
}

func (h *CartHandler) RemoveItem(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	menuItemID := c.Params("itemId")
	if menuItemID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing item ID"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.RemoveItem(ctx, &pb.RemoveItemRequest{
		UserId:     userID,
		MenuItemId: menuItemID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(formatCartResponse(resp))
}

func (h *CartHandler) ClearCart(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.ClearCart(ctx, &pb.ClearCartRequest{
		UserId: userID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}
