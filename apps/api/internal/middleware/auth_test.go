package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuth_MissingToken(t *testing.T) {
	noopValidator := func(ctx context.Context, token string) (*Claims, error) {
		return &Claims{Subject: "user1", TenantID: "tenant1", Role: "member"}, nil
	}

	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := Auth(noopValidator)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "unauthorized")
}

func TestAuth_InvalidFormat(t *testing.T) {
	noopValidator := func(ctx context.Context, token string) (*Claims, error) {
		return &Claims{Subject: "user1", TenantID: "tenant1", Role: "member"}, nil
	}

	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := Auth(noopValidator)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Basic xyz")
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "unauthorized")
}

func TestAuth_ValidToken(t *testing.T) {
	noopValidator := func(ctx context.Context, token string) (*Claims, error) {
		return &Claims{Subject: "user1", TenantID: "tenant1", Role: "member"}, nil
	}

	called := false
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		called = true
		claims := GetClaims(r)
		assert.Equal(t, "user1", claims.Subject)
		assert.Equal(t, "tenant1", claims.TenantID)
		assert.Equal(t, "member", claims.Role)
		w.WriteHeader(http.StatusOK)
	})

	handler := Auth(noopValidator)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer validtoken")
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.True(t, called)
}

func TestAuth_ValidatorError(t *testing.T) {
	failValidator := func(ctx context.Context, token string) (*Claims, error) {
		return nil, ErrUnauthorized
	}

	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := Auth(failValidator)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer badtoken")
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestGetTenantID_Empty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	assert.Equal(t, "", GetTenantID(req))
}

func TestGetRole_Empty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	assert.Equal(t, "", GetRole(req))
}