package main

import (
	"log"
	"net/http"
	"os"

	"order/internal/client"
	"order/internal/event"
	"order/internal/handler"
	"order/internal/repository"
	"order/internal/service"
)

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func main() {
	invAddr := getEnv("INVENTORY_ADDR", "127.0.0.1:8082")
	rabbitmqURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672/")
	bindAddr := getEnv("BIND_ADDR", "127.0.0.1:8081")

	// 1. Initialize gRPC client for Inventory Service
	invClient, err := client.NewInventoryClient(invAddr)
	if err != nil {
		log.Fatalf("Failed to initialize inventory gRPC client: %v", err)
	}
	defer func() {
		_ = invClient.Close()
	}()

	// 2. Initialize RabbitMQ event publisher
	// Using localhost:5672 with default credentials for the study sandbox
	// TODO(security): Load credentials from a secure environment variable or vault in production
	pub, err := event.NewEventPublisher(rabbitmqURL)
	if err != nil {
		log.Fatalf("Failed to initialize RabbitMQ publisher: %v", err)
	}
	defer pub.Close()

	// 3. Initialize repository, service, and handlers
	repo := repository.NewPostgresRepository()
	svc := service.NewOrderService(repo, invClient, pub)
	hdl := handler.NewHTTPHandler(svc)

	// Setup multiplexer
	mux := http.NewServeMux()
	hdl.RegisterRoutes(mux)

	log.Printf("Order Service starting on %s...", bindAddr)

	if err := http.ListenAndServe(bindAddr, mux); err != nil {
		log.Fatalf("Order Service failed: %v", err)
	}
}
