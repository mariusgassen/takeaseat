package migrate

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Run(pool *pgxpool.Pool) error {
	ctx := context.Background()

	schema, err := os.ReadFile(filepath.Join("migrations", "003_schema.up.sql"))
	if err != nil {
		return fmt.Errorf("read schema: %w", err)
	}

	if _, err := pool.Exec(ctx, string(schema)); err != nil {
		if !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("schema: %w", err)
		}
	}

	rls, err := os.ReadFile(filepath.Join("migrations", "004_rls.up.sql"))
	if err != nil {
		return fmt.Errorf("read rls: %w", err)
	}

	if _, err := pool.Exec(ctx, string(rls)); err != nil {
		if !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("rls: %w", err)
		}
	}

	return nil
}