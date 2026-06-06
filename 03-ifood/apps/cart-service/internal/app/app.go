package app

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"

	"cart-service/internal/config"
	"cart-service/internal/handler"
	"cart-service/internal/repository"
	"cart-service/internal/service"
	pb "cart-service/pb"
	"logger"
	"observability"
	"prometheus"
)

type App struct {
	cfg          *config.Config
	redisClient  *redis.Client
	gRPCServer   *grpc.Server
	otelShutdown func(context.Context) error
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("cart-service", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "cart-service", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	// Connect to Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	// Ping Redis to verify connection
	pingCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(pingCtx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis at %s: %w", cfg.RedisAddr, err)
	}
	slog.Info("Connected to Redis successfully", "addr", cfg.RedisAddr)

	// Register Redis pool metrics
	registerRedisMetrics(rdb, "cart")

	return &App{
		cfg:          cfg,
		redisClient:  rdb,
		otelShutdown: otelShutdown,
	}, nil
}

func (a *App) Run() error {
	// 1. Setup gRPC Listener
	lis, err := net.Listen("tcp", a.cfg.BindAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", a.cfg.BindAddr, err)
	}

	// 2. Start Prometheus metrics server on port 9093
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting cart-service Prometheus metrics server", "addr", ":9093")
		if err := http.ListenAndServe(":9093", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	// 3. Wire Component Layer (Clean Architecture)
	repo := repository.NewRedisCartRepository(a.redisClient, 24*time.Hour)
	serv := service.NewCartServiceImpl(repo)
	grpcHandler := handler.NewGrpcCartHandler(serv)

	// Add OTel server handler for tracing propagation
	a.gRPCServer = grpc.NewServer(
		observability.GRPCServerStatsHandler(),
	)
	pb.RegisterCartServiceServer(a.gRPCServer, grpcHandler)

	slog.Info("Cart Service is running", "bind_addr", a.cfg.BindAddr)
	return a.gRPCServer.Serve(lis)
}

func (a *App) Close() {
	if a.gRPCServer != nil {
		a.gRPCServer.GracefulStop()
	}
	if a.redisClient != nil {
		a.redisClient.Close()
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
