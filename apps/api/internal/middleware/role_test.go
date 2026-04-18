package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRole_IsAtLeast(t *testing.T) {
	tests := []struct {
		name    string
		role   Role
		target Role
		want   bool
	}{
		{"admin is at least admin", RoleAdmin, RoleAdmin, true},
		{"admin is at least manager", RoleAdmin, RoleManager, true},
		{"admin is at least member", RoleAdmin, RoleMember, true},
		{"admin is at least guest", RoleAdmin, RoleGuest, true},
		{"manager is at least admin", RoleManager, RoleAdmin, false},
		{"manager is at least manager", RoleManager, RoleManager, true},
		{"manager is at least member", RoleManager, RoleMember, true},
		{"member is at least admin", RoleMember, RoleAdmin, false},
		{"member is at least member", RoleMember, RoleMember, true},
		{"guest is at least admin", RoleGuest, RoleAdmin, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.role.IsAtLeast(tt.target)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestRoleAuth_Allowed(t *testing.T) {
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := RoleAuth(RoleAdmin)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx := context.WithValue(req.Context(), RoleKey, "admin")
	handler.ServeHTTP(rec, req.WithContext(ctx))

	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestRoleAuth_Forbidden(t *testing.T) {
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := RoleAuth(RoleAdmin)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx := context.WithValue(req.Context(), RoleKey, "member")
	handler.ServeHTTP(rec, req.WithContext(ctx))

	assert.Equal(t, http.StatusForbidden, rec.Code)
}

func TestRoleAuth_MultipleRoles(t *testing.T) {
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := RoleAuth(RoleAdmin, RoleManager)(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx := context.WithValue(req.Context(), RoleKey, "manager")
	handler.ServeHTTP(rec, req.WithContext(ctx))

	assert.Equal(t, http.StatusOK, rec.Code)
}