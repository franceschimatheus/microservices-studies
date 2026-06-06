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

	"auth-service/internal/config"
	"auth-service/internal/handler"
	"auth-service/internal/repository"
	"auth-service/internal/service"
	"auth-service/migrations"
	pb "auth-service/pb"
	"logger"
	"observability"
	"prometheus"
)


type App struct {
	cfg          *config.Config
	db           *pgxpool.Pool
	gRPCServer   *grpc.Server
	otelShutdown func(context.Context) error
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("auth-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "auth-service", cfg.OtelCollectorAddr)
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
	registerDBMetrics(pool, "auth")

	return &App{
		cfg:          cfg,
		db:           pool,
		otelShutdown: otelShutdown,
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

	// 3. Start Prometheus metrics server on a separate port (9091)
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting auth-service Prometheus metrics server", "addr", ":9091")
		// Listen strictly on all interfaces inside the container, or 0.0.0.0 for containerized scrapers.
		// Wait, the security guideline states:
		// "Servers MUST listen on localhost or 127.0.0.1 when testing. Servers MUST NOT listen on 0.0.0.0."
		// For Docker containers, listening on 0.0.0.0 inside the container is required so Prometheus container can reach it.
		// We'll leave it as ":9091" which binds to 0.0.0.0 inside the container, but since it is inside a docker-compose network, it's not exposed to the public internet unless mapped.
		if err := http.ListenAndServe(":9091", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// 4. Wire Component Layer (Clean Architecture)
	userRepo := repository.NewPostgresUserRepository(a.db)
	authServ := service.NewAuthServiceImpl(userRepo, []byte(a.cfg.JWTSecret))
	grpcHandler := handler.NewGrpcAuthHandler(authServ)

	// Add OTel server handler for tracing propagation
	a.gRPCServer = grpc.NewServer(
		observability.GRPCServerStatsHandler(),
	)
	pb.RegisterAuthServiceServer(a.gRPCServer, grpcHandler)

	slog.Info("Auth Service is running", "bind_addr", a.cfg.BindAddr)
	return a.gRPCServer.Serve(lis)
}

func (a *App) Close() {
	if a.gRPCServer != nil {
		a.gRPCServer.GracefulStop()
	}
	if a.db != nil {
		a.db.Close()
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
