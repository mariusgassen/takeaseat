package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/takeaseat/takeaseat/apps/api/internal/db"
	"github.com/takeaseat/takeaseat/apps/api/internal/middleware"
	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
)

func FilterResources(queries db.Querier) http.HandlerFunc {
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

		query := r.URL.Query()
		resourceType := query.Get("type")
		capacityMin := query.Get("capacity_min")
		floor := query.Get("floor")
		amenities := query.Get("amenities")

		var resources []db.Resource
		var err error

		switch {
		case resourceType != "":
			resources, err = queries.ListResourcesByType(r.Context(), db.ListResourcesByTypeParams{
				TenantID: tid,
				Type:     db.ResourceType(resourceType),
				Limit:    50,
				Offset:   0,
			})
		case floor != "":
			var floorInt int32
			for _, c := range floor {
				if c >= '0' && c <= '9' {
					floorInt = floorInt*10 + int32(c-'0')
				}
			}
			resources, err = queries.ListResourcesByFloor(r.Context(), db.ListResourcesByFloorParams{
				TenantID: tid,
				Floor:    pgtype.Int4{Int32: floorInt, Valid: floorInt > 0},
				Limit:    50,
				Offset:   0,
			})
		default:
			resources, err = queries.ListResources(r.Context(), db.ListResourcesParams{
				TenantID: tid,
				Limit:    50,
				Offset:   0,
			})
		}

		if err != nil {
			writeError(w, r, err)
			return
		}

		var out []ResourceResponse
		for _, res := range resources {
			resp := toResourceResponse(res)

			if capacityMin != "" {
				var capMin int32
				for _, c := range capacityMin {
					if c >= '0' && c <= '9' {
						capMin = capMin*10 + int32(c-'0')
					}
				}
				if resp.Capacity < capMin {
					continue
				}
			}

			if amenities != "" {
				hasAll := true
				want := strings.Split(amenities, ",")
				for _, w := range want {
					found := false
					for _, a := range resp.Amenities {
						if strings.TrimSpace(a) == strings.TrimSpace(w) {
							found = true
							break
						}
					}
					if !found {
						hasAll = false
						break
					}
				}
				if !hasAll {
					continue
				}
			}

			out = append(out, resp)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"resources": out})
	}
}

func GetResourceAvailability(queries db.Querier) http.HandlerFunc {
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

		reservations, err := queries.ListReservationsByResource(r.Context(), db.ListReservationsByResourceParams{
			ResourceID: uid,
			Limit:     100,
			Offset:    0,
		})
		if err != nil {
			writeError(w, r, err)
			return
		}

		var booked []string
		for _, res := range reservations {
			if res.Status == db.ReservationStatusConfirmed || res.Status == db.ReservationStatusCheckedIn {
				booked = append(booked, rangeToString(res.During))
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{
			"resource":     toResourceResponse(resource),
			"unavailable":  booked,
		})
	}
}