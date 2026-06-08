package app

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/opensearch-project/opensearch-go"
	"google.golang.org/grpc"

	"logger"
	"observability"
	"prometheus"
	"rabbitmq"
	"search-service/internal/config"
	"search-service/internal/handler"
	"search-service/internal/repository"
	"search-service/internal/service"
	pb "search-service/pb"
)

type App struct {
	cfg          *config.Config
	gRPCServer   *grpc.Server
	otelShutdown func(context.Context) error
	rabbitClient *rabbitmq.Client
}

func New(cfg *config.Config) (*App, error) {
	logger.InitLogger("search-service", nil)
	slog.Info("Logger initialized")

	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "search-service", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	// Connect to OpenSearch
	osConfig := opensearch.Config{
		Addresses: []string{cfg.OpenSearchURL},
	}
	osClient, err := opensearch.NewClient(osConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create opensearch client: %w", err)
	}

	// Instantiate repository and initialize indices
	repo := repository.NewOpenSearchRepository(osClient)
	
	// Wait/Retry for OpenSearch to be ready
	var initErr error
	for i := 0; i < 15; i++ {
		initErr = repo.InitIndices(ctx)
		if initErr == nil {
			break
		}
		slog.Warn("Waiting for OpenSearch to be ready...", "error", initErr)
		time.Sleep(3 * time.Second)
	}
	if initErr != nil {
		return nil, fmt.Errorf("could not initialize OpenSearch indices: %w", initErr)
	}

	// Initialize RabbitMQ Client
	rabbitClient := rabbitmq.NewClient(cfg.RabbitMQURL)
	if err := rabbitClient.Connect(); err != nil {
		slog.Error("Failed to connect to RabbitMQ on startup", "error", err)
	}

	// Wire Clean Architecture layers
	serv := service.NewSearchService(repo)
	grpcHandler := handler.NewGrpcSearchHandler(serv)
	rabbitHandler := handler.NewRabbitMQHandler(serv)

	// Register RabbitMQ subscribers
	err = rabbitClient.Subscribe(ctx, "search.restaurant-created.queue", "restaurants.exchange", "restaurant.created", rabbitHandler.HandleRestaurantEvent)
	if err != nil {
		slog.Error("Failed to subscribe to restaurant.created", "error", err)
	}
	err = rabbitClient.Subscribe(ctx, "search.restaurant-updated.queue", "restaurants.exchange", "restaurant.updated", rabbitHandler.HandleRestaurantEvent)
	if err != nil {
		slog.Error("Failed to subscribe to restaurant.updated", "error", err)
	}
	err = rabbitClient.Subscribe(ctx, "search.menu-updated.queue", "restaurants.exchange", "menu.updated", rabbitHandler.HandleMenuEvent)
	if err != nil {
		slog.Error("Failed to subscribe to menu.updated", "error", err)
	}

	gRPCServer := grpc.NewServer(
		observability.GRPCServerStatsHandler(),
	)
	pb.RegisterSearchServiceServer(gRPCServer, grpcHandler)

	return &App{
		cfg:          cfg,
		gRPCServer:   gRPCServer,
		otelShutdown: otelShutdown,
		rabbitClient: rabbitClient,
	}, nil
}

func (a *App) Run() error {
	lis, err := net.Listen("tcp", a.cfg.BindAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", a.cfg.BindAddr, err)
	}

	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", prometheus.MetricsHandler())
		slog.Info("Starting search-service Prometheus metrics server", "addr", ":9092")
		if err := http.ListenAndServe(":9092", mux); err != nil {
			slog.Error("Failed to run metrics server", "error", err)
		}
	}()

	slog.Info("Search Service is running", "bind_addr", a.cfg.BindAddr)
	return a.gRPCServer.Serve(lis)
}

func (a *App) Close() {
	if a.gRPCServer != nil {
		a.gRPCServer.GracefulStop()
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
