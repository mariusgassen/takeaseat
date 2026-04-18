-- name: GetTenant :one
SELECT id, name, slug, sso_enforced, created_at FROM tenants WHERE id = $1;

-- name: UpdateTenant :one
UPDATE tenants SET name = $2, slug = $3, sso_enforced = $4 WHERE id = $1 RETURNING id, name, slug, sso_enforced, created_at;

-- name: GetUser :one
SELECT id, tenant_id, email, name, role, created_at FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, tenant_id, email, name, role, created_at FROM users WHERE tenant_id = $1 AND email = $2;

-- name: ListUsers :many
SELECT id, tenant_id, email, name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: CreateUser :one
INSERT INTO users (tenant_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, email, name, role, created_at;

-- name: UpdateUser :one
UPDATE users SET name = $2, role = $3 WHERE id = $1 RETURNING id, tenant_id, email, name, role, created_at;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: GetResource :one
SELECT id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at FROM resources WHERE id = $1;

-- name: ListResources :many
SELECT id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at FROM resources WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListResourcesByType :many
SELECT id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at FROM resources WHERE tenant_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4;

-- name: ListResourcesByFloor :many
SELECT id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at FROM resources WHERE tenant_id = $1 AND floor = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4;

-- name: ListResourcesAvailable :many
SELECT r.id, r.tenant_id, r.name, r.type, r.capacity, r.floor, r.amenities, r.is_active, r.location, r.created_at FROM resources r WHERE r.tenant_id = $1 AND r.is_active = TRUE AND NOT EXISTS (SELECT 1 FROM reservations res WHERE res.resource_id = r.id AND res.during @> $2::timestamptz AND res.status IN ('confirmed', 'checked_in')) ORDER BY r.name LIMIT $3 OFFSET $4;

-- name: CreateResource :one
INSERT INTO resources (tenant_id, name, type, capacity, floor, amenities, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at;

-- name: UpdateResource :one
UPDATE resources SET name = $2, type = $3, capacity = $4, floor = $5, amenities = $6, is_active = $7, location = $8 WHERE id = $1 RETURNING id, tenant_id, name, type, capacity, floor, amenities, is_active, location, created_at;

-- name: DeleteResource :exec
DELETE FROM resources WHERE id = $1;

-- name: GetReservation :one
SELECT id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at FROM reservations WHERE id = $1;

-- name: ListReservations :many
SELECT id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at FROM reservations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListReservationsByResource :many
SELECT id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at FROM reservations WHERE resource_id = $1 ORDER BY during DESC LIMIT $2 OFFSET $3;

-- name: ListReservationsByUser :many
SELECT id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at FROM reservations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListReservationsByTimeRange :many
SELECT id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at FROM reservations WHERE tenant_id = $1 AND during && $2 ORDER BY during LIMIT $3 OFFSET $4;

-- name: CreateReservation :one
INSERT INTO reservations (tenant_id, user_id, resource_id, during, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at;

-- name: UpdateReservationStatus :one
UPDATE reservations SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, tenant_id, user_id, resource_id, during, status, notes, created_at, updated_at;

-- name: DeleteReservation :exec
DELETE FROM reservations WHERE id = $1;

-- name: GetSsoProvider :one
SELECT id, tenant_id, name, protocol, issuer_url, is_active, created_at FROM sso_providers WHERE id = $1;

-- name: ListSsoProviders :many
SELECT id, tenant_id, name, protocol, issuer_url, is_active, created_at FROM sso_providers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: ListSsoProvidersActive :many
SELECT id, tenant_id, name, protocol, issuer_url, is_active, created_at FROM sso_providers WHERE tenant_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: CreateSsoProvider :one
INSERT INTO sso_providers (tenant_id, name, protocol, issuer_url, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, name, protocol, issuer_url, is_active, created_at;

-- name: DeleteSsoProvider :exec
DELETE FROM sso_providers WHERE id = $1;

-- name: ListFavorites :many
SELECT f.id, f.user_id, f.resource_id, f.created_at, r.name, r.type FROM favorites f JOIN resources r ON f.resource_id = r.id WHERE f.user_id = $1;

-- name: AddFavorite :one
INSERT INTO favorites (user_id, resource_id) VALUES ($1, $2) RETURNING id, user_id, resource_id, created_at;

-- name: RemoveFavorite :exec
DELETE FROM favorites WHERE user_id = $1 AND resource_id = $2;

-- name: JoinWaitlist :one
INSERT INTO waitlist (tenant_id, user_id, resource_id, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, user_id, resource_id, start_time, end_time, notified, created_at;

-- name: LeaveWaitlist :exec
DELETE FROM waitlist WHERE user_id = $1 AND resource_id = $2 AND start_time = $3;

-- name: GetWaitlist :many
SELECT id, tenant_id, user_id, resource_id, start_time, end_time, notified, created_at FROM waitlist WHERE resource_id = $1 AND start_time = $2;

-- name: ListMyWaitlist :many
SELECT w.id, w.resource_id, w.start_time, w.end_time, w.created_at, r.name FROM waitlist w JOIN resources r ON w.resource_id = r.id WHERE w.user_id = $1;