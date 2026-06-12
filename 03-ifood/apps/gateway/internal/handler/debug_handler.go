package handler

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rabbitmq/amqp091-go"
	"go.opentelemetry.io/otel"
)

type DebugHandler struct {
	rabbitmqURL string
}

func NewDebugHandler(rabbitmqURL string) *DebugHandler {
	return &DebugHandler{
		rabbitmqURL: rabbitmqURL,
	}
}

func (h *DebugHandler) Simulate500(c *fiber.Ctx) error {
	return fiber.NewError(fiber.StatusInternalServerError, "Simulated 500 Internal Server Error for Playground")
}

func (h *DebugHandler) Simulate400(c *fiber.Ctx) error {
	return fiber.NewError(fiber.StatusBadRequest, "Simulated 400 Bad Request for Playground")
}

func (h *DebugHandler) SimulateLatency(c *fiber.Ctx) error {
	time.Sleep(5 * time.Second)
	return c.JSON(fiber.Map{"message": "Simulated latency of 5 seconds completed"})
}

func (h *DebugHandler) SimulateDLQ(c *fiber.Ctx) error {
	// Connect to RabbitMQ
	conn, err := amqp091.Dial(h.rabbitmqURL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to connect to RabbitMQ")
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to open RabbitMQ channel")
	}
	defer ch.Close()

	// Simulate an order.created event with the poison pill ID
	event := map[string]interface{}{
		"order_id": "simulate-dlq-error",
		"user_id":  "admin-playground-user",
		"total":    999.99,
	}
	body, _ := json.Marshal(event)

	tr := otel.Tracer("gateway-debug")
	ctx, span := tr.Start(context.Background(), "PublishDLQPoisonPill")
	defer span.End()

	err = ch.PublishWithContext(ctx,
		"ifood.events",   // exchange
		"order.created",  // routing key
		false,            // mandatory
		false,            // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		})

	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to publish poison pill message")
	}

	return c.JSON(fiber.Map{"message": "Poison pill message published to order.created. Notification service should route it to DLQ."})
}
