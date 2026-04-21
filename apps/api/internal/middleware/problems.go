package middleware

import (
	"net/http"

	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
)

var (
	ProblemProblemMissingToken     = problems.MissingToken
	ProblemInvalidTokenFormat  = problems.InvalidTokenFormat
	ProblemUnauthorized        = problems.Unauthorized
	ProblemForbidden         = problems.Forbidden
)

func WriteProblem(w http.ResponseWriter, r *http.Request, p *problems.Detail) {
	d := *p
	d.Instance = r.URL.String()
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(d.Status)
	w.Write([]byte(`{"type":"` + d.Type + `","title":"` + d.Title + `","status":` + itoa(d.Status) + `,"detail":"` + d.Detail + `","instance":"` + d.Instance + `"}`)) //nolint:errcheck
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}

func handleUnauthorized(w http.ResponseWriter, r *http.Request) {
	WriteProblem(w, r, ProblemUnauthorized)
}

func handleForbidden(w http.ResponseWriter, r *http.Request) {
	WriteProblem(w, r, ProblemForbidden)
}