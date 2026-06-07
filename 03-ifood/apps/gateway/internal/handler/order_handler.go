package handler

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"

	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc/metadata"

	authpb "auth-service/pb"
	cartpb "cart-service/pb"
	pb "order-service/pb"
)

type OrderHandler struct {
	client      pb.OrderServiceClient
	cartClient  cartpb.CartServiceClient
	authClient  authpb.AuthServiceClient
	redisClient *redis.Client
}

func NewOrderHandler(client pb.OrderServiceClient, cartClient cartpb.CartServiceClient, authClient authpb.AuthServiceClient, redisClient *redis.Client) *OrderHandler {
	return &OrderHandler{
		client:      client,
		cartClient:  cartClient,
		authClient:  authClient,
		redisClient: redisClient,
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

func (h *OrderHandler) StreamUpdates(c *fiber.Ctx) error {
	userID, err := h.getAuthenticatedUserID(c)
	if err != nil {
		return err
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		slog.Info("SSE connection opened", "user_id", userID)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		channel := "notifications:user:" + userID
		pubsub := h.redisClient.Subscribe(ctx, channel)
		defer pubsub.Close()

		// Send initial keep-alive comment
		_, _ = fmt.Fprintf(w, ": ok\n\n")
		_ = w.Flush()

		ch := pubsub.Channel()
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg, ok := <-ch:
				if !ok {
					return
				}
				_, err := fmt.Fprintf(w, "data: %s\n\n", msg.Payload)
				if err != nil {
					slog.Info("SSE connection write error (client closed)", "user_id", userID, "error", err)
					return
				}
				if err = w.Flush(); err != nil {
					return
				}
			case <-ticker.C:
				_, err := fmt.Fprintf(w, ": keep-alive\n\n")
				if err != nil {
					slog.Info("SSE connection keep-alive write error", "user_id", userID, "error", err)
					return
				}
				if err = w.Flush(); err != nil {
					return
				}
			}
		}
	})

	return nil
}
