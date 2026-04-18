package middleware

import (
	"net/http"
	"slices"
)

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleManager Role = "manager"
	RoleMember  Role = "member"
	RoleGuest   Role = "guest"
)

var roleHierarchy = []Role{RoleAdmin, RoleManager, RoleMember, RoleGuest}

func (r Role) IsAtLeast(other Role) bool {
	selfIdx := slices.Index(roleHierarchy, r)
	otherIdx := slices.Index(roleHierarchy, other)
	return selfIdx != -1 && otherIdx != -1 && selfIdx <= otherIdx
}

func RoleAuth(allowedRoles ...Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole := GetRole(r)

			if userRole == "" {
				userRole = "member"
			}

			userRoleEnum := Role(userRole)
			allowed := false
			for _, role := range allowedRoles {
				if userRoleEnum.IsAtLeast(role) {
					allowed = true
					break
				}
			}

			if !allowed {
				handleForbidden(w, r)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return RoleAuth(RoleAdmin)(next)
}

func RequireManager(next http.Handler) http.Handler {
	return RoleAuth(RoleAdmin, RoleManager)(next)
}

func RequireMember(next http.Handler) http.Handler {
	return RoleAuth(RoleAdmin, RoleManager, RoleMember)(next)
}

func RequireGuest(next http.Handler) http.Handler {
	return RoleAuth(RoleAdmin, RoleManager, RoleMember, RoleGuest)(next)
}