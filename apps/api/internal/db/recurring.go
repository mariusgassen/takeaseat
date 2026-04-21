package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

type RecurrenceFrequency string

const (
	RecurrenceFrequencyDaily  RecurrenceFrequency = "daily"
	RecurrenceFrequencyWeekly RecurrenceFrequency = "weekly"
)

func (e *RecurrenceFrequency) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = RecurrenceFrequency(s)
	case string:
		*e = RecurrenceFrequency(s)
	default:
		return fmt.Errorf("unsupported scan type for RecurrenceFrequency: %T", src)
	}
	return nil
}

type RecurringSeries struct {
	ID          pgtype.UUID         `json:"id"`
	TenantID    pgtype.UUID         `json:"tenant_id"`
	UserID      pgtype.UUID         `json:"user_id"`
	ResourceID  pgtype.UUID         `json:"resource_id"`
	Frequency   RecurrenceFrequency `json:"frequency"`
	DaysOfWeek  []int32             `json:"days_of_week"`
	TimeStart   string              `json:"time_start"`
	TimeEnd     string              `json:"time_end"`
	DateStart   pgtype.Date         `json:"date_start"`
	DateEnd     pgtype.Date         `json:"date_end"`
	Notes       pgtype.Text         `json:"notes"`
	CreatedAt   pgtype.Timestamptz  `json:"created_at"`
}

// RecurringQuerier extends Querier with recurring-series operations.
type RecurringQuerier interface {
	Querier
	CreateRecurringSeries(ctx context.Context, arg CreateRecurringSeriesParams) (RecurringSeries, error)
	GetRecurringSeries(ctx context.Context, id pgtype.UUID) (RecurringSeries, error)
	ListMyRecurringSeries(ctx context.Context, arg ListMyRecurringSeriesParams) ([]RecurringSeries, error)
	DeleteRecurringSeries(ctx context.Context, id pgtype.UUID) error
	CancelFutureSeriesReservations(ctx context.Context, seriesID pgtype.UUID) error
	CreateRecurringReservation(ctx context.Context, arg CreateRecurringReservationParams) (Reservation, error)
}

var _ RecurringQuerier = (*Queries)(nil)

type CreateRecurringSeriesParams struct {
	TenantID   pgtype.UUID         `json:"tenant_id"`
	UserID     pgtype.UUID         `json:"user_id"`
	ResourceID pgtype.UUID         `json:"resource_id"`
	Frequency  RecurrenceFrequency `json:"frequency"`
	DaysOfWeek []int32             `json:"days_of_week"`
	TimeStart  string              `json:"time_start"`
	TimeEnd    string              `json:"time_end"`
	DateStart  pgtype.Date         `json:"date_start"`
	DateEnd    pgtype.Date         `json:"date_end"`
	Notes      pgtype.Text         `json:"notes"`
}

type ListMyRecurringSeriesParams struct {
	UserID   pgtype.UUID `json:"user_id"`
	TenantID pgtype.UUID `json:"tenant_id"`
}

type CreateRecurringReservationParams struct {
	TenantID          pgtype.UUID                      `json:"tenant_id"`
	UserID            pgtype.UUID                      `json:"user_id"`
	ResourceID        pgtype.UUID                      `json:"resource_id"`
	During            pgtype.Range[pgtype.Timestamptz] `json:"during"`
	Status            ReservationStatus                `json:"status"`
	Notes             pgtype.Text                      `json:"notes"`
	RecurringSeriesID pgtype.UUID                      `json:"recurring_series_id"`
}

const createRecurringSeries = `INSERT INTO recurring_series
(tenant_id, user_id, resource_id, frequency, days_of_week, time_start, time_end, date_start, date_end, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, tenant_id, user_id, resource_id, frequency, days_of_week, time_start, time_end, date_start, date_end, notes, created_at`

func (q *Queries) CreateRecurringSeries(ctx context.Context, arg CreateRecurringSeriesParams) (RecurringSeries, error) {
	row := q.db.QueryRow(ctx, createRecurringSeries,
		arg.TenantID,
		arg.UserID,
		arg.ResourceID,
		arg.Frequency,
		arg.DaysOfWeek,
		arg.TimeStart,
		arg.TimeEnd,
		arg.DateStart,
		arg.DateEnd,
		arg.Notes,
	)
	var i RecurringSeries
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.UserID,
		&i.ResourceID,
		&i.Frequency,
		&i.DaysOfWeek,
		&i.TimeStart,
		&i.TimeEnd,
		&i.DateStart,
		&i.DateEnd,
		&i.Notes,
		&i.CreatedAt,
	)
	return i, err
}

const getRecurringSeries = `SELECT id, tenant_id, user_id, resource_id, frequency, days_of_week, time_start, time_end, date_start, date_end, notes, created_at
FROM recurring_series WHERE id = $1`

func (q *Queries) GetRecurringSeries(ctx context.Context, id pgtype.UUID) (RecurringSeries, error) {
	row := q.db.QueryRow(ctx, getRecurringSeries, id)
	var i RecurringSeries
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.UserID,
		&i.ResourceID,
		&i.Frequency,
		&i.DaysOfWeek,
		&i.TimeStart,
		&i.TimeEnd,
		&i.DateStart,
		&i.DateEnd,
		&i.Notes,
		&i.CreatedAt,
	)
	return i, err
}

const listMyRecurringSeries = `SELECT id, tenant_id, user_id, resource_id, frequency, days_of_week, time_start, time_end, date_start, date_end, notes, created_at
FROM recurring_series WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`

func (q *Queries) ListMyRecurringSeries(ctx context.Context, arg ListMyRecurringSeriesParams) ([]RecurringSeries, error) {
	rows, err := q.db.Query(ctx, listMyRecurringSeries, arg.UserID, arg.TenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RecurringSeries
	for rows.Next() {
		var i RecurringSeries
		if err := rows.Scan(
			&i.ID,
			&i.TenantID,
			&i.UserID,
			&i.ResourceID,
			&i.Frequency,
			&i.DaysOfWeek,
			&i.TimeStart,
			&i.TimeEnd,
			&i.DateStart,
			&i.DateEnd,
			&i.Notes,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const deleteRecurringSeries = `DELETE FROM recurring_series WHERE id = $1`

func (q *Queries) DeleteRecurringSeries(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteRecurringSeries, id)
	return err
}

const cancelFutureSeriesReservations = `UPDATE reservations SET status = 'cancelled', updated_at = NOW()
WHERE recurring_series_id = $1 AND lower(during) > NOW() AND status IN ('confirmed', 'checked_in')`

func (q *Queries) CancelFutureSeriesReservations(ctx context.Context, seriesID pgtype.UUID) error {
	_, err := q.db.Exec(ctx, cancelFutureSeriesReservations, seriesID)
	return err
}

const createRecurringReservation = `INSERT INTO reservations (tenant_id, user_id, resource_id, during, status, notes, recurring_series_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at`

func (q *Queries) CreateRecurringReservation(ctx context.Context, arg CreateRecurringReservationParams) (Reservation, error) {
	row := q.db.QueryRow(ctx, createRecurringReservation,
		arg.TenantID,
		arg.UserID,
		arg.ResourceID,
		arg.During,
		arg.Status,
		arg.Notes,
		arg.RecurringSeriesID,
	)
	var i Reservation
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.UserID,
		&i.ResourceID,
		&i.During,
		&i.Status,
		&i.Notes,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
