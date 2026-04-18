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
	"github.com/takeaseat/takeaseat/apps/api/internal/redis"
)

type ReservationInput struct {
	ResourceID string `json:"resource_id"`
	Start    string `json:"start"`
	End     string `json:"end"`
	Notes   string `json:"notes"`
}

type ReservationResponse struct {
	ID         string `json:"id"`
	TenantID   string `json:"tenant_id"`
	UserID    string `json:"user_id"`
	ResourceID string `json:"resource_id"`
	During    string `json:"during"`
	Status   string `json:"status"`
	Notes    string `json:"notes"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (i *ReservationInput) Validate() error {
	if i.ResourceID == "" {
		return problems.ErrInvalidInput
	}
	return nil
}

func rangeToString(r pgtype.Range[pgtype.Timestamptz]) string {
	if !r.Lower.Valid || !r.Upper.Valid {
		return ""
	}
	return "[" + r.Lower.Time.Format(time.RFC3339) + "," + r.Upper.Time.Format(time.RFC3339) + ")"
}

func toReservationResponse(r db.Reservation) ReservationResponse {
	notes := ""
	if r.Notes.Valid {
		notes = r.Notes.String
	}
	return ReservationResponse{
		ID:         r.ID.String(),
		TenantID:   r.TenantID.String(),
		UserID:    r.UserID.String(),
		ResourceID: r.ResourceID.String(),
		During:    rangeToString(r.During),
		Status:    string(r.Status),
		Notes:    notes,
		CreatedAt: r.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func ListReservations(queries db.Querier) http.HandlerFunc {
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

		reservations, err := queries.ListReservations(r.Context(), db.ListReservationsParams{
			TenantID: tid,
			Limit:    50,
			Offset:   0,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		out := make([]ReservationResponse, len(reservations))
		for i := range reservations {
			out[i] = toReservationResponse(reservations[i])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"reservations": out})
	}
}

func GetReservation(queries db.Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		reservation, err := queries.GetReservation(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toReservationResponse(reservation))
	}
}

func CreateReservation(queries db.Querier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		if tenantID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		userID := middleware.GetUserID(r)
		if userID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		var tid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var uid pgtype.UUID
		if err := uid.Scan(userID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input ReservationInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			writeError(w, r, err)
			return
		}

		var rid pgtype.UUID
		if err := rid.Scan(input.ResourceID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		start, _ := time.Parse(time.RFC3339, input.Start)
		end, _ := time.Parse(time.RFC3339, input.End)
		during := pgtype.Range[pgtype.Timestamptz]{
			Lower: pgtype.Timestamptz{Time: start, Valid: true},
			Upper: pgtype.Timestamptz{Time: end, Valid: true},
		}

		var notes pgtype.Text
		if input.Notes != "" {
			notes.String = input.Notes
			notes.Valid = true
		}

		reservation, err := queries.CreateReservation(r.Context(), db.CreateReservationParams{
			TenantID:   tid,
			UserID:     uid,
			ResourceID: rid,
			During:    during,
			Status:    db.ReservationStatusConfirmed,
			Notes:     notes,
		})
		if err != nil {
			writeError(w, r, problems.ErrConflict)
			return
		}

		if redisClient != nil {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: reservation.ResourceID.String(),
				During:    rangeToString(reservation.During),
				Status:    string(reservation.Status),
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(toReservationResponse(reservation))
	}
}

func CheckIn(queries db.Querier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		reservation, err := queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
			ID:     uid,
			Status: db.ReservationStatusCheckedIn,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		tenantID := middleware.GetTenantID(r)
		if redisClient != nil && tenantID != "" {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: reservation.ResourceID.String(),
				During:    rangeToString(reservation.During),
				Status:    string(reservation.Status),
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toReservationResponse(reservation))
	}
}

func CheckOut(queries db.Querier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		reservation, err := queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
			ID:     uid,
			Status: db.ReservationStatusConfirmed,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		tenantID := middleware.GetTenantID(r)
		if redisClient != nil && tenantID != "" {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: reservation.ResourceID.String(),
				During:    rangeToString(reservation.During),
				Status:    string(reservation.Status),
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toReservationResponse(reservation))
	}
}

func UpdateReservationStatus(queries db.Querier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input struct {
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		status := db.ReservationStatus(input.Status)
		validStatuses := map[db.ReservationStatus]bool{
			db.ReservationStatusConfirmed: true,
			db.ReservationStatusCancelled: true,
			db.ReservationStatusCheckedIn: true,
			db.ReservationStatusNoShow: true,
		}
		if !validStatuses[status] {
			writeError(w, r, problems.ErrInvalidInput)
			return
		}

		tenantID := middleware.GetTenantID(r)

		reservation, err := queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
			ID:     uid,
			Status: status,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		if redisClient != nil && tenantID != "" {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: reservation.ResourceID.String(),
				During:    rangeToString(reservation.During),
				Status:    string(reservation.Status),
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toReservationResponse(reservation))
	}
}

func DeleteReservation(queries db.Querier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		tenantID := middleware.GetTenantID(r)

		existing, err := queries.GetReservation(r.Context(), uid)
		if err == nil && redisClient != nil && tenantID != "" {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: existing.ResourceID.String(),
				During:    rangeToString(existing.During),
				Status:    "deleted",
			})
		}

		if err := queries.DeleteReservation(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}