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

type UserInput struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

type UserResponse struct {
	ID        string `json:"id"`
	TenantID string `json:"tenant_id"`
	Email    string `json:"email"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	CreatedAt string `json:"created_at"`
}

func (i *UserInput) Validate() error {
	if i.Email == "" || i.Name == "" {
		return problems.ErrInvalidInput
	}
	validRoles := map[string]bool{"admin": true, "manager": true, "member": true, "guest": true}
	if i.Role != "" && !validRoles[i.Role] {
		return problems.ErrInvalidInput
	}
	return nil
}

func toUserResponse(u db.User) UserResponse {
	return UserResponse{
		ID:        u.ID.String(),
		TenantID:  u.TenantID.String(),
		Email:     u.Email,
		Name:      u.Name,
		Role:      string(u.Role),
		CreatedAt: u.CreatedAt.Time.Format(time.RFC3339),
	}
}

func ListUsers(queries db.Querier) http.HandlerFunc {
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

		users, err := queries.ListUsers(r.Context(), db.ListUsersParams{
			TenantID: tid,
			Limit:    50,
			Offset:   0,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		out := make([]UserResponse, len(users))
		for i := range users {
			out[i] = toUserResponse(users[i])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"users": out})
	}
}

func GetUser(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		user, err := queries.GetUser(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toUserResponse(user))
	}
}

func CreateUser(queries db.Querier) http.HandlerFunc {
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

		var input UserInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		role := db.UserRoleMember
		if input.Role != "" {
			role = db.UserRole(input.Role)
		}

		user, err := queries.CreateUser(r.Context(), db.CreateUserParams{
			TenantID: tid,
			Email:    input.Email,
			Name:    input.Name,
			Role:    role,
		})
		if err != nil {
			writeError(w, r, problems.ErrAlreadyExists)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(toUserResponse(user))
	}
}

func UpdateUser(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input UserInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		role := db.UserRoleMember
		if input.Role != "" {
			role = db.UserRole(input.Role)
		}

		user, err := queries.UpdateUser(r.Context(), db.UpdateUserParams{
			ID:   uid,
			Name: input.Name,
			Role: role,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toUserResponse(user))
	}
}

func DeleteUser(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		if err := queries.DeleteUser(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}