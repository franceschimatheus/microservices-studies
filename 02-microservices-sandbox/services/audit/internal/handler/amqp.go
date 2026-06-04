package handler

import (
	"context"
	"log"
	"time"

	"audit/internal/domain"

	amqp "github.com/rabbitmq/amqp091-go"
)

type AMQPHandler struct {
	service domain.AuditService
}

func NewAMQPHandler(service domain.AuditService) *AMQPHandler {
	return &AMQPHandler{
		service: service,
	}
}

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

	// Declare exchange to make sure it exists
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

	// Declare queue for Admin logs
	q, err := ch.QueueDeclare(
		"admin_logs_queue",
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

	// Bind queue to all routing keys on the topic exchange using the wildcard '#'
	err = ch.QueueBind(
		q.Name,
		"#", // matches all routing keys!
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
		"admin_log_consumer",
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

		log.Printf("[AMQP] Admin Service log aggregator listening on exchange orders.v1 (#)...")

		for {
			select {
			case <-ctx.Done():
				log.Printf("[AMQP] Stopping Admin Service log consumer...")
				return
			case d, ok := <-msgs:
				if !ok {
					log.Printf("[AMQP] Aggregator consumer channel closed.")
					return
				}

				log.Printf("[AMQP] Aggregated message received: routing_key=%s", d.RoutingKey)

				// Determine Event Type and Source based on routing key
				eventType := "UnknownEvent"
				source := "unknown-service"

				switch d.RoutingKey {
				case "order.event.created":
					eventType = "OrderCreated"
					source = "order-service"
				case "payment.event.processed":
					eventType = "PaymentProcessed"
					source = "payment-service"
				case "notification.event.sent":
					eventType = "NotificationSent"
					source = "notification-service"
				default:
					eventType = d.RoutingKey
				}

				sysEvent := domain.SystemEvent{
					Type:      eventType,
					Source:    source,
					Payload:   string(d.Body),
					Timestamp: time.Now(),
				}

				h.service.AddEvent(ctx, sysEvent)
			}
		}
	}()

	return nil
}
