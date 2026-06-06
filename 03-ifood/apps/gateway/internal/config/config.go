package config

import (
	"os"
)

type Config struct {
	BindAddr              string
	AuthServiceAddr       string
	RestaurantServiceAddr string
	OtelCollectorAddr     string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:8080" // Default to localhost for local testing
	}

	authServiceAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authServiceAddr == "" {
		authServiceAddr = "127.0.0.1:50051"
	}

	restaurantServiceAddr := os.Getenv("RESTAURANT_SERVICE_ADDR")
	if restaurantServiceAddr == "" {
		restaurantServiceAddr = "127.0.0.1:50052"
	}

	otelCollectorAddr := os.Getenv("OTEL_COLLECTOR_ADDR")
	if otelCollectorAddr == "" {
		otelCollectorAddr = "127.0.0.1:4317"
	}

	return &Config{
		BindAddr:              bindAddr,
		AuthServiceAddr:       authServiceAddr,
		RestaurantServiceAddr: restaurantServiceAddr,
		OtelCollectorAddr:     otelCollectorAddr,
	}
}
