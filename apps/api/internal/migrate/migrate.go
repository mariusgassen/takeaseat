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

	entries, err := os.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".up.sql") {
			continue
		}

		sql, err := os.ReadFile(filepath.Join("migrations", entry.Name()))
		if err != nil {
			return fmt.Errorf("read %s: %w", entry.Name(), err)
		}

		up := upSection(string(sql))
		if _, err := pool.Exec(ctx, up); err != nil {
			if !isAlreadyExists(err) {
				return fmt.Errorf("%s: %w", entry.Name(), err)
			}
		}
	}

	return nil
}

func isAlreadyExists(err error) bool {
	return strings.Contains(err.Error(), "already exists")
}

// upSection returns only the SQL before the -- migrate:down marker.
func upSection(sql string) string {
	if idx := strings.Index(sql, "-- migrate:down"); idx != -1 {
		return sql[:idx]
	}
	return sql
}
