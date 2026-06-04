package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"payment/internal/domain"

	amqp "github.com/rabbitmq/amqp091-go"
)

type GRPCHandler struct {
	service domain.PaymentService
}

func NewGRPCHandler(service domain.PaymentService) *GRPCHandler {
	return &GRPCHandler{
		service: service,
	}
}

func (h *GRPCHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /payments", h.processPayment)
}

func (h *GRPCHandler) processPayment(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("order_id")
	amountStr := r.URL.Query().Get("amount")
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || orderID == "" {
		http.Error(w, "invalid parameters (order_id and amount required)", http.StatusBadRequest)
		return
	}

	tx, err := h.service.ProcessPayment(r.Context(), orderID, amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if tx.Status == "FAILED" {
		w.WriteHeader(http.StatusPaymentRequired)
	}
	_ = json.NewEncoder(w).Encode(tx)
}

// StartConsumer starts consuming OrderCreated events from RabbitMQ.
func (h *GRPCHandler) StartConsumer(ctx context.Context, url string) error {
	conn, err := amqp.Dial(url)
	if err != nil {
		return err
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return err
	}

	// Declare orders exchange (ensure it matches publisher)
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

	// Declare local queue for payment service
	q, err := ch.QueueDeclare(
		"payment_service_orders",
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
		"payment_consumer",
		true, // auto-ack for simplicity in Stage 1
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

		log.Printf("[AMQP] Payment Service listening for order.event.created events...")

		for {
			select {
			case <-ctx.Done():
				log.Printf("[AMQP] Stopping Payment Service consumer...")
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

				// Call payment service to process payment
				tx, err := h.service.ProcessPayment(ctx, event.OrderID, event.Price*float64(event.Quantity))
				if err != nil {
					log.Printf("[PAYMENT ERROR] Processing failed: %v", err)
					continue
				}

				log.Printf("[PAYMENT SUCCESS] Transaction: %s | Status: %s", tx.ID, tx.Status)
			}
		}
	}()

	return nil
}
