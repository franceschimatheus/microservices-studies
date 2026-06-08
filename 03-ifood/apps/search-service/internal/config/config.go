package config

import (
	"os"
)

type Config struct {
	BindAddr          string
	OpenSearchURL     string
	OtelCollectorAddr string
	RabbitMQURL       string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50056"
	}

	openSearchURL := os.Getenv("OPENSEARCH_URL")
	if openSearchURL == "" {
		openSearchURL = "http://127.0.0.1:9200"
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
		OpenSearchURL:     openSearchURL,
		OtelCollectorAddr: otelCollectorAddr,
		RabbitMQURL:       rabbitMQURL,
	}
}
