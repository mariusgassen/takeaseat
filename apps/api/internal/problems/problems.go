package problems

import (
	"errors"
	"net/http"
)

type Detail struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail,omitempty"`
	Instance string `json:"instance,omitempty"`
}

func (p *Detail) Render(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(p.Status)
	return nil
}

var (
	ErrNotFound          = errors.New("not found")
	ErrAlreadyExists     = errors.New("already exists")
	ErrConflict           = errors.New("conflict")
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidInput       = errors.New("invalid input")
	ErrTooManyRequests    = errors.New("too many requests")
)

var (
	NotFound            = &Detail{Type: "https://takeaseat.ai/problems/not-found", Title: "Not Found", Status: http.StatusNotFound, Detail: "The requested resource was not found."}
	AlreadyExists       = &Detail{Type: "https://takeaseat.ai/problems/already-exists", Title: "Already Exists", Status: http.StatusConflict, Detail: "A resource with this identifier already exists."}
	Conflict            = &Detail{Type: "https://takeaseat.ai/problems/conflict", Title: "Conflict", Status: http.StatusConflict, Detail: "The request conflicts with an existing resource."}
	Forbidden           = &Detail{Type: "https://takeaseat.ai/problems/forbidden", Title: "Forbidden", Status: http.StatusForbidden, Detail: "You do not have permission to perform this action."}
	BadRequest          = &Detail{Type: "https://takeaseat.ai/problems/bad-request", Title: "Bad Request", Status: http.StatusBadRequest, Detail: "The request body is invalid."}
	TooManyRequests     = &Detail{Type: "https://takeaseat.ai/problems/too-many-requests", Title: "Too Many Requests", Status: http.StatusTooManyRequests, Detail: "Rate limit exceeded."}
	InternalError       = &Detail{Type: "https://takeaseat.ai/problems/internal-error", Title: "Internal Server Error", Status: http.StatusInternalServerError, Detail: "An unexpected error occurred."}
	MissingToken       = &Detail{Type: "https://takeaseat.ai/problems/missing-token", Title: "Missing Authorization Token", Status: http.StatusUnauthorized, Detail: "Authorization header is required."}
	InvalidTokenFormat  = &Detail{Type: "https://takeaseat.ai/problems/invalid-token-format", Title: "Invalid Token Format", Status: http.StatusUnauthorized, Detail: "Authorization header must use Bearer scheme."}
	Unauthorized        = &Detail{Type: "https://takeaseat.ai/problems/unauthorized", Title: "Unauthorized", Status: http.StatusUnauthorized, Detail: "The provided token is invalid or expired."}
)