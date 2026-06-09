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

func (h *RestaurantHandler) GetRestaurant(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.GetRestaurant(ctx, &pb.GetRestaurantRequest{Id: id})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) UpdateRestaurant(c *fiber.Ctx) error {
	id := c.Params("id")
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

	resp, err := h.client.UpdateRestaurant(ctx, &pb.UpdateRestaurantRequest{
		Id:          id,
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) DeleteRestaurant(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.DeleteRestaurant(ctx, &pb.DeleteRestaurantRequest{Id: id})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) CreateCategory(c *fiber.Ctx) error {
	restaurantID := c.Params("restaurantId")
	type Request struct {
		Name string `json:"name"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.CreateCategory(ctx, &pb.CreateCategoryRequest{
		RestaurantId: restaurantID,
		Name:         req.Name,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) ListCategories(c *fiber.Ctx) error {
	restaurantID := c.Params("restaurantId")
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.ListCategories(ctx, &pb.ListCategoriesRequest{RestaurantId: restaurantID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp.Categories)
}

func (h *RestaurantHandler) CreateMenuItem(c *fiber.Ctx) error {
	type Request struct {
		CategoryId  string  `json:"category_id"`
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.CreateMenuItem(ctx, &pb.CreateMenuItemRequest{
		CategoryId:  req.CategoryId,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) UpdateMenuItem(c *fiber.Ctx) error {
	id := c.Params("id")
	type Request struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		Available   bool    `json:"available"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.UpdateMenuItem(ctx, &pb.UpdateMenuItemRequest{
		Id:          id,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Available:   req.Available,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) DeleteMenuItem(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.DeleteMenuItem(ctx, &pb.DeleteMenuItemRequest{Id: id})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func (h *RestaurantHandler) GetMenu(c *fiber.Ctx) error {
	restaurantID := c.Params("restaurantId")
	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.GetMenu(ctx, &pb.GetMenuRequest{RestaurantId: restaurantID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp.Items)
}
