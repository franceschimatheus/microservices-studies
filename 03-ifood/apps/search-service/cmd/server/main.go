package main

import (
	"log"

	"search-service/internal/app"
	"search-service/internal/config"
)

func main() {
	log.Println("Starting Search Service...")

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
