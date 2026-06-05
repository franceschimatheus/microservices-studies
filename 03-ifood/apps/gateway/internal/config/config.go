package config

import (
	"os"
)

type Config struct {
	BindAddr        string
	AuthServiceAddr string
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

	return &Config{
		BindAddr:        bindAddr,
		AuthServiceAddr: authServiceAddr,
	}
}
