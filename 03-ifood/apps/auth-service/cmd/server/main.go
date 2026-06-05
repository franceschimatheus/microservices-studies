package main

import (
	"log"

	"auth-service/internal/app"
	"auth-service/internal/config"
)

func main() {
	log.Println("Starting Auth Service...")

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
