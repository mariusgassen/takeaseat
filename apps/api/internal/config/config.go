package config

import (
	"fmt"
	"net/url"
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
	redisURL := buildRedisURL(
		getEnv("REDIS_URL", "redis://localhost:6379"),
		os.Getenv("REDIS_PASSWORD"),
	)
	return &Config{
		PostgresURL:      getEnv("POSTGRES_URL", "postgres://takeaseat:takeaseat@localhost:5432/takeaseat"),
		RedisURL:         redisURL,
		ZitadelIssuerURL: getEnv("ZITADEL_ISSUER_URL", "http://localhost:8080"),
		Port:             getEnv("API_PORT", "8000"),
	}
}

// buildRedisURL embeds the password into the Redis URL when REDIS_PASSWORD is set.
// This keeps credential management consistent with the URL-based approach used elsewhere.
func buildRedisURL(rawURL, password string) string {
	if password == "" {
		return rawURL
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Sprintf("redis://:%s@%s", url.PathEscape(password), strings.TrimPrefix(rawURL, "redis://"))
	}
	u.User = url.UserPassword("", password)
	return u.String()
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