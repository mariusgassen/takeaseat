package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Migrate(pool *pgxpool.Pool) error {
	ctx := context.Background()

	extensions := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE EXTENSION IF NOT EXISTS "postgis"`,
	}

	for _, sql := range extensions {
		if _, err := pool.Exec(ctx, sql); err != nil {
			return fmt.Errorf("extension: %w", err)
		}
	}

	roles := []string{
		`CREATE ROLE api_user WITH LOGIN PASSWORD 'api_user'`,
	}

	for _, sql := range roles {
		if _, err := pool.Exec(ctx, sql); err != nil && !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("role: %w", err)
		}
	}

	migrations, err := os.ReadFile(filepath.Join(".", "migrations", "003_schema.up.sql"))
	if err != nil {
		return fmt.Errorf("read schema: %w", err)
	}

	if _, err := pool.Exec(ctx, string(migrations)); err != nil {
		return fmt.Errorf("schema: %w", err)
	}

	rls, err := os.ReadFile(filepath.Join(".", "migrations", "004_rls.up.sql"))
	if err != nil {
		return fmt.Errorf("read rls: %w", err)
	}

	if _, err := pool.Exec(ctx, string(rls)); err != nil {
		return fmt.Errorf("rls: %w", err)
	}

	sort.Strings(nil)
	fmt.Println("migrations: complete")
	return nil
}