package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"delivery-service/internal/config"
	"delivery-service/internal/handler"
	"delivery-service/internal/service"
	"logger"
	"observability"
	"prometheus"
	"rabbitmq"
)

type App struct {
	cfg          *config.Config
	otelShutdown func(context.Context) error
	rabbitClient *rabbitmq.Client
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("delivery-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "delivery-service", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	// Initialize RabbitMQ Client and connect
	rabbitClient := rabbitmq.NewClient(cfg.RabbitMQURL)
	if err := rabbitClient.Connect(); err != nil {
		slog.Error("Failed to connect to RabbitMQ on startup", "error", err)
	}

	return &App{
		cfg:          cfg,
		otelShutdown: otelShutdown,
		rabbitClient: rabbitClient,
	}, nil
}

func (a *App) Run() error {
	// Start Prometheus metrics server on port 9097
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting delivery-service Prometheus metrics server", "addr", ":9097")
		if err := http.ListenAndServe(":9097", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// Setup components and RabbitMQ subscriber
	deliveryServ := service.NewDeliveryService(a.rabbitClient)
	paymentConsumer := handler.NewPaymentConsumer(deliveryServ)

	ctx := context.Background()
	err := a.rabbitClient.Subscribe(ctx, "delivery.payment-completed.queue", "payments.exchange", "payment.completed", paymentConsumer.HandlePaymentCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.completed: %w", err)
	}

	slog.Info("Delivery Service is running and listening to queue 'delivery.payment-completed.queue'")
	
	// Keep the main thread alive (consumer only)
	select {}
}

func (a *App) Close() {
	if a.rabbitClient != nil {
		a.rabbitClient.Close()
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
