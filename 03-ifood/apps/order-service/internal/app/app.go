package app

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"

	"order-service/internal/config"
	"order-service/internal/handler"
	"order-service/internal/repository"
	"order-service/internal/service"
	"order-service/migrations"
	pb "order-service/pb"
	"logger"
	"observability"
	"prometheus"
	"rabbitmq"
)

type App struct {
	cfg          *config.Config
	db           *pgxpool.Pool
	gRPCServer   *grpc.Server
	otelShutdown func(context.Context) error
	rabbitClient *rabbitmq.Client
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("order-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "order-service", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	dbCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pgxConfig, err := pgxpool.ParseConfig(cfg.DBDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DB DSN: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(dbCtx, pgxConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Wait for database connection to be ready
	var errPing error
	for i := 0; i < 10; i++ {
		errPing = pool.Ping(dbCtx)
		if errPing == nil {
			break
		}
		slog.WarnContext(dbCtx, "Waiting for database connection...", "error", errPing)
		time.Sleep(2 * time.Second)
	}
	if errPing != nil {
		return nil, fmt.Errorf("could not connect to database: %w", errPing)
	}

	// Register DB stats collector
	registerDBMetrics(pool, "order")

	// Initialize RabbitMQ Client and connect (auto-declares exchanges)
	rabbitClient := rabbitmq.NewClient(cfg.RabbitMQURL)
	if err := rabbitClient.Connect(); err != nil {
		slog.Error("Failed to connect to RabbitMQ on startup", "error", err)
	}

	return &App{
		cfg:          cfg,
		db:           pool,
		otelShutdown: otelShutdown,
		rabbitClient: rabbitClient,
	}, nil
}

func (a *App) runMigrations() error {
	d, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("failed to create iofs source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, a.cfg.DBDSN)
	if err != nil {
		return fmt.Errorf("failed to initialize migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	slog.Info("Migrations executed successfully")
	return nil
}

func (a *App) Run() error {
	// 1. Run Migrations
	if err := a.runMigrations(); err != nil {
		return fmt.Errorf("migration failure: %w", err)
	}

	// 2. Setup gRPC Listener
	lis, err := net.Listen("tcp", a.cfg.BindAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", a.cfg.BindAddr, err)
	}

	// 3. Start Prometheus metrics server on a separate port (9094)
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting order-service Prometheus metrics server", "addr", ":9094")
		if err := http.ListenAndServe(":9094", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// 4. Wire Component Layer (Clean Architecture)
	orderRepo := repository.NewPostgresOrderRepository(a.db)
	orderServ := service.NewOrderService(orderRepo, a.rabbitClient)
	grpcHandler := handler.NewGrpcOrderHandler(orderServ)
	paymentConsumer := handler.NewPaymentConsumer(orderServ)
	deliveryConsumer := handler.NewDeliveryConsumer(orderServ)

	ctx := context.Background()
	// Subscribe to payment.completed
	err = a.rabbitClient.Subscribe(ctx, "order.payment-completed.queue", "payments.exchange", "payment.completed", paymentConsumer.HandlePaymentCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.completed: %w", err)
	}

	// Subscribe to payment.failed
	err = a.rabbitClient.Subscribe(ctx, "order.payment-failed.queue", "payments.exchange", "payment.failed", paymentConsumer.HandlePaymentFailed)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.failed: %w", err)
	}

	// Subscribe to delivery.updated
	err = a.rabbitClient.Subscribe(ctx, "order.delivery-updated.queue", "delivery.exchange", "delivery.updated", deliveryConsumer.HandleDeliveryUpdated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.updated: %w", err)
	}

	// Subscribe to delivery.assigned
	err = a.rabbitClient.Subscribe(ctx, "order.delivery-assigned.queue", "delivery.exchange", "delivery.assigned", deliveryConsumer.HandleDeliveryAssigned)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.assigned: %w", err)
	}

	// Subscribe to delivery.completed
	err = a.rabbitClient.Subscribe(ctx, "order.delivery-completed.queue", "delivery.exchange", "delivery.completed", deliveryConsumer.HandleDeliveryCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.completed: %w", err)
	}

	// Add OTel server handler for tracing propagation
	a.gRPCServer = grpc.NewServer(
		observability.GRPCServerStatsHandler(),
	)
	pb.RegisterOrderServiceServer(a.gRPCServer, grpcHandler)

	slog.Info("Order Service is running", "bind_addr", a.cfg.BindAddr)
	return a.gRPCServer.Serve(lis)
}

func (a *App) Close() {
	if a.gRPCServer != nil {
		a.gRPCServer.GracefulStop()
	}
	if a.db != nil {
		a.db.Close()
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
