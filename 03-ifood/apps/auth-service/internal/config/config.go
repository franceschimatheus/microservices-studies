package config

import (
	"log"
	"os"
)

type Config struct {
	BindAddr  string
	DBDSN     string
	JWTSecret string
}

func Load() *Config {
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1:50051" // Default to localhost for local testing
	}

	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "postgres://auth_user:auth_password@127.0.0.1:5432/auth_db?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Println("WARNING: JWT_SECRET env is missing. Falling back to secure development fallback secret.")
		jwtSecret = "development-fallback-secret-key-that-is-long-enough-for-hs256"
	}

	return &Config{
		BindAddr:  bindAddr,
		DBDSN:     dbDSN,
		JWTSecret: jwtSecret,
	}
}
