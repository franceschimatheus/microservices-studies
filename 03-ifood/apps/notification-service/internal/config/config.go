package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	OtelCollectorAddr string
	RabbitMQURL       string
	RedisAddr         string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:9096"
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
		OtelCollectorAddr: otelCollectorAddr,
		RabbitMQURL:       rabbitMQURL,
		RedisAddr:         redisAddr,
	}
}
