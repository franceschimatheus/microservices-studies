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
		bindAddr = "127.0.0.1:50054"
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "postgres://order_user:order_password@127.0.0.1:5434/order_db?sslmode=disable"
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
