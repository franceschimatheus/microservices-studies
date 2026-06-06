package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	pb "restaurant-service/pb"
)

type RestaurantHandler struct {
	client pb.RestaurantServiceClient
}

func NewRestaurantHandler(client pb.RestaurantServiceClient) *RestaurantHandler {
	return &RestaurantHandler{client: client}
}

func (h *RestaurantHandler) ListRestaurants(c *fiber.Ctx) error {
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.ListRestaurants(ctx, &pb.ListRestaurantsRequest{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp.Restaurants)
}

func (h *RestaurantHandler) CreateRestaurant(c *fiber.Ctx) error {
	type Request struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Address     string `json:"address"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.CreateRestaurant(ctx, &pb.CreateRestaurantRequest{
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}
