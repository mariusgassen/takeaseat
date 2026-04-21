package handler

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildOccurrences_Daily(t *testing.T) {
	input := &RecurringInput{
		ResourceID: "r1",
		Frequency:  "daily",
		DaysOfWeek: nil,
		TimeStart:  "09:00",
		TimeEnd:    "10:00",
		DateStart:  "2026-04-21",
		DateEnd:    "2026-04-25",
	}
	ts, _ := time.Parse("15:04", input.TimeStart)
	te, _ := time.Parse("15:04", input.TimeEnd)
	ds, _ := time.Parse("2006-01-02", input.DateStart)
	de, _ := time.Parse("2006-01-02", input.DateEnd)

	occs := buildOccurrences(input, ts, te, ds, de)
	assert.Len(t, occs, 5, "daily for 5 days should produce 5 occurrences")

	firstStart := occs[0].Lower.Time.UTC()
	assert.Equal(t, 2026, firstStart.Year())
	assert.Equal(t, time.April, firstStart.Month())
	assert.Equal(t, 21, firstStart.Day())
	assert.Equal(t, 9, firstStart.Hour())
	assert.Equal(t, 0, firstStart.Minute())
}

func TestBuildOccurrences_Weekly(t *testing.T) {
	input := &RecurringInput{
		ResourceID: "r1",
		Frequency:  "weekly",
		DaysOfWeek: []int{1, 3}, // Mon + Wed
		TimeStart:  "14:00",
		TimeEnd:    "15:00",
		DateStart:  "2026-04-20", // Monday
		DateEnd:    "2026-04-26", // Sunday
	}
	ts, _ := time.Parse("15:04", input.TimeStart)
	te, _ := time.Parse("15:04", input.TimeEnd)
	ds, _ := time.Parse("2006-01-02", input.DateStart)
	de, _ := time.Parse("2006-01-02", input.DateEnd)

	occs := buildOccurrences(input, ts, te, ds, de)
	// Mon Apr 20 + Wed Apr 22 = 2 occurrences
	require.Len(t, occs, 2)
	assert.Equal(t, 20, occs[0].Lower.Time.UTC().Day())
	assert.Equal(t, 22, occs[1].Lower.Time.UTC().Day())
}

func TestBuildOccurrences_MaxCap(t *testing.T) {
	input := &RecurringInput{
		Frequency:  "daily",
		DaysOfWeek: nil,
		TimeStart:  "09:00",
		TimeEnd:    "10:00",
		DateStart:  "2025-01-01",
		DateEnd:    "2030-12-31",
	}
	ts, _ := time.Parse("15:04", input.TimeStart)
	te, _ := time.Parse("15:04", input.TimeEnd)
	ds, _ := time.Parse("2006-01-02", input.DateStart)
	de, _ := time.Parse("2006-01-02", input.DateEnd)

	occs := buildOccurrences(input, ts, te, ds, de)
	assert.Equal(t, maxOccurrences, len(occs), "should cap at maxOccurrences")
}

func TestRecurringInput_Validate_InvalidFrequency(t *testing.T) {
	input := &RecurringInput{
		ResourceID: "abc",
		Frequency:  "monthly",
		TimeStart:  "09:00",
		TimeEnd:    "10:00",
		DateStart:  "2026-04-21",
		DateEnd:    "2026-05-21",
	}
	_, _, _, _, err := input.validate()
	assert.Error(t, err)
}

func TestRecurringInput_Validate_WeeklyNoDays(t *testing.T) {
	input := &RecurringInput{
		ResourceID: "abc",
		Frequency:  "weekly",
		DaysOfWeek: []int{},
		TimeStart:  "09:00",
		TimeEnd:    "10:00",
		DateStart:  "2026-04-21",
		DateEnd:    "2026-05-21",
	}
	_, _, _, _, err := input.validate()
	assert.Error(t, err)
}

func TestRecurringInput_Validate_EndBeforeStart(t *testing.T) {
	input := &RecurringInput{
		ResourceID: "abc",
		Frequency:  "daily",
		TimeStart:  "10:00",
		TimeEnd:    "09:00",
		DateStart:  "2026-04-21",
		DateEnd:    "2026-05-21",
	}
	_, _, _, _, err := input.validate()
	assert.Error(t, err)
}
