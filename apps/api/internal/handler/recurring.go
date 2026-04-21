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

const maxOccurrences = 365

type RecurringInput struct {
	ResourceID  string  `json:"resource_id"`
	Frequency   string  `json:"frequency"`
	DaysOfWeek  []int   `json:"days_of_week"`
	TimeStart   string  `json:"time_start"`
	TimeEnd     string  `json:"time_end"`
	DateStart   string  `json:"date_start"`
	DateEnd     string  `json:"date_end"`
	Notes       string  `json:"notes"`
}

type RecurringSeriesResponse struct {
	ID                  string  `json:"id"`
	TenantID            string  `json:"tenant_id"`
	UserID              string  `json:"user_id"`
	ResourceID          string  `json:"resource_id"`
	Frequency           string  `json:"frequency"`
	DaysOfWeek          []int32 `json:"days_of_week"`
	TimeStart           string  `json:"time_start"`
	TimeEnd             string  `json:"time_end"`
	DateStart           string  `json:"date_start"`
	DateEnd             string  `json:"date_end"`
	Notes               string  `json:"notes"`
	CreatedAt           string  `json:"created_at"`
	OccurrencesCreated  int     `json:"occurrences_created"`
	OccurrencesSkipped  int     `json:"occurrences_skipped"`
}

func toRecurringSeriesResponse(s db.RecurringSeries, created, skipped int) RecurringSeriesResponse {
	notes := ""
	if s.Notes.Valid {
		notes = s.Notes.String
	}
	dateStart := ""
	if s.DateStart.Valid {
		dateStart = s.DateStart.Time.Format("2006-01-02")
	}
	dateEnd := ""
	if s.DateEnd.Valid {
		dateEnd = s.DateEnd.Time.Format("2006-01-02")
	}
	return RecurringSeriesResponse{
		ID:                 s.ID.String(),
		TenantID:           s.TenantID.String(),
		UserID:             s.UserID.String(),
		ResourceID:         s.ResourceID.String(),
		Frequency:          string(s.Frequency),
		DaysOfWeek:         s.DaysOfWeek,
		TimeStart:          s.TimeStart,
		TimeEnd:            s.TimeEnd,
		DateStart:          dateStart,
		DateEnd:            dateEnd,
		Notes:              notes,
		CreatedAt:          s.CreatedAt.Time.Format(time.RFC3339),
		OccurrencesCreated: created,
		OccurrencesSkipped: skipped,
	}
}

func (i *RecurringInput) validate() (time.Time, time.Time, time.Time, time.Time, error) {
	if i.ResourceID == "" {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	if i.Frequency != "daily" && i.Frequency != "weekly" {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	if i.Frequency == "weekly" && len(i.DaysOfWeek) == 0 {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}

	timeStart, err := time.Parse("15:04", i.TimeStart)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	timeEnd, err := time.Parse("15:04", i.TimeEnd)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	if !timeEnd.After(timeStart) {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}

	dateStart, err := time.Parse("2006-01-02", i.DateStart)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	dateEnd, err := time.Parse("2006-01-02", i.DateEnd)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}
	if !dateEnd.After(dateStart) {
		return time.Time{}, time.Time{}, time.Time{}, time.Time{}, problems.ErrInvalidInput
	}

	return timeStart, timeEnd, dateStart, dateEnd, nil
}

func buildOccurrences(input *RecurringInput, timeStart, timeEnd, dateStart, dateEnd time.Time) []pgtype.Range[pgtype.Timestamptz] {
	daysSet := make(map[int]bool, len(input.DaysOfWeek))
	for _, d := range input.DaysOfWeek {
		daysSet[d] = true
	}

	var ranges []pgtype.Range[pgtype.Timestamptz]
	for d := dateStart; !d.After(dateEnd) && len(ranges) < maxOccurrences; d = d.AddDate(0, 0, 1) {
		if input.Frequency == "weekly" && !daysSet[int(d.Weekday())] {
			continue
		}
		occStart := time.Date(d.Year(), d.Month(), d.Day(),
			timeStart.Hour(), timeStart.Minute(), 0, 0, time.UTC)
		occEnd := time.Date(d.Year(), d.Month(), d.Day(),
			timeEnd.Hour(), timeEnd.Minute(), 0, 0, time.UTC)
		ranges = append(ranges, pgtype.Range[pgtype.Timestamptz]{
			Lower: pgtype.Timestamptz{Time: occStart, Valid: true},
			Upper: pgtype.Timestamptz{Time: occEnd, Valid: true},
		})
	}
	return ranges
}

func CreateRecurringSeries(queries db.RecurringQuerier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		userID := middleware.GetUserID(r)
		if tenantID == "" || userID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		var tid, uid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := uid.Scan(userID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		var input RecurringInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		timeStart, timeEnd, dateStart, dateEnd, err := input.validate()
		if err != nil {
			writeError(w, r, err)
			return
		}

		var rid pgtype.UUID
		if err := rid.Scan(input.ResourceID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		daysOfWeek := make([]int32, len(input.DaysOfWeek))
		for i, d := range input.DaysOfWeek {
			daysOfWeek[i] = int32(d)
		}

		var notes pgtype.Text
		if input.Notes != "" {
			notes.String = input.Notes
			notes.Valid = true
		}

		series, err := queries.CreateRecurringSeries(r.Context(), db.CreateRecurringSeriesParams{
			TenantID:   tid,
			UserID:     uid,
			ResourceID: rid,
			Frequency:  db.RecurrenceFrequency(input.Frequency),
			DaysOfWeek: daysOfWeek,
			TimeStart:  input.TimeStart,
			TimeEnd:    input.TimeEnd,
			DateStart:  pgtype.Date{Time: dateStart, Valid: true},
			DateEnd:    pgtype.Date{Time: dateEnd, Valid: true},
			Notes:      notes,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		occurrences := buildOccurrences(&input, timeStart, timeEnd, dateStart, dateEnd)
		created, skipped := 0, 0
		for _, during := range occurrences {
			_, err := queries.CreateRecurringReservation(r.Context(), db.CreateRecurringReservationParams{
				TenantID:          tid,
				UserID:            uid,
				ResourceID:        rid,
				During:            during,
				Status:            db.ReservationStatusConfirmed,
				Notes:             notes,
				RecurringSeriesID: series.ID,
			})
			if err != nil {
				skipped++
				continue
			}
			created++
			if redisClient != nil {
				PublishAvailability(redisClient, tenantID, AvailabilityEvent{
					ResourceID: rid.String(),
					During:     rangeToString(during),
					Status:     string(db.ReservationStatusConfirmed),
				})
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(toRecurringSeriesResponse(series, created, skipped))
	}
}

func ListMyRecurringSeries(queries db.RecurringQuerier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		userID := middleware.GetUserID(r)
		if tenantID == "" || userID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		var tid, uid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}
		if err := uid.Scan(userID); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		series, err := queries.ListMyRecurringSeries(r.Context(), db.ListMyRecurringSeriesParams{
			UserID:   uid,
			TenantID: tid,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		out := make([]RecurringSeriesResponse, len(series))
		for i := range series {
			out[i] = toRecurringSeriesResponse(series[i], 0, 0)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"series": out})
	}
}

func GetRecurringSeries(queries db.RecurringQuerier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		series, err := queries.GetRecurringSeries(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(toRecurringSeriesResponse(series, 0, 0))
	}
}

func DeleteRecurringSeries(queries db.RecurringQuerier, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var uid pgtype.UUID
		if err := uid.Scan(id); err != nil {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		tenantID := middleware.GetTenantID(r)

		series, err := queries.GetRecurringSeries(r.Context(), uid)
		if err != nil {
			WriteProblem(w, r, problems.NotFound)
			return
		}

		if err := queries.CancelFutureSeriesReservations(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		if redisClient != nil && tenantID != "" {
			PublishAvailability(redisClient, tenantID, AvailabilityEvent{
				ResourceID: series.ResourceID.String(),
				During:     "",
				Status:     "series_cancelled",
			})
		}

		if err := queries.DeleteRecurringSeries(r.Context(), uid); err != nil {
			writeError(w, r, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
