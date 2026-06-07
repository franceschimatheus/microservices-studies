package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"logger"
	"observability"
	"notification-service/internal/config"
	"notification-service/internal/handler"
	"notification-service/internal/service"
	"prometheus"
	"rabbitmq"
)

type App struct {
	cfg          *config.Config
	redisClient  *redis.Client
	otelShutdown func(context.Context) error
	rabbitClient *rabbitmq.Client
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("notification-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "notification-service", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	// Connect to Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	redisCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := redisClient.Ping(redisCtx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}
	slog.Info("Successfully connected to Redis")

	// Initialize RabbitMQ Client and connect
	rabbitClient := rabbitmq.NewClient(cfg.RabbitMQURL)
	if err := rabbitClient.Connect(); err != nil {
		slog.Error("Failed to connect to RabbitMQ on startup", "error", err)
	}

	return &App{
		cfg:          cfg,
		redisClient:  redisClient,
		otelShutdown: otelShutdown,
		rabbitClient: rabbitClient,
	}, nil
}

func (a *App) Run() error {
	// Start Prometheus metrics server on port 9096
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting notification-service Prometheus metrics server", "addr", ":9096")
		if err := http.ListenAndServe(":9096", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// Setup components and RabbitMQ subscribers
	notifService := service.NewNotificationService(a.redisClient)
	notifHandler := handler.NewNotificationHandler(notifService)

	ctx := context.Background()

	// 1. Subscribe to order.created
	err := a.rabbitClient.Subscribe(ctx, "notification.order-created.queue", "orders.exchange", "order.created", notifHandler.HandleOrderCreated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to order.created: %w", err)
	}

	// 2. Subscribe to payment.completed
	err = a.rabbitClient.Subscribe(ctx, "notification.payment-completed.queue", "payments.exchange", "payment.completed", notifHandler.HandlePaymentCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.completed: %w", err)
	}

	// 3. Subscribe to payment.failed
	err = a.rabbitClient.Subscribe(ctx, "notification.payment-failed.queue", "payments.exchange", "payment.failed", notifHandler.HandlePaymentFailed)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.failed: %w", err)
	}

	// 4. Subscribe to order.updated
	err = a.rabbitClient.Subscribe(ctx, "notification.order-updated.queue", "orders.exchange", "order.updated", notifHandler.HandleOrderUpdated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to order.updated: %w", err)
	}

	// 5. Subscribe to delivery.completed (routing key delivery.completed from delivery.exchange)
	err = a.rabbitClient.Subscribe(ctx, "notification.delivery-completed.queue", "delivery.exchange", "delivery.completed", notifHandler.HandleDeliveryCompleted)
	if err != nil {
		// Just log error as delivery worker isn't built yet, but we want subscription ready
		slog.Warn("Could not subscribe to delivery.completed queue (maybe delivery.exchange does not exist yet)", "error", err)
	}

	slog.Info("Notification Service is running and listening to RabbitMQ queues")
	
	// Keep the main thread alive (consumer only)
	select {}
}

func (a *App) Close() {
	if a.redisClient != nil {
		a.redisClient.Close()
	}
	if a.rabbitClient != nil {
		a.rabbitClient.Close()
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
