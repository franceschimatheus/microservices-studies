package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"notification/internal/domain"

	amqp "github.com/rabbitmq/amqp091-go"
)

type AMQPHandler struct {
	service domain.NotificationService
}

func NewAMQPHandler(service domain.NotificationService) *AMQPHandler {
	return &AMQPHandler{
		service: service,
	}
}

func (h *AMQPHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /notify", h.notify)
}

func (h *AMQPHandler) notify(w http.ResponseWriter, r *http.Request) {
	var input struct {
		OrderID   string `json:"order_id"`
		Recipient string `json:"recipient"`
		Message   string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.SendOrderNotification(r.Context(), input.OrderID, input.Recipient, input.Message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"status":"notification_queued"}`))
}

// StartConsumer starts consuming OrderCreated events from RabbitMQ.
func (h *AMQPHandler) StartConsumer(ctx context.Context, url string) error {
	conn, err := amqp.Dial(url)
	if err != nil {
		return err
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return err
	}

	// Declare exchange (ensure topic matches publisher)
	err = ch.ExchangeDeclare(
		"orders.v1",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	// Declare queue for notifications
	q, err := ch.QueueDeclare(
		"notification_service_orders",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	// Bind queue to orders exchange
	err = ch.QueueBind(
		q.Name,
		"order.event.created",
		"orders.v1",
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	msgs, err := ch.Consume(
		q.Name,
		"notification_consumer",
		true, // auto-ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return err
	}

	go func() {
		defer ch.Close()
		defer conn.Close()

		log.Printf("[AMQP] Notification Service listening for order.event.created events...")

		for {
			select {
			case <-ctx.Done():
				log.Printf("[AMQP] Stopping Notification Service consumer...")
				return
			case d, ok := <-msgs:
				if !ok {
					log.Printf("[AMQP] Consumer channel closed.")
					return
				}

				var event struct {
					OrderID    string  `json:"order_id"`
					CustomerID string  `json:"customer_id"`
					ProductID  string  `json:"product_id"`
					Quantity   int     `json:"quantity"`
					Price      float64 `json:"price"`
				}

				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("[AMQP] Error unmarshalling event: %v", err)
					continue
				}

				log.Printf("[AMQP] Received OrderCreated event: %+v", event)

				// Fire notification
				recipient := fmt.Sprintf("customer_%s@sandbox.com", event.CustomerID)
				message := fmt.Sprintf("Hello! Your order for %d unit(s) of %s has been created successfully.", event.Quantity, event.ProductID)

				err = h.service.SendOrderNotification(ctx, event.OrderID, recipient, message)
				if err != nil {
					log.Printf("[NOTIFICATION ERROR] Failed to send: %v", err)
				}
			}
		}
	}()

	return nil
}
