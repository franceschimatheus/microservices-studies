package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	DBDSN             string
	OtelCollectorAddr string
	RabbitMQURL       string
	RedisAddr         string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50057"
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "postgres://analytics_user:analytics_password@127.0.0.1:5436/analytics_db?sslmode=disable"
	}

	otelCollectorAddr := os.Getenv("OTEL_COLLECTOR_ADDR")
	if otelCollectorAddr == "" {
		otelCollectorAddr = "127.0.0.1:4317"
	}

	rabbitMQURL := os.Getenv("RABBITMQ_URL")
	if rabbitMQURL == "" {
		rabbitMQURL = "amqp://guest:guest@127.0.0.1:5672/"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	return &Config{
		BindAddr:          bindAddr,
		DBDSN:             dbDSN,
		OtelCollectorAddr: otelCollectorAddr,
		RabbitMQURL:       rabbitMQURL,
		RedisAddr:         redisAddr,
	}
}
