package app

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "auth-service/pb"
	"gateway/internal/config"
	"gateway/internal/handler"
	"gateway/internal/middleware"
)

type App struct {
	cfg      *config.Config
	fiberApp *fiber.App
	gRPCConn *grpc.ClientConn
}

func New(cfg *config.Config) (*App, error) {
	// Connect to Auth Service via gRPC
	conn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Auth Service: %w", err)
	}

	authClient := pb.NewAuthServiceClient(conn)
	authHandler := handler.NewAuthHandler(authClient)

	fiberApp := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			log.Printf("Gateway Error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "An internal error occurred",
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

	// Routes
	fiberApp.Post("/auth/signup", authHandler.SignUp)
	fiberApp.Post("/auth/signin", authHandler.SignIn)
	fiberApp.Get("/auth/me", authHandler.Me)
	fiberApp.Post("/auth/signout", authHandler.SignOut)

	return &App{
		cfg:      cfg,
		fiberApp: fiberApp,
		gRPCConn: conn,
	}, nil
}

func (a *App) Run() error {
	log.Printf("Gateway Service is running on %s", a.cfg.BindAddr)
	return a.fiberApp.Listen(a.cfg.BindAddr)
}

func (a *App) Close() {
	if a.fiberApp != nil {
		if err := a.fiberApp.Shutdown(); err != nil {
			log.Printf("Error shutting down Fiber server: %v", err)
		}
	}
	if a.gRPCConn != nil {
		if err := a.gRPCConn.Close(); err != nil {
			log.Printf("Error closing gRPC connection: %v", err)
		}
	}
}
