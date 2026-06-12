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

	"gateway/internal/config"
	"gateway/internal/handler"
	"gateway/internal/middleware"
	"logger"
	"observability"
	"prometheus"


	analyticspb "analytics-service/pb"
	authpb "auth-service/pb"
	cartpb "cart-service/pb"
	orderpb "order-service/pb"
	respb "restaurant-service/pb"
	searchpb "search-service/pb"

	"github.com/redis/go-redis/v9"
)

type App struct {
	cfg            *config.Config
	fiberApp       *fiber.App
	authConn       *grpc.ClientConn
	restaurantConn *grpc.ClientConn
	cartConn       *grpc.ClientConn
	orderConn      *grpc.ClientConn
	searchConn     *grpc.ClientConn
	analyticsConn  *grpc.ClientConn
	redisClient    *redis.Client
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

	// Connect to Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	if err := redisClient.Ping(ctx).Err(); err != nil {
		slog.Error("Failed to connect to Redis", "error", err)
	} else {
		slog.Info("Successfully connected to Redis")
	}

	// Connect to Auth Service via gRPC with OTel client instrumentation
	conn, err := grpc.NewClient(cfg.AuthServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Auth Service: %w", err)
	}

	authClient := authpb.NewAuthServiceClient(conn)
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

	// Connect to Cart Service via gRPC with OTel client instrumentation
	cartConn, err := grpc.NewClient(cfg.CartServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		conn.Close()
		restaurantConn.Close()
		return nil, fmt.Errorf("failed to connect to Cart Service: %w", err)
	}

	cartClient := cartpb.NewCartServiceClient(cartConn)
	cartHandler := handler.NewCartHandler(cartClient, authClient)

	// Connect to Order Service via gRPC with OTel client instrumentation
	orderConn, err := grpc.NewClient(cfg.OrderServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		conn.Close()
		restaurantConn.Close()
		cartConn.Close()
		return nil, fmt.Errorf("failed to connect to Order Service: %w", err)
	}

	orderClient := orderpb.NewOrderServiceClient(orderConn)
	orderHandler := handler.NewOrderHandler(orderClient, cartClient, authClient, redisClient)

	// Connect to Search Service via gRPC with OTel client instrumentation
	searchConn, err := grpc.NewClient(cfg.SearchServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		conn.Close()
		restaurantConn.Close()
		cartConn.Close()
		orderConn.Close()
		return nil, fmt.Errorf("failed to connect to Search Service: %w", err)
	}

	searchClient := searchpb.NewSearchServiceClient(searchConn)
	searchHandler := handler.NewSearchHandler(searchClient)

	// Connect to Analytics Service via gRPC with OTel client instrumentation
	analyticsConn, err := grpc.NewClient(cfg.AnalyticsServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		observability.GRPCClientStatsHandler(),
	)
	if err != nil {
		conn.Close()
		restaurantConn.Close()
		cartConn.Close()
		orderConn.Close()
		searchConn.Close()
		return nil, fmt.Errorf("failed to connect to Analytics Service: %w", err)
	}

	analyticsClient := analyticspb.NewAnalyticsServiceClient(analyticsConn)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsClient, authClient)
	systemHandler := handler.NewSystemHandler(authClient)
	adminHandler := handler.NewAdminHandler(redisClient)

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
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Middleware
	fiberApp.Use(middleware.CorrelationID())
	fiberApp.Use(middleware.TracingAndMetrics("gateway"))

	// Prometheus metrics endpoint
	fiberApp.Get("/metrics", adaptor.HTTPHandler(prometheus.MetricsHandler()))

	// Routes
	fiberApp.Post("/auth/signup", authHandler.SignUp)
	fiberApp.Post("/auth/signin", authHandler.SignIn)
	fiberApp.Get("/auth/me", authHandler.Me)
	fiberApp.Post("/auth/signout", authHandler.SignOut)
	fiberApp.Get("/favicon.ico", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	fiberApp.Get("/restaurants", restaurantHandler.ListRestaurants)
	fiberApp.Post("/restaurants", restaurantHandler.CreateRestaurant)
	fiberApp.Get("/restaurants/:id", restaurantHandler.GetRestaurant)
	fiberApp.Put("/restaurants/:id", restaurantHandler.UpdateRestaurant)
	fiberApp.Delete("/restaurants/:id", restaurantHandler.DeleteRestaurant)

	fiberApp.Get("/restaurants/:restaurantId/categories", restaurantHandler.ListCategories)
	fiberApp.Post("/restaurants/:restaurantId/categories", restaurantHandler.CreateCategory)

	fiberApp.Get("/restaurants/:restaurantId/menu", restaurantHandler.GetMenu)
	fiberApp.Post("/menu-items", restaurantHandler.CreateMenuItem)
	fiberApp.Put("/menu-items/:id", restaurantHandler.UpdateMenuItem)
	fiberApp.Delete("/menu-items/:id", restaurantHandler.DeleteMenuItem)

	fiberApp.Get("/cart", cartHandler.GetCart)
	fiberApp.Post("/cart/items", cartHandler.AddItem)
	fiberApp.Delete("/cart/items/:itemId", cartHandler.RemoveItem)
	fiberApp.Delete("/cart", cartHandler.ClearCart)

	fiberApp.Post("/orders", orderHandler.CreateOrder)
	fiberApp.Get("/orders", orderHandler.ListOrders)
	fiberApp.Get("/orders/stream", orderHandler.StreamUpdates)
	fiberApp.Get("/orders/:id", orderHandler.GetOrder)
	fiberApp.Put("/orders/:id/status", orderHandler.UpdateOrderStatus)
	fiberApp.Get("/search", searchHandler.Search)
	fiberApp.Get("/admin/kpis", analyticsHandler.GetKPIs)
	fiberApp.Post("/admin/reset-system", systemHandler.ResetSystem)
	fiberApp.Get("/admin/services/status", systemHandler.GetServiceStatuses)
	fiberApp.Post("/admin/services/:name/state", systemHandler.ToggleServiceState)
	fiberApp.Get("/admin/logs/stream", adminHandler.StreamSystemLogs)

	return &App{
		cfg:            cfg,
		fiberApp:       fiberApp,
		authConn:       conn,
		restaurantConn: restaurantConn,
		cartConn:       cartConn,
		orderConn:      orderConn,
		searchConn:     searchConn,
		analyticsConn:  analyticsConn,
		redisClient:    redisClient,
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
	if a.cartConn != nil {
		if err := a.cartConn.Close(); err != nil {
			slog.Error("Error closing Cart Service gRPC connection", "error", err)
		}
	}
	if a.orderConn != nil {
		if err := a.orderConn.Close(); err != nil {
			slog.Error("Error closing Order Service gRPC connection", "error", err)
		}
	}
	if a.searchConn != nil {
		if err := a.searchConn.Close(); err != nil {
			slog.Error("Error closing Search Service gRPC connection", "error", err)
		}
	}
	if a.analyticsConn != nil {
		if err := a.analyticsConn.Close(); err != nil {
			slog.Error("Error closing Analytics Service gRPC connection", "error", err)
		}
	}
	if a.redisClient != nil {
		if err := a.redisClient.Close(); err != nil {
			slog.Error("Error closing Redis connection", "error", err)
		}
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(context.Background()); err != nil {
			slog.Error("Error shutting down OpenTelemetry tracer provider", "error", err)
		}
	}
}
