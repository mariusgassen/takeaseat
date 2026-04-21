package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/render"
	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
)

var (
	ErrNotFound        = problems.ErrNotFound
	ErrAlreadyExists   = problems.ErrAlreadyExists
	ErrConflict        = problems.ErrConflict
	ErrForbidden      = problems.ErrForbidden
	ErrInvalidInput   = problems.ErrInvalidInput
	ErrTooManyRequests = problems.ErrTooManyRequests
)

var (
	ProblemNotFound          = problems.NotFound
	ProblemAlreadyExists    = problems.AlreadyExists
	ProblemConflict         = problems.Conflict
	ProblemForbidden       = problems.Forbidden
	ProblemBadRequest       = problems.BadRequest
	ProblemTooManyRequests = problems.TooManyRequests
	ProblemInternalError  = problems.InternalError
	ProblemMissingToken     = problems.MissingToken
	ProblemInvalidTokenFormat = problems.InvalidTokenFormat
	ProblemUnauthorized    = problems.Unauthorized
)

func WriteProblem(w http.ResponseWriter, r *http.Request, p *problems.Detail) {
	d := *p
	if d.Instance == "" {
		d.Instance = r.URL.String()
	}
	render.Status(r, d.Status)
	render.JSON(w, r, &d)
}

func RenderProblem(w http.ResponseWriter, r *http.Request, p *problems.Detail) {
	WriteProblem(w, r, p)
}

func NotImplemented(w http.ResponseWriter, r *http.Request) {
	WriteProblem(w, r, &problems.Detail{
		Type:   "https://takeaseat.ai/problems/not-implemented",
		Title:  "Not Implemented",
		Status: http.StatusNotImplemented,
		Detail: "This endpoint is not yet implemented.",
	})
}

func writeError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, problems.ErrNotFound):
		WriteProblem(w, r, problems.NotFound)
	case errors.Is(err, problems.ErrAlreadyExists):
		WriteProblem(w, r, problems.AlreadyExists)
	case errors.Is(err, problems.ErrConflict):
		WriteProblem(w, r, problems.Conflict)
	case errors.Is(err, problems.ErrForbidden):
		WriteProblem(w, r, problems.Forbidden)
	case errors.Is(err, problems.ErrInvalidInput):
		WriteProblem(w, r, problems.BadRequest)
	case errors.Is(err, problems.ErrTooManyRequests):
		WriteProblem(w, r, problems.TooManyRequests)
	default:
		WriteProblem(w, r, problems.InternalError)
	}
}