package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"analytics-service/internal/app"
	"analytics-service/internal/config"
)

func main() {
	log.Println("Starting Analytics Service...")

	cfg := config.Load()

	application, err := app.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}

	// Graceful shutdown channel listening
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := application.Run(); err != nil {
			log.Fatalf("Error running application: %v", err)
		}
	}()

	sig := <-sigChan
	log.Printf("Received signal %v, shutting down...", sig)
	application.Close()
	fmt.Println("Analytics Service stopped.")
}
