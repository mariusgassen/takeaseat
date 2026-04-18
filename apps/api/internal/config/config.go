package config

import (
	"errors"
	"os"
	"strings"
)

// Config holds all runtime configuration loaded from environment variables.
type Config struct {
	PostgresURL      string // full DSN: postgres://api_user:pass@host:5432/takeaseat
	RedisURL         string // redis://host:6379
	ZitadelIssuerURL string // http://localhost:8080 (no trailing slash)
	Port             string // 8000
}

// Load reads required env vars and returns a Config.
// Returns an error listing all missing required variables.
func Load() (*Config, error) {
	c := &Config{
		PostgresURL:      os.Getenv("POSTGRES_URL"),
		RedisURL:         os.Getenv("REDIS_URL"),
		ZitadelIssuerURL: os.Getenv("ZITADEL_ISSUER_URL"),
		Port:             os.Getenv("API_PORT"),
	}

	var missing []string
	if c.PostgresURL == "" {
		missing = append(missing, "POSTGRES_URL")
	}
	if c.RedisURL == "" {
		missing = append(missing, "REDIS_URL")
	}
	if c.ZitadelIssuerURL == "" {
		missing = append(missing, "ZITADEL_ISSUER_URL")
	}
	if len(missing) > 0 {
		return nil, errors.New("missing required env vars: " + strings.Join(missing, ", "))
	}

	if c.Port == "" {
		c.Port = "8000"
	}

	return c, nil
}
