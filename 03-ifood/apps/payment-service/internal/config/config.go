package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	DBDSN             string
	OtelCollectorAddr string
	RabbitMQURL       string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50055"
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "postgres://payment_user:payment_password@127.0.0.1:5435/payment_db?sslmode=disable"
	}

	otelCollectorAddr := os.Getenv("OTEL_COLLECTOR_ADDR")
	if otelCollectorAddr == "" {
		otelCollectorAddr = "127.0.0.1:4317"
	}

	rabbitMQURL := os.Getenv("RABBITMQ_URL")
	if rabbitMQURL == "" {
		rabbitMQURL = "amqp://guest:guest@127.0.0.1:5672/"
	}

	return &Config{
		BindAddr:          bindAddr,
		DBDSN:             dbDSN,
		OtelCollectorAddr: otelCollectorAddr,
		RabbitMQURL:       rabbitMQURL,
	}
}
