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

type ResourceInput struct {
	Name      string   `json:"name"`
	Type     string   `json:"type"`
	Capacity int32    `json:"capacity"`
	Floor    int32    `json:"floor"`
	Amenities []string `json:"amenities"`
}

type ResourceResponse struct {
	ID        string   `json:"id"`
	TenantID  string   `json:"tenant_id"`
	Name     string   `json:"name"`
	Type     string   `json:"type"`
	Capacity int32    `json:"capacity"`
	Floor    int32    `json:"floor"`
	Amenities []string `json:"amenities"`
	IsActive bool     `json:"is_active"`
	CreatedAt string   `json:"created_at"`
}

func (h *ResourceInput) Validate() error {
	if h.Name == "" {
		return problems.ErrInvalidInput
	}
	validTypes := map[string]bool{"room": true, "desk": true, "parking": true, "equipment": true}
	if !validTypes[h.Type] {
		return problems.ErrInvalidInput
	}
	if h.Capacity < 1 {
		h.Capacity = 1
	}
	return nil
}

func toResourceResponse(r db.Resource) ResourceResponse {
	var floor int32
	if r.Floor.Valid {
		floor = r.Floor.Int32
	}
	return ResourceResponse{
		ID:        r.ID.String(),
		TenantID:  r.TenantID.String(),
		Name:     r.Name,
		Type:     string(r.Type),
		Capacity: r.Capacity,
		Floor:    floor,
		Amenities: r.Amenities,
		IsActive: r.IsActive,
		CreatedAt: r.CreatedAt.Time.Format(time.RFC3339),
	}
}

func ListResources(queries db.Querier) http.HandlerFunc {
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

		resources, err := queries.ListResources(r.Context(), db.ListResourcesParams{
			TenantID: tid,
			Limit:    50,
			Offset:   0,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		out := make([]ResourceResponse, len(resources))
		for i := range resources {
			out[i] = toResourceResponse(resources[i])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"resources": out})
	}
}

func GetResource(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		resource, err := queries.GetResource(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toResourceResponse(resource))
	}
}

func CreateResource(queries db.Querier) http.HandlerFunc {
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

		var input ResourceInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		var floor pgtype.Int4
		if input.Floor > 0 {
			floor.Int32 = input.Floor
			floor.Valid = true
		}

		resource, err := queries.CreateResource(r.Context(), db.CreateResourceParams{
			TenantID:  tid,
			Name:      input.Name,
			Type:      db.ResourceType(input.Type),
			Capacity: input.Capacity,
			Floor:     floor,
			Amenities: input.Amenities,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(toResourceResponse(resource))
	}
}

func UpdateResource(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input ResourceInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		var floor pgtype.Int4
		if input.Floor > 0 {
			floor.Int32 = input.Floor
			floor.Valid = true
		}

		resource, err := queries.UpdateResource(r.Context(), db.UpdateResourceParams{
			ID:       uid,
			Name:     input.Name,
			Type:     db.ResourceType(input.Type),
			Capacity: input.Capacity,
			Floor:    floor,
			Amenities: input.Amenities,
			IsActive: true,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toResourceResponse(resource))
	}
}

func DeleteResource(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		if err := queries.DeleteResource(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}