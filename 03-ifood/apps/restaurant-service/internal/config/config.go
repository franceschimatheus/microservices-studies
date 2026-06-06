package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	DBDSN             string
	OtelCollectorAddr string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50052" // Default port for restaurant service
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "postgres://restaurant_user:restaurant_password@127.0.0.1:5432/restaurant_db?sslmode=disable"
	}

	otelCollectorAddr := os.Getenv("OTEL_COLLECTOR_ADDR")
	if otelCollectorAddr == "" {
		otelCollectorAddr = "127.0.0.1:4317"
	}

	return &Config{
		BindAddr:          bindAddr,
		DBDSN:             dbDSN,
		OtelCollectorAddr: otelCollectorAddr,
	}
}
