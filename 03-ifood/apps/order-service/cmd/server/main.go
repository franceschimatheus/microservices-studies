package main

import (
	"log"

	"order-service/internal/app"
	"order-service/internal/config"
)

func main() {
	log.Println("Starting Order Service...")

	cfg := config.Load()

	application, err := app.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer application.Close()

	if err := application.Run(); err != nil {
		log.Fatalf("Application execution failed: %v", err)
	}
}
