package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"payment/internal/handler"
	"payment/internal/repository"
	"payment/internal/service"
)

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func main() {
	// Initialize context for background workers
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize layers
	repo := repository.NewPostgresRepository()
	svc := service.NewPaymentService(repo)
	hdl := handler.NewGRPCHandler(svc)

	rabbitmqURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672/")
	bindAddr := getEnv("BIND_ADDR", "127.0.0.1:8083")

	// Start RabbitMQ background consumer
	// TODO(security): Load credentials from a secure environment variable or vault in production
	if err := hdl.StartConsumer(ctx, rabbitmqURL); err != nil {
		log.Fatalf("Payment Service failed to start RabbitMQ consumer: %v", err)
	}

	// Setup HTTP multiplexer for control ports
	mux := http.NewServeMux()
	hdl.RegisterRoutes(mux)

	log.Printf("Payment Service starting on %s...", bindAddr)

	if err := http.ListenAndServe(bindAddr, mux); err != nil {
		log.Fatalf("Payment Service failed: %v", err)
	}
}
