package config

import (
	"os"
	"strings"
)

type Config struct {
	PostgresURL      string
	RedisURL         string
	ZitadelIssuerURL string
	Port            string
}

func Load() *Config {
	return &Config{
		PostgresURL:      getEnv("POSTGRES_URL", "postgres://takeaseat:takeaseat@localhost:5432/takeaseat"),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379"),
		ZitadelIssuerURL: getEnv("ZITADEL_ISSUER_URL", "http://localhost:8080"),
		Port:             getEnv("API_PORT", "8000"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (c *Config) Validate() error {
	var missing []string
	if c.PostgresURL == "" || !strings.Contains(c.PostgresURL, "postgres") {
		missing = append(missing, "POSTGRES_URL")
	}
	if c.ZitadelIssuerURL == "" {
		missing = append(missing, "ZITADEL_ISSUER_URL")
	}
	if len(missing) > 0 {
		return &ConfigError{Missing: missing}
	}
	return nil
}

type ConfigError struct {
	Missing []string
}

func (e *ConfigError) Error() string {
	return "missing required env vars: " + strings.Join(e.Missing, ", ")
}