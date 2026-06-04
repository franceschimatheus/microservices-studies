package event

import (
	"context"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type OrderCreatedEvent struct {
	OrderID    string  `json:"order_id"`
	CustomerID string  `json:"customer_id"`
	ProductID  string  `json:"product_id"`
	Quantity   int     `json:"quantity"`
	Price      float64 `json:"price"`
}

type EventPublisher struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func NewEventPublisher(url string) (*EventPublisher, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, err
	}

	// Declare exchange for orders
	err = ch.ExchangeDeclare(
		"orders.v1", // name
		"topic",     // type
		true,        // durable
		false,       // auto-deleted
		false,       // internal
		false,       // no-wait
		nil,         // arguments
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}

	return &EventPublisher{
		conn:    conn,
		channel: ch,
	}, nil
}

func (p *EventPublisher) Close() {
	if p.channel != nil {
		_ = p.channel.Close()
	}
	if p.conn != nil {
		_ = p.conn.Close()
	}
}

func (p *EventPublisher) PublishOrderCreated(ctx context.Context, orderID string, customerID string, productID string, quantity int, price float64) error {
	event := OrderCreatedEvent{
		OrderID:    orderID,
		CustomerID: customerID,
		ProductID:  productID,
		Quantity:   quantity,
		Price:      price,
	}

	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	log.Printf("[AMQP] Publishing OrderCreated event for Order: %s", orderID)
	return p.channel.PublishWithContext(
		ctx,
		"orders.v1",              // exchange
		"order.event.created",    // routing key
		false,                    // mandatory
		false,                    // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}
