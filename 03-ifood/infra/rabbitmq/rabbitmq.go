package rabbitmq

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.opentelemetry.io/otel"
)

type contextKey string
const MessageIDKey contextKey = "message_id"

// AMQPHeaderCarrier wraps amqp.Table to implement propagation.TextMapCarrier.
type AMQPHeaderCarrier amqp.Table

// Get retrieves a value from the carrier.
func (c AMQPHeaderCarrier) Get(key string) string {
	if val, ok := c[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// Set stores a value in the carrier.
func (c AMQPHeaderCarrier) Set(key string, value string) {
	c[key] = value
}

// Keys returns all keys present in the carrier.
func (c AMQPHeaderCarrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for k := range c {
		keys = append(keys, k)
	}
	return keys
}

// Client wraps connection and channel lifecycle management.
type Client struct {
	url        string
	conn       *amqp.Connection
	ch         *amqp.Channel
	mu         sync.RWMutex
	closeChan  chan *amqp.Error
	done       chan struct{}
	exchanges  []string
	connected  bool
}

// NewClient creates a new RabbitMQ Client.
func NewClient(url string) *Client {
	return &Client{
		url:       url,
		done:      make(chan struct{}),
		exchanges: []string{
			"orders.exchange",
			"payments.exchange",
			"delivery.exchange",
			"notifications.exchange",
			"restaurants.exchange",
			"search.exchange",
		},
	}
}

// Connect establishes the connection and initiates background reconnect loop.
func (c *Client) Connect() error {
	if err := c.connectAndDeclare(); err != nil {
		go c.reconnectLoop()
		return err
	}
	go c.reconnectLoop()
	return nil
}

func (c *Client) connectAndDeclare() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	conn, err := amqp.Dial(c.url)
	if err != nil {
		return fmt.Errorf("failed to connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	c.conn = conn
	c.ch = ch
	c.closeChan = make(chan *amqp.Error, 1)
	c.conn.NotifyClose(c.closeChan)
	c.connected = true

	slog.Info("Successfully connected to RabbitMQ")

	// Declare standard topic exchanges
	for _, exchange := range c.exchanges {
		err := ch.ExchangeDeclare(
			exchange,
			"topic",
			true,  // durable
			false, // auto-deleted
			false, // internal
			false, // no-wait
			nil,   // arguments
		)
		if err != nil {
			return fmt.Errorf("failed to declare exchange %s: %w", exchange, err)
		}
		slog.Info("Declared RabbitMQ exchange", "exchange", exchange)
	}

	return nil
}

func (c *Client) reconnectLoop() {
	for {
		select {
		case <-c.done:
			return
		case amqpErr := <-c.closeChan:
			c.mu.Lock()
			c.connected = false
			c.mu.Unlock()

			slog.Warn("RabbitMQ connection closed, attempting to reconnect", "error", amqpErr)

			for {
				select {
				case <-c.done:
					return
				default:
					time.Sleep(5 * time.Second)
					if err := c.connectAndDeclare(); err == nil {
						slog.Info("RabbitMQ reconnected successfully")
						break
					}
					slog.Error("Failed to reconnect to RabbitMQ, retrying...")
				}
			}
		}
	}
}

// Publish sends a message to an exchange with OTel tracing propagation.
func (c *Client) Publish(ctx context.Context, exchange, routingKey string, body []byte) error {
	c.mu.RLock()
	ch := c.ch
	connected := c.connected
	c.mu.RUnlock()

	if !connected || ch == nil {
		return fmt.Errorf("rabbitmq client not connected")
	}

	headers := amqp.Table{}
	carrier := AMQPHeaderCarrier(headers)
	otel.GetTextMapPropagator().Inject(ctx, carrier)

	var messageID string
	if idVal := ctx.Value(MessageIDKey); idVal != nil {
		if idStr, ok := idVal.(string); ok {
			messageID = idStr
		}
	}

	return ch.PublishWithContext(
		ctx,
		exchange,
		routingKey,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			MessageId:   messageID,
			ContentType: "application/json",
			Body:        body,
			Headers:     headers,
		},
	)
}

// HandlerFunc is the subscriber message handler function.
type HandlerFunc func(ctx context.Context, body []byte) error

// Subscribe consumes messages from a queue, extracting OTel tracing context.
func (c *Client) Subscribe(ctx context.Context, queueName, exchange, routingKey string, handler HandlerFunc) error {
	c.mu.Lock()
	ch := c.ch
	c.mu.Unlock()

	if ch == nil {
		return fmt.Errorf("rabbitmq channel not initialized")
	}

	// Declare Queue
	_, err := ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue %s: %w", queueName, err)
	}

	// Declare DLQ Queue
	dlqName := queueName + ".dlq"
	_, err = ch.QueueDeclare(
		dlqName,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare DLQ queue %s: %w", dlqName, err)
	}

	// Bind Queue to Exchange
	err = ch.QueueBind(
		queueName,
		routingKey,
		exchange,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to bind queue %s to exchange %s: %w", queueName, exchange, err)
	}

	msgs, err := ch.Consume(
		queueName,
		"",    // consumer tag
		false, // auto-ack (explicit ack is safer)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		return fmt.Errorf("failed to start consuming from queue %s: %w", queueName, err)
	}

	go func() {
		maxRetries := 3
		for d := range msgs {
			// Extract OTel tracing context from message headers
			carrier := AMQPHeaderCarrier(d.Headers)
			msgCtx := otel.GetTextMapPropagator().Extract(ctx, carrier)

			// Propagate Message ID in the context if present
			if d.MessageId != "" {
				msgCtx = context.WithValue(msgCtx, MessageIDKey, d.MessageId)
			}

			var err error
			success := false
			backoff := 500 * time.Millisecond

			for attempt := 1; attempt <= maxRetries; attempt++ {
				err = handler(msgCtx, d.Body)
				if err == nil {
					success = true
					break
				}

				slog.Warn("Failed to handle message, retrying...", 
					"queue", queueName, 
					"attempt", attempt, 
					"max_retries", maxRetries, 
					"backoff", backoff, 
					"error", err)

				if attempt < maxRetries {
					time.Sleep(backoff)
					backoff *= 2
				}
			}

			if success {
				_ = d.Ack(false)
			} else {
				slog.Error("Failed to handle message after maximum retries. Routing to DLQ.", 
					"queue", queueName, 
					"dlq", dlqName, 
					"error", err)

				// Publish to DLQ
				dlqHeaders := amqp.Table{
					"x-original-exchange":   d.Exchange,
					"x-original-routing-key": d.RoutingKey,
					"x-exception-message":    err.Error(),
					"x-failed-at":           time.Now().Format(time.RFC3339),
				}

				// Copy original headers if they exist
				for k, v := range d.Headers {
					dlqHeaders[k] = v
				}

				errPub := ch.PublishWithContext(
					msgCtx,
					"", // default exchange
					dlqName, // routing key matches DLQ queue name exactly
					false,
					false,
					amqp.Publishing{
						MessageId:   d.MessageId,
						ContentType: d.ContentType,
						Body:        d.Body,
						Headers:     dlqHeaders,
					},
				)
				if errPub != nil {
					slog.Error("Failed to publish message to DLQ. Requeuing in original queue.", "queue", queueName, "error", errPub)
					_ = d.Nack(false, true)
				} else {
					slog.Info("Successfully routed message to DLQ and acknowledged original message", "queue", queueName, "dlq", dlqName)
					_ = d.Ack(false)
				}
			}
		}
	}()

	slog.Info("Successfully subscribed to queue", "queue", queueName, "exchange", exchange, "routingKey", routingKey)
	return nil
}

// Close gracefully shuts down the RabbitMQ client connection.
func (c *Client) Close() {
	close(c.done)
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.ch != nil {
		c.ch.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
	c.connected = false
	slog.Info("Closed RabbitMQ connections")
}
