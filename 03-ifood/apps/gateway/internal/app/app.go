package app

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "auth-service/pb"
	"gateway/internal/config"
	"gateway/internal/handler"
	"gateway/internal/middleware"
	"logger"
	"observability"
	respb "restaurant-service/pb"
)

type App struct {
	cfg            *config.Config
	fiberApp       *fiber.App
	authConn       *grpc.ClientConn
	restaurantConn *grpc.ClientConn
	otelShutdown   func(context.Context) error
}

func New(cfg *config.Config) (*App, error) {
	// Initialize structured logging
	logger.InitLogger("gateway", nil)
	slog.Info("Logger initialized")

	// Initialize tracing
	ctx := context.Background()
	_, otelShutdown, err := observability.InitTracer(ctx, "gateway", cfg.OtelCollectorAddr)
	if err != nil {
		slog.Error("Failed to initialize tracer", "error", err)
	}

	// Connect to Auth Service via gRPC with OTel client instrumentation
	conn, err := grpc.NewClient(cfg.AuthServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Auth Service: %w", err)
	}

	authClient := pb.NewAuthServiceClient(conn)
	authHandler := handler.NewAuthHandler(authClient)

	// Connect to Restaurant Service via gRPC with OTel client instrumentation
	restaurantConn, err := grpc.NewClient(cfg.RestaurantServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to connect to Restaurant Service: %w", err)
	}

	restaurantClient := respb.NewRestaurantServiceClient(restaurantConn)
	restaurantHandler := handler.NewRestaurantHandler(restaurantClient)

	fiberApp := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			slog.ErrorContext(c.UserContext(), "Gateway Error", "error", err, "status", code)

			message := "An internal error occurred"
			if code == fiber.StatusNotFound {
				message = "Not found"
			}
			return c.Status(code).JSON(fiber.Map{
				"error": message,
			})
		},
	})

	// Strict CORS settings
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins:     "http://127.0.0.1:3000, http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, X-Correlation-ID",
		AllowMethods:     "GET,POST,OPTIONS",
		AllowCredentials: true,
	}))

	// Middleware
	fiberApp.Use(middleware.CorrelationID())
	fiberApp.Use(middleware.TracingAndMetrics("gateway"))

	// Prometheus metrics endpoint
	fiberApp.Get("/metrics", adaptor.HTTPHandler(observability.MetricsHandler()))

	// Routes
	fiberApp.Post("/auth/signup", authHandler.SignUp)
	fiberApp.Post("/auth/signin", authHandler.SignIn)
	fiberApp.Get("/auth/me", authHandler.Me)
	fiberApp.Post("/auth/signout", authHandler.SignOut)

	fiberApp.Get("/restaurants", restaurantHandler.ListRestaurants)
	fiberApp.Post("/restaurants", restaurantHandler.CreateRestaurant)

	return &App{
		cfg:            cfg,
		fiberApp:       fiberApp,
		authConn:       conn,
		restaurantConn: restaurantConn,
		otelShutdown:   otelShutdown,
	}, nil
}

func (a *App) Run() error {
	slog.Info("Gateway Service is running", "bind_addr", a.cfg.BindAddr)
	return a.fiberApp.Listen(a.cfg.BindAddr)
}

func (a *App) Close() {
	if a.fiberApp != nil {
		if err := a.fiberApp.Shutdown(); err != nil {
			slog.Error("Error shutting down Fiber server", "error", err)
		}
	}
	if a.authConn != nil {
		if err := a.authConn.Close(); err != nil {
			slog.Error("Error closing Auth Service gRPC connection", "error", err)
		}
	}
	if a.restaurantConn != nil {
		if err := a.restaurantConn.Close(); err != nil {
			slog.Error("Error closing Restaurant Service gRPC connection", "error", err)
		}
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
