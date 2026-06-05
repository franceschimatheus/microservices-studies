package main

import (
	"log"

	"gateway/internal/app"
	"gateway/internal/config"
)

func main() {
	log.Println("Starting Gateway Service...")

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
