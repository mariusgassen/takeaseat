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

		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			if !isAlreadyExists(err) {
				return fmt.Errorf("%s: %w", entry.Name(), err)
			}
		}
	}

	return nil
}

func isAlreadyExists(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "already exists")
}
