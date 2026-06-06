package main

import (
	"log"

	"cart-service/internal/app"
	"cart-service/internal/config"
)

func main() {
	log.Println("Starting Cart Service...")

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
