package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc/metadata"

	authpb "auth-service/pb"
	cartpb "cart-service/pb"
	pb "order-service/pb"
)

type OrderHandler struct {
	client     pb.OrderServiceClient
	cartClient cartpb.CartServiceClient
	authClient authpb.AuthServiceClient
}

func NewOrderHandler(client pb.OrderServiceClient, cartClient cartpb.CartServiceClient, authClient authpb.AuthServiceClient) *OrderHandler {
	return &OrderHandler{
		client:     client,
		cartClient: cartClient,
		authClient: authClient,
	}
}

func (h *OrderHandler) getAuthenticatedUserID(c *fiber.Ctx) (string, error) {
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

type CreateOrderRequest struct {
	RestaurantID string `json:"restaurant_id"`
}

func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.RestaurantID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "restaurant_id is required"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	// 1. Get cart items
	cart, err := h.cartClient.GetCart(ctx, &cartpb.GetCartRequest{UserId: userID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get cart: " + err.Error()})
	}

	if len(cart.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot place order: cart is empty"})
	}

	// 2. Map cart items to order items
	var orderItems []*pb.OrderItem
	for _, item := range cart.Items {
		orderItems = append(orderItems, &pb.OrderItem{
			MenuItemId: item.MenuItemId,
			Name:       item.Name,
			Price:      item.Price,
			Quantity:   item.Quantity,
		})
	}

	// 3. Create order
	order, err := h.client.CreateOrder(ctx, &pb.CreateOrderRequest{
		UserId:       userID,
		RestaurantId: req.RestaurantID,
		Items:        orderItems,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create order: " + err.Error()})
	}

	// 4. Clear cart
	_, _ = h.cartClient.ClearCart(ctx, &cartpb.ClearCartRequest{UserId: userID})

	return c.Status(fiber.StatusCreated).JSON(order)
}

func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	orderID := c.Params("id")
	if orderID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "order_id is required"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	order, err := h.client.GetOrder(ctx, &pb.GetOrderRequest{Id: orderID})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
	}

	if order.UserId != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	return c.JSON(order)
}

func (h *OrderHandler) ListOrders(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	resp, err := h.client.ListOrders(ctx, &pb.ListOrdersRequest{UserId: userID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to list orders: " + err.Error()})
	}

	// If nil, return an empty array
	orders := resp.Orders
	if orders == nil {
		orders = []*pb.OrderResponse{}
	}

	return c.JSON(orders)
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

func (h *OrderHandler) UpdateOrderStatus(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	orderID := c.Params("id")
	if orderID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "order_id is required"})
	}

	var req UpdateOrderStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	if corrID, ok := c.Locals("correlation_id").(string); ok {
		ctx = metadata.AppendToOutgoingContext(ctx, "correlation_id", corrID)
	}

	order, err := h.client.GetOrder(ctx, &pb.GetOrderRequest{Id: orderID})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
	}

	if order.UserId != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	updatedOrder, err := h.client.UpdateOrderStatus(ctx, &pb.UpdateOrderStatusRequest{
		Id:     orderID,
		Status: req.Status,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update status: " + err.Error()})
	}

	return c.JSON(updatedOrder)
}
