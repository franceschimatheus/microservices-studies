package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"

	"logger"
	"observability"
	"payment-service/internal/config"
	"payment-service/internal/handler"
	"payment-service/internal/repository"
	"payment-service/internal/service"
	"payment-service/migrations"
	"prometheus"
	"rabbitmq"
)

type App struct {
	cfg          *config.Config
	db           *pgxpool.Pool
	otelShutdown func(context.Context) error
	rabbitClient *rabbitmq.Client
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("payment-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "payment-service", cfg.OtelCollectorAddr)
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
	registerDBMetrics(pool, "payment")

	// Initialize RabbitMQ Client and connect
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

	// 2. Start Prometheus metrics server on port 9095
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting payment-service Prometheus metrics server", "addr", ":9095")
		if err := http.ListenAndServe(":9095", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// 3. Setup components and RabbitMQ subscriber
	repo := repository.NewPostgresPaymentRepository(a.db)
	payService := service.NewPaymentServiceImpl()
	payHandler := handler.NewPaymentHandler(repo, payService, a.rabbitClient)

	ctx := context.Background()
	err := a.rabbitClient.Subscribe(ctx, "payment.order-created.queue", "orders.exchange", "order.created", payHandler.HandleOrderCreated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to order.created: %w", err)
	}

	slog.Info("Payment Service is running and listening to queue 'payment.order-created.queue'")
	
	// Keep the main thread alive since this is a consumer-only service (no gRPC listener needed yet)
	select {}
}

func (a *App) Close() {
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
