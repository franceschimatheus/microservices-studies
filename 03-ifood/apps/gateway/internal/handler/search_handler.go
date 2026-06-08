package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	pb "search-service/pb"
)

type SearchHandler struct {
	client pb.SearchServiceClient
}

func NewSearchHandler(client pb.SearchServiceClient) *SearchHandler {
	return &SearchHandler{client: client}
}

func (h *SearchHandler) Search(c *fiber.Ctx) error {
	query := c.Query("q")

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	restResp, err := h.client.SearchRestaurants(ctx, &pb.SearchRequest{Query: query})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	menuResp, err := h.client.SearchMenus(ctx, &pb.SearchRequest{Query: query})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	restaurants := restResp.Restaurants
	if restaurants == nil {
		restaurants = []*pb.RestaurantDocument{}
	}

	menuItems := menuResp.Items
	if menuItems == nil {
		menuItems = []*pb.MenuDocument{}
	}

	return c.JSON(fiber.Map{
		"restaurants": restaurants,
		"menu_items":  menuItems,
	})
}
