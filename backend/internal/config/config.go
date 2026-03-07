package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port    string
	AppEnv  string
	AppName string

	// Database
	DatabaseURL string

	// JWT
	JWTSecret            string
	JWTAccessExpMinutes  int
	JWTRefreshExpDays    int

	// Redis
	RedisURL string

	// Meilisearch
	MeilisearchURL    string
	MeilisearchAPIKey string

	// MinIO / S3
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string
	S3Region    string

	// SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string

	// App
	FrontendURL string
}

var C *Config

func Load() (*Config, error) {
	// Load .env if it exists (ignored in production)
	_ = godotenv.Load()

	c := &Config{
		Port:                 getEnv("PORT", "8080"),
		AppEnv:               getEnv("APP_ENV", "development"),
		AppName:              getEnv("APP_NAME", "Axiora"),
		DatabaseURL:          requireEnv("DATABASE_URL"),
		JWTSecret:            requireEnv("JWT_SECRET"),
		JWTAccessExpMinutes:  getEnvInt("JWT_ACCESS_EXP_MINUTES", 15),
		JWTRefreshExpDays:    getEnvInt("JWT_REFRESH_EXP_DAYS", 30),
		RedisURL:             getEnv("REDIS_URL", "redis://localhost:6379"),
		MeilisearchURL:       getEnv("MEILISEARCH_URL", "http://localhost:7700"),
		MeilisearchAPIKey:    getEnv("MEILISEARCH_API_KEY", ""),
		S3Endpoint:           getEnv("S3_ENDPOINT", "http://localhost:9000"),
		S3AccessKey:          getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey:          getEnv("S3_SECRET_KEY", ""),
		S3Bucket:             getEnv("S3_BUCKET", "axiora"),
		S3Region:             getEnv("S3_REGION", "us-east-1"),
		SMTPHost:             getEnv("SMTP_HOST", ""),
		SMTPPort:             getEnvInt("SMTP_PORT", 587),
		SMTPUser:             getEnv("SMTP_USER", ""),
		SMTPPassword:         getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:             getEnv("SMTP_FROM", "noreply@axiora.io"),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	C = c
	return c, nil
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return i
}
