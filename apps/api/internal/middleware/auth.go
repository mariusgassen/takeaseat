package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type contextKey string

const (
	ClaimsKey    contextKey = "claims"
	TenantIDKey contextKey = "tenant_id"
	UserIDKey   contextKey = "user_id"
	RoleKey     contextKey = "role"
)

type Claims struct {
	Subject     string
	TenantID    string
	Role       string
	rawToken   string
}

func (c *Claims) SetRawToken(token string) {
	c.rawToken = token
}

func (c *Claims) RawToken() string {
	return c.rawToken
}

type TokenValidator func(ctx context.Context, rawToken string) (*Claims, error)

var ErrUnauthorized = errors.New("unauthorized")

func Auth(validator TokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" {
				handleUnauthorized(w, r)
				return
			}

			parts := strings.SplitN(auth, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				handleUnauthorized(w, r)
				return
			}

			claims, err := validator(r.Context(), parts[1])
			if err != nil {
				handleUnauthorized(w, r)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, ClaimsKey, claims)
			ctx = context.WithValue(ctx, TenantIDKey, claims.TenantID)
			ctx = context.WithValue(ctx, UserIDKey, claims.Subject)
			ctx = context.WithValue(ctx, RoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetTenantID(r *http.Request) string {
	if v := r.Context().Value(TenantIDKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func GetUserID(r *http.Request) string {
	if v := r.Context().Value(UserIDKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func GetRole(r *http.Request) string {
	if v := r.Context().Value(RoleKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func GetClaims(r *http.Request) *Claims {
	if v := r.Context().Value(ClaimsKey); v != nil {
		if c, ok := v.(*Claims); ok {
			return c
		}
	}
	return nil
}

func TenantIDParam(r *http.Request) string {
	return chi.URLParam(r, "tenant_id")
}