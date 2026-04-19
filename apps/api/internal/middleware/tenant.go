package middleware

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantDB struct {
	pool *pgxpool.Pool
}

func NewTenantDB(pool *pgxpool.Pool) *TenantDB {
	return &TenantDB{pool: pool}
}

func (t *TenantDB) Scoped(ctx context.Context, fn func(ctx context.Context) error) error {
	tenantID := GetTenantIDFromContext(ctx)
	if tenantID == "" {
		return fn(ctx)
	}

	scopedCtx := newContextWithTenantID(ctx, tenantID)
	return fn(scopedCtx)
}

func (t *TenantDB) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := GetTenantID(r)
		if tenantID == "" {
			next.ServeHTTP(w, r)
			return
		}

		ctx := newContextWithTenantID(r.Context(), tenantID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func newContextWithTenantID(ctx context.Context, tenantID string) context.Context {
	return context.WithValue(ctx, TenantIDKey, tenantID)
}

type DBSetter interface {
	Exec(ctx context.Context, sql string, args ...any) error
}

func TenantDBConn(pool *pgxpool.Pool) DBSetter {
	return &tenantDBSetter{pool: pool}
}

type tenantDBSetter struct {
	pool *pgxpool.Pool
}

func (t *tenantDBSetter) Exec(ctx context.Context, sql string, args ...any) error {
	tenantID := GetTenantIDFromContext(ctx)
	if tenantID == "" {
		return nil
	}
	_, err := t.pool.Exec(ctx, "SET LOCAL app.tenant_id = $1", tenantID)
	if err != nil {
		return err
	}
	_, err = t.pool.Exec(ctx, sql, args...)
	return err
}