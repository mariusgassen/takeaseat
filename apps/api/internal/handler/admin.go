package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/takeaseat/takeaseat/apps/api/internal/db"
	"github.com/takeaseat/takeaseat/apps/api/internal/middleware"
	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
)

type TenantInput struct {
	Name        string `json:"name"`
	Slug       string `json:"slug"`
	SsoEnforced bool  `json:"sso_enforced"`
}

type TenantResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug       string `json:"slug"`
	SsoEnforced bool  `json:"sso_enforced"`
	CreatedAt  string `json:"created_at"`
}

func (i *TenantInput) Validate() error {
	if i.Name == "" || i.Slug == "" {
		return problems.ErrInvalidInput
	}
	return nil
}

func toTenantResponse(t db.Tenant) TenantResponse {
	return TenantResponse{
		ID:          t.ID.String(),
		Name:        t.Name,
		Slug:       t.Slug,
		SsoEnforced: t.SsoEnforced,
		CreatedAt:  t.CreatedAt.Time.Format(time.RFC3339),
	}
}

func GetTenant(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		tenant, err := queries.GetTenant(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toTenantResponse(tenant))
	}
}

func UpdateTenant(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input TenantInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		tenant, err := queries.UpdateTenant(r.Context(), db.UpdateTenantParams{
			ID:          uid,
			Name:        input.Name,
			Slug:       input.Slug,
			SsoEnforced: input.SsoEnforced,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toTenantResponse(tenant))
	}
}

type SsoProviderInput struct {
	Name      string `json:"name"`
	Protocol string `json:"protocol"`
	IssuerURL string `json:"issuer_url"`
	IsActive  bool   `json:"is_active"`
}

type SsoProviderResponse struct {
	ID         string `json:"id"`
	TenantID   string `json:"tenant_id"`
	Name       string `json:"name"`
	Protocol   string `json:"protocol"`
	IssuerURL  string `json:"issuer_url"`
	IsActive   bool   `json:"is_active"`
	CreatedAt  string `json:"created_at"`
}

func (i *SsoProviderInput) Validate() error {
	if i.Name == "" || i.Protocol == "" || i.IssuerURL == "" {
		return problems.ErrInvalidInput
	}
	validProts := map[string]bool{"saml": true, "oidc": true, "oauth2": true}
	if !validProts[i.Protocol] {
		return problems.ErrInvalidInput
	}
	return nil
}

func toSsoProviderResponse(s db.SsoProvider) SsoProviderResponse {
	return SsoProviderResponse{
		ID:         s.ID.String(),
		TenantID:   s.TenantID.String(),
		Name:       s.Name,
		Protocol:   string(s.Protocol),
		IssuerURL:  s.IssuerUrl,
		IsActive:   s.IsActive,
		CreatedAt:  s.CreatedAt.Time.Format(time.RFC3339),
	}
}

func ListSsoProviders(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		if tenantID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		var tid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		providers, err := queries.ListSsoProviders(r.Context(), db.ListSsoProvidersParams{
			TenantID: tid,
			Limit:    50,
			Offset:   0,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		out := make([]SsoProviderResponse, len(providers))
		for i := range providers {
			out[i] = toSsoProviderResponse(providers[i])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"sso_providers": out})
	}
}

func CreateSsoProvider(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		if tenantID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		var tid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input SsoProviderInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		provider, err := queries.CreateSsoProvider(r.Context(), db.CreateSsoProviderParams{
			TenantID:  tid,
			Name:     input.Name,
			Protocol: db.SsoProtocol(input.Protocol),
			IssuerUrl: input.IssuerURL,
			IsActive: input.IsActive,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(toSsoProviderResponse(provider))
	}
}

func DeleteSsoProvider(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		if err := queries.DeleteSsoProvider(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}