package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"audit/internal/handler"
	"audit/internal/service"
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
	svc := service.NewAuditService()
	amqpHdl := handler.NewAMQPHandler(svc)
	httpHdl := handler.NewHTTPHandler(svc)

	rabbitmqURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672/")
	bindAddr := getEnv("BIND_ADDR", "127.0.0.1:8085")

	// Start RabbitMQ background log consumer
	// Using localhost:5672 with default credentials for the study sandbox
	// TODO(security): Load credentials from a secure environment variable or vault in production
	if err := amqpHdl.StartConsumer(ctx, rabbitmqURL); err != nil {
		log.Fatalf("Audit Service failed to start RabbitMQ consumer: %v", err)
	}

	// Setup HTTP multiplexer for logs/metrics endpoints
	mux := http.NewServeMux()
	httpHdl.RegisterRoutes(mux)

	log.Printf("Audit Service (Log Aggregator) starting on %s...", bindAddr)

	if err := http.ListenAndServe(bindAddr, mux); err != nil {
		log.Fatalf("Audit Service failed: %v", err)
	}
}
