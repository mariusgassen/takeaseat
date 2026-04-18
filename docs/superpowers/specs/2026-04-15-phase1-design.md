# Take A Seat — Phase 1 Design Spec

**Date:** 2026-04-15
**Status:** Approved
**Scope:** Core booking loop — resources, reservations, auth, multi-tenancy

---

## 1. Phase 1 Scope

Core booking loop only:
- Create and manage resources (rooms, desks, parking, equipment)
- Make reservations with conflict detection
- Auth via Zitadel (local, OAuth2, OIDC, SAML)
- User roles: admin, manager, member, guest
- Multi-tenant foundation with full row-level isolation

Deferred to later phases: floor plan UI, notifications, calendar integrations, admin analytics, TimescaleDB.

---

## 2. Architecture

Monorepo (Turborepo 2.9):

```
takeaseat/
├── apps/
│   ├── api/       Go 1.26 — Chi 5, sqlc 1.30, pgx
│   ├── web/       Next.js 16 (App Router), TypeScript 6, Tailwind CSS v4.2, shadcn/ui
│   └── mobile/    Expo SDK 55, NativeWind v5
├── packages/
│   ├── types/     Generated TS from OpenAPI spec (orval)
│   └── ui/        shadcn/ui components (web only)
├── infra/
│   ├── docker-compose.yml
│   ├── postgres/  init.sql (postgis extension)
│   └── redis/
├── turbo.json
└── openapi.yaml   Source of truth for API contract
```

Build pipeline: `api:build → openapi.yaml → types:generate → web:build, mobile:build`

---

## 3. Multi-Tenancy

- Row-level isolation: single DB, `tenant_id` on every table
- RLS policies enforced at DB level
- Go API middleware: extracts `tenant_id` from Zitadel JWT, sets `SET LOCAL app.tenant_id = $1` per request
- `sso_enforced` flag per tenant — blocks local auth when SSO is mandated
- Tenant never encoded in API URL — resolved from JWT claim only

---

## 4. Auth

Zitadel 4 (self-hosted) handles all auth flows:

| Tenant type | Auth method |
|-------------|-------------|
| Small | Username + password (Zitadel local accounts) |
| Mid-size | OAuth2 (Google, Microsoft) |
| Enterprise | SAML / OIDC (Okta, Entra ID) — per-tenant IdP |

- Go API validates JWTs only — no session management
- Next.js uses `openid-client` for OIDC
- Expo uses PKCE OAuth2 flow

---

## 5. Data Model

```sql
tenants (id, name, slug, sso_enforced, created_at)

users (id, tenant_id, email, name, role, created_at)
  role: admin | manager | member | guest

resources (id, tenant_id, name, type, capacity, floor, amenities[], is_active,
           location geometry(Point,4326), created_at)
  type: room | desk | parking | equipment
  location: PostGIS point — NULL until floor plan feature (Phase 2)

reservations (id, tenant_id, user_id, resource_id, during TSTZRANGE,
              status, notes, created_at)
  status: confirmed | cancelled | checked_in | no_show
  EXCLUDE USING gist (resource_id WITH =, during WITH &&) WHERE (status = 'confirmed')

sso_providers (id, tenant_id, name, protocol, issuer_url, is_active, created_at)
  protocol: saml | oidc | oauth2

user_identities (id, user_id, provider_id, subject, created_at)
  subject: JWT `sub` or SAML nameID — maps Zitadel identity → internal user record
```

RLS enabled on: `users`, `resources`, `reservations`.

Conflict detection: PostgreSQL exclusion constraint on `(resource_id, during)` — atomic, no application-level locking needed.

---

## 6. API Surface

**Base:** `/api/v1/`
**Versioning:** URL prefix
**Tenant resolution:** JWT claim only
**Pagination:** Cursor-based (`?after=<cursor>&limit=N`)
**Errors:** RFC 9457 Problem Details (`application/problem+json`)

### Resources

```
GET    /api/v1/resources
       ?type=room|desk|parking|equipment
       &capacity_min=N
       &floor=N
       &available_from=<ISO8601>
       &available_until=<ISO8601>
       &after=<cursor>&limit=N
POST   /api/v1/resources
GET    /api/v1/resources/{id}
PUT    /api/v1/resources/{id}
DELETE /api/v1/resources/{id}
```

### Reservations

```
GET    /api/v1/reservations
       ?resource_id=<uuid>
       &user_id=<uuid>
       &from=<ISO8601>
       &until=<ISO8601>
       &after=<cursor>&limit=N
POST   /api/v1/reservations
GET    /api/v1/reservations/{id}
PATCH  /api/v1/reservations/{id}/status   # body: { status: confirmed|cancelled|checked_in|no_show }
DELETE /api/v1/reservations/{id}
```

### Users

```
GET    /api/v1/users?after=<cursor>&limit=N
POST   /api/v1/users
GET    /api/v1/users/{id}
PATCH  /api/v1/users/{id}
DELETE /api/v1/users/{id}
GET    /api/v1/me
```

### Tenant & SSO (admin only)

```
GET    /api/v1/tenants/{id}
PATCH  /api/v1/tenants/{id}
GET    /api/v1/sso-providers
POST   /api/v1/sso-providers
DELETE /api/v1/sso-providers/{id}
```

---

## 7. Real-Time Availability

**Transport:** Server-Sent Events (SSE) — HTTP-native, proxy-friendly.

```
GET /api/v1/resources/availability/stream?resource_ids=uuid1,uuid2
→ Content-Type: text/event-stream
→ event payload: { resource_id, during, status }
```

**Flow:**
1. Client connects with `resource_ids` filter
2. Go handler holds open SSE connection
3. On reservation write: `pgx` commits → API publishes to Redis channel `availability:{tenant_id}`
4. SSE handler subscribes to Redis, fans out to connected clients filtered by `resource_ids`

Redis pub/sub is internal only — never exposed to clients directly.

---

## 8. Deployment

`docker-compose.yml` at repo root. Single `.env` for secrets.

| Service | Image | Notes |
|---------|-------|-------|
| postgres | postgres:18-alpine | Persistent volume, init.sql runs PostGIS |
| redis | redis:8-alpine | No persistence — cache/pub-sub only |
| zitadel | ghcr.io/zitadel/zitadel:latest | depends_on: postgres |
| api | apps/api/Dockerfile | depends_on: postgres, redis, zitadel |
| web | apps/web/Dockerfile | depends_on: api |

Operators run `docker compose up -d`. No Kubernetes, no Helm.
