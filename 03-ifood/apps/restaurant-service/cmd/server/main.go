package main

import (
	"log"

	"restaurant-service/internal/app"
	"restaurant-service/internal/config"
)

func main() {
	log.Println("Starting Restaurant Service...")

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
