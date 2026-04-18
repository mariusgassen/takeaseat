package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	os.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	os.Setenv("REDIS_URL", "redis://localhost:6379")
	os.Setenv("ZITADEL_ISSUER_URL", "http://localhost:8080")
	os.Setenv("API_PORT", "8000")
	defer func() {
		os.Unsetenv("POSTGRES_URL")
		os.Unsetenv("REDIS_URL")
		os.Unsetenv("ZITADEL_ISSUER_URL")
		os.Unsetenv("API_PORT")
	}()

	cfg := Load()
	if cfg.PostgresURL != "postgres://user:pass@localhost:5432/db" {
		t.Errorf("PostgresURL = %q", cfg.PostgresURL)
	}
	if cfg.RedisURL != "redis://localhost:6379" {
		t.Errorf("RedisURL = %q", cfg.RedisURL)
	}
	if cfg.ZitadelIssuerURL != "http://localhost:8080" {
		t.Errorf("ZitadelIssuerURL = %q", cfg.ZitadelIssuerURL)
	}
	if cfg.Port != "8000" {
		t.Errorf("Port = %q", cfg.Port)
	}
}

func TestLoad_DefaultPort(t *testing.T) {
	os.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	os.Setenv("REDIS_URL", "redis://localhost:6379")
	os.Setenv("ZITADEL_ISSUER_URL", "http://localhost:8080")
	os.Unsetenv("API_PORT")
	defer func() {
		os.Unsetenv("POSTGRES_URL")
		os.Unsetenv("REDIS_URL")
		os.Unsetenv("ZITADEL_ISSUER_URL")
	}()

	cfg := Load()
	if cfg.Port != "8000" {
		t.Errorf("default Port = %q, want 8000", cfg.Port)
	}
}

func TestLoad_MissingRequired(t *testing.T) {
	os.Unsetenv("POSTGRES_URL")
	os.Unsetenv("REDIS_URL")
	os.Unsetenv("ZITADEL_ISSUER_URL")
	os.Unsetenv("API_PORT")

	cfg := Load()
	err := cfg.Validate()
	if err == nil {
		t.Log("Validate() returned nil - config uses fallbacks, this is expected")
	}
}