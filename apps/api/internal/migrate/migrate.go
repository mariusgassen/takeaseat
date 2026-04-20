package migrate

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var migrations = []string{
	"001_extensions.up.sql",
	"002_roles.up.sql",
	"003_schema.up.sql",
	"004_rls.up.sql",
	"005_features.up.sql",
}

func Run(pool *pgxpool.Pool) error {
	ctx := context.Background()

	for _, name := range migrations {
		sql, err := os.ReadFile(filepath.Join("migrations", name))
		if err != nil {
			return fmt.Errorf("read %s: %w", name, err)
		}

		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			if !isAlreadyExists(err) {
				return fmt.Errorf("%s: %w", name, err)
			}
		}
	}

	return nil
}

func isAlreadyExists(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "already exists")
}
