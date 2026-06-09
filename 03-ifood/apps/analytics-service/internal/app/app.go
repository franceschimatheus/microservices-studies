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

	"analytics-service/internal/config"
	"analytics-service/internal/handler"
	"analytics-service/internal/repository"
	"analytics-service/internal/service"
	"analytics-service/migrations"
	"logger"
	"observability"
	"prometheus"
	"rabbitmq"
)

type App struct {
	cfg             *config.Config
	db              *pgxpool.Pool
	otelShutdown    func(context.Context) error
	rabbitClient    *rabbitmq.Client
	workerCtxCancel context.CancelFunc
	workerDone      chan struct{}
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("analytics-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "analytics-service", cfg.OtelCollectorAddr)
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
	registerDBMetrics(pool, "analytics")

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
		workerDone:   make(chan struct{}),
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

	// 2. Start Prometheus metrics server on port 9098
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting analytics-service Prometheus metrics server", "addr", ":9098")
		// Listen on 127.0.0.1 locally to respect security guidelines
		if err := http.ListenAndServe("0.0.0.0:9098", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// 3. Setup components and RabbitMQ subscriber
	repo := repository.NewPostgresAnalyticsRepository(a.db)
	pipelineService := service.NewPipelineService(repo)
	analyticsHandler := handler.NewAnalyticsHandler(repo)

	ctx := context.Background()

	// Subscribe to order events
	err := a.rabbitClient.Subscribe(ctx, "analytics.order-created.queue", "orders.exchange", "order.created", analyticsHandler.HandleOrderCreated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to order.created: %w", err)
	}
	err = a.rabbitClient.Subscribe(ctx, "analytics.order-updated.queue", "orders.exchange", "order.updated", analyticsHandler.HandleOrderUpdated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to order.updated: %w", err)
	}

	// Subscribe to payment events
	err = a.rabbitClient.Subscribe(ctx, "analytics.payment-completed.queue", "payments.exchange", "payment.completed", analyticsHandler.HandlePaymentCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.completed: %w", err)
	}
	err = a.rabbitClient.Subscribe(ctx, "analytics.payment-failed.queue", "payments.exchange", "payment.failed", analyticsHandler.HandlePaymentFailed)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment.failed: %w", err)
	}

	// Subscribe to delivery events
	err = a.rabbitClient.Subscribe(ctx, "analytics.delivery-assigned.queue", "delivery.exchange", "delivery.assigned", analyticsHandler.HandleDeliveryAssigned)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.assigned: %w", err)
	}
	err = a.rabbitClient.Subscribe(ctx, "analytics.delivery-completed.queue", "delivery.exchange", "delivery.completed", analyticsHandler.HandleDeliveryCompleted)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.completed: %w", err)
	}
	err = a.rabbitClient.Subscribe(ctx, "analytics.delivery-updated.queue", "delivery.exchange", "delivery.updated", analyticsHandler.HandleDeliveryUpdated)
	if err != nil {
		return fmt.Errorf("failed to subscribe to delivery.updated: %w", err)
	}

	slog.Info("Analytics Service consumers running successfully")

	// 4. Start background ETL worker loop (Bronze -> Silver)
	workerCtx, workerCancel := context.WithCancel(context.Background())
	a.workerCtxCancel = workerCancel

	go func() {
		defer close(a.workerDone)
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		slog.Info("Starting background ETL processing worker loop")
		for {
			select {
			case <-workerCtx.Done():
				slog.Info("Background ETL processing worker loop stopping")
				return
			case <-ticker.C:
				_, err := pipelineService.ProcessNextBatch(workerCtx, 50)
				if err != nil {
					slog.Error("Failed to process next batch of raw events", "error", err)
				}
			}
		}
	}()

	select {}
}

func (a *App) Close() {
	if a.workerCtxCancel != nil {
		a.workerCtxCancel()
	}
	// Wait for worker to stop cleanly
	select {
	case <-a.workerDone:
		slog.Info("Background ETL worker stopped cleanly")
	case <-time.After(5 * time.Second):
		slog.Warn("Timed out waiting for ETL worker to exit")
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
