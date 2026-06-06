package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	RedisAddr         string
	OtelCollectorAddr string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50053"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	otelCollectorAddr := os.Getenv("OTEL_COLLECTOR_ADDR")
	if otelCollectorAddr == "" {
		otelCollectorAddr = "127.0.0.1:4317"
	}

	return &Config{
		BindAddr:          bindAddr,
		RedisAddr:         redisAddr,
		OtelCollectorAddr: otelCollectorAddr,
	}
}
