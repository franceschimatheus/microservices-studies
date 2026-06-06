package config

import (
	"os"
	"strconv"
)

type Config struct {
	GatewayURL      string
	ConcurrentUsers int
}

func Load() *Config {
	gatewayURL := os.Getenv("GATEWAY_URL")
	if gatewayURL == "" {
		gatewayURL = "http://127.0.0.1:8085"
	}

	concurrentUsers := 5
	if concurrentUsersStr := os.Getenv("CONCURRENT_USERS"); concurrentUsersStr != "" {
		if val, err := strconv.Atoi(concurrentUsersStr); err == nil {
			concurrentUsers = val
		}
	}

	return &Config{
		GatewayURL:      gatewayURL,
		ConcurrentUsers: concurrentUsers,
	}
}
