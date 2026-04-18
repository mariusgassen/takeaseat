package db_test

import (
	"context"
	"os"
	"testing"

	appdb "github.com/takeaseat/takeaseat/apps/api/internal/db"
)

func TestNewPool_InvalidDSN(t *testing.T) {
	_, err := appdb.NewPool(context.Background(), "not-a-valid-dsn")
	if err == nil {
		t.Fatal("expected error for invalid DSN, got nil")
	}
}

// TestNewPool_Connect requires a running postgres. Skip if POSTGRES_URL not set.
func TestNewPool_Connect(t *testing.T) {
	url := os.Getenv("POSTGRES_URL")
	if url == "" {
		t.Skip("POSTGRES_URL not set — skipping integration test")
	}

	pool, err := appdb.NewPool(context.Background(), url)
	if err != nil {
		t.Fatalf("NewPool() error = %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		t.Fatalf("Ping() error = %v", err)
	}
}
