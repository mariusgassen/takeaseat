# Take A Seat — Phase 1, Plan A: Monorepo + Infra + DB Schema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold Turborepo monorepo, bring up Docker Compose stack (Postgres 18 + Redis 8 + Zitadel 4), define full database schema with RLS policies, and verify tenant isolation works end-to-end via psql.

**Architecture:** Single-DB multi-tenancy with `tenant_id` on every table; RLS enforced at DB level using `current_setting('app.tenant_id', true)`; Go API will set this per request via `SET LOCAL`. Monorepo uses Turborepo 2.9 with workspace packages for web, mobile, API, shared types, and UI.

**Tech Stack:** Turborepo 2.9, Docker Compose, PostgreSQL 18 + PostGIS + btree_gist, Redis 8, Zitadel 4, Go 1.26 (stub only in this plan)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `package.json` | Create | Root workspace config, Turborepo dev dependency |
| `turbo.json` | Create | Build pipeline: api:build → types:generate → web/mobile build |
| `.gitignore` | Create | Node, Go, Docker, IDE ignores |
| `.env.example` | Create | All required env vars with documentation |
| `docker-compose.yml` | Create | postgres, redis, zitadel, api, web services |
| `infra/postgres/01-extensions.sql` | Create | PostGIS, btree_gist, pgcrypto extensions |
| `infra/postgres/02-roles.sql` | Create | `api_user` role with limited permissions |
| `infra/postgres/03-schema.sql` | Create | All 6 tables with constraints + indexes |
| `infra/postgres/04-rls.sql` | Create | RLS enable + tenant isolation policies |
| `apps/api/go.mod` | Create | Go module stub (github.com/takeaseat/takeaseat/apps/api) |
| `apps/api/main.go` | Create | Minimal main() — just log "starting" |
| `apps/web/package.json` | Create | Next.js workspace package stub |
| `apps/mobile/package.json` | Create | Expo workspace package stub |
| `packages/types/package.json` | Create | Generated types package stub |
| `packages/ui/package.json` | Create | shadcn/ui components package stub |
| `scripts/verify-schema.sh` | Create | psql smoke test: schema exists + RLS isolation |

---

## Task 1: Root Monorepo Files

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "takeaseat",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "generate": "turbo generate"
  },
  "devDependencies": {
    "turbo": "^2.9.0"
  },
  "packageManager": "npm@10.0.0"
}
```

- [ ] **Step 2: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**", "../../openapi.yaml"]
    },
    "generate": {
      "dependsOn": ["api#build"],
      "inputs": ["../../openapi.yaml"],
      "outputs": ["src/generated/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
# Node
node_modules/
.npm
*.log
.turbo/
.next/
out/
dist/
build/

# Go
apps/api/bin/
*.exe
*.test
*.out

# Env
.env
.env.local
.env.*.local

# Docker
.docker/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Generated
packages/types/src/generated/
openapi.yaml
```

- [ ] **Step 4: Commit**

```bash
git add package.json turbo.json .gitignore
git commit -m "chore: init Turborepo monorepo"
```

---

## Task 2: Environment Config

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```bash
# ── Postgres ──────────────────────────────────────────────────────────
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=takeaseat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme_postgres

# App DB role (used by Go API — RLS enforced for this role)
API_DB_USER=api_user
API_DB_PASSWORD=changeme_api

# Zitadel's own DB (same postgres instance, separate database)
ZITADEL_DB=zitadel
ZITADEL_DB_USER=zitadel
ZITADEL_DB_PASSWORD=changeme_zitadel

# ── Redis ──────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Zitadel ───────────────────────────────────────────────────────────
# 32-byte random master key: openssl rand -base64 32
ZITADEL_MASTERKEY=changeme_32byte_masterkey_here!!

ZITADEL_EXTERNAL_DOMAIN=localhost
ZITADEL_EXTERNAL_PORT=8080
ZITADEL_EXTERNAL_SECURE=false

# ── API ───────────────────────────────────────────────────────────────
API_PORT=8000
# Zitadel issuer URL — used by Go API for JWT validation
ZITADEL_ISSUER_URL=http://localhost:8080

# ── Web ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ZITADEL_URL=http://localhost:8080
```

- [ ] **Step 2: Copy to `.env` and fill in values**

```bash
cp .env.example .env
# Edit .env — change all "changeme_*" values to real secrets
# For local dev, defaults are fine except ZITADEL_MASTERKEY must be exactly 32 bytes:
#   openssl rand -base64 32 | head -c 32
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example with all required vars"
```

---

## Task 3: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  redis:
    image: redis:8-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  zitadel:
    image: ghcr.io/zitadel/zitadel:latest
    restart: on-failure
    command: start-from-init --masterkey "${ZITADEL_MASTERKEY}" --tlsMode disabled
    environment:
      ZITADEL_DATABASE_POSTGRES_HOST: postgres
      ZITADEL_DATABASE_POSTGRES_PORT: 5432
      ZITADEL_DATABASE_POSTGRES_DATABASE: ${ZITADEL_DB}
      ZITADEL_DATABASE_POSTGRES_USER_USERNAME: ${ZITADEL_DB_USER}
      ZITADEL_DATABASE_POSTGRES_USER_PASSWORD: ${ZITADEL_DB_PASSWORD}
      ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE: disable
      ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME: ${POSTGRES_USER}
      ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD: ${POSTGRES_PASSWORD}
      ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE: disable
      ZITADEL_EXTERNALDOMAIN: ${ZITADEL_EXTERNAL_DOMAIN}
      ZITADEL_EXTERNALPORT: ${ZITADEL_EXTERNAL_PORT}
      ZITADEL_EXTERNALSECURE: ${ZITADEL_EXTERNAL_SECURE}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      zitadel:
        condition: service_started

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add Docker Compose stack (postgres, redis, zitadel, api, web)"
```

---

## Task 4: PostgreSQL Init SQL — Extensions and Roles

**Files:**
- Create: `infra/postgres/01-extensions.sql`
- Create: `infra/postgres/02-roles.sql`

- [ ] **Step 1: Create `infra/postgres/01-extensions.sql`**

```sql
-- Run as superuser (postgres) — postgres container does this automatically on first start.
-- These extensions must exist before the schema creates geometry columns and exclusion constraints.

CREATE EXTENSION IF NOT EXISTS postgis;         -- geometry type + spatial indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;      -- required for EXCLUDE USING gist on non-geometry cols
CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- gen_random_uuid()

-- Create Zitadel database and role (Zitadel manages its own schema)
CREATE DATABASE zitadel;
CREATE ROLE zitadel WITH LOGIN PASSWORD 'changeme_zitadel';
GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel;
\connect zitadel
GRANT ALL ON SCHEMA public TO zitadel;
\connect takeaseat
```

**Note:** The Zitadel password here must match `ZITADEL_DB_PASSWORD` in `.env`. In production, use a secrets manager. For local dev this is fine.

- [ ] **Step 2: Create `infra/postgres/02-roles.sql`**

```sql
-- api_user: the role used by the Go API.
-- RLS policies are scoped to this role — superuser bypasses RLS by default.
-- The Go API connects as api_user; migrations run as superuser via a separate connection.

CREATE ROLE api_user WITH LOGIN PASSWORD 'changeme_api';

-- Grant connect to the app database
GRANT CONNECT ON DATABASE takeaseat TO api_user;

-- Schema usage
GRANT USAGE ON SCHEMA public TO api_user;

-- Table permissions granted after schema creation (see 03-schema.sql footer)
-- SELECT, INSERT, UPDATE, DELETE on all app tables — NOT schema-altering DDL
```

**Note:** The api_user password must match `API_DB_PASSWORD` in `.env`.

- [ ] **Step 3: Commit**

```bash
git add infra/postgres/01-extensions.sql infra/postgres/02-roles.sql
git commit -m "infra: postgres extensions and api_user role"
```

---

## Task 5: PostgreSQL Schema

**Files:**
- Create: `infra/postgres/03-schema.sql`

- [ ] **Step 1: Create `infra/postgres/03-schema.sql`**

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Take A Seat — Phase 1 Schema
-- Runs as superuser on first postgres container start.
-- ─────────────────────────────────────────────────────────────────────────────

SET client_min_messages = WARNING;

-- ── Tenants ──────────────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    slug         TEXT        NOT NULL UNIQUE,
    sso_enforced BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member', 'guest');

CREATE TABLE users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email      TEXT        NOT NULL,
    name       TEXT        NOT NULL,
    role       user_role   NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- ── Resources ─────────────────────────────────────────────────────────────────
CREATE TYPE resource_type AS ENUM ('room', 'desk', 'parking', 'equipment');

CREATE TABLE resources (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name       TEXT          NOT NULL,
    type       resource_type NOT NULL,
    capacity   INT           NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    floor      INT,
    amenities  TEXT[]        NOT NULL DEFAULT '{}',
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    -- NULL until Phase 2 (floor plan feature)
    location   geometry(Point, 4326),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_tenant_id ON resources(tenant_id);
CREATE INDEX idx_resources_type      ON resources(tenant_id, type);
CREATE INDEX idx_resources_location  ON resources USING GIST(location)
    WHERE location IS NOT NULL;

-- ── Reservations ──────────────────────────────────────────────────────────────
CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled', 'checked_in', 'no_show');

CREATE TABLE reservations (
    id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID               NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    resource_id UUID               NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    during      TSTZRANGE          NOT NULL,
    status      reservation_status NOT NULL DEFAULT 'confirmed',
    notes       TEXT,
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    -- Conflict detection: no two confirmed reservations can overlap for same resource.
    -- This is atomic — no application-level locking needed.
    EXCLUDE USING GIST (
        resource_id WITH =,
        during      WITH &&
    ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_reservations_tenant_id   ON reservations(tenant_id);
CREATE INDEX idx_reservations_resource_id ON reservations(resource_id);
CREATE INDEX idx_reservations_user_id     ON reservations(user_id);
CREATE INDEX idx_reservations_during      ON reservations USING GIST(during);

-- ── SSO Providers ─────────────────────────────────────────────────────────────
CREATE TYPE sso_protocol AS ENUM ('saml', 'oidc', 'oauth2');

CREATE TABLE sso_providers (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name       TEXT         NOT NULL,
    protocol   sso_protocol NOT NULL,
    issuer_url TEXT         NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sso_providers_tenant_id ON sso_providers(tenant_id);

-- ── User Identities ───────────────────────────────────────────────────────────
-- Maps a Zitadel identity (sub / SAML nameID) to an internal user record.
CREATE TABLE user_identities (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    provider_id UUID        NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
    subject     TEXT        NOT NULL,  -- JWT `sub` or SAML nameID
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, subject)
);

CREATE INDEX idx_user_identities_user_id     ON user_identities(user_id);
CREATE INDEX idx_user_identities_provider_id ON user_identities(provider_id);

-- ── Grant table permissions to api_user ──────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
    tenants, users, resources, reservations, sso_providers, user_identities
    TO api_user;
```

- [ ] **Step 2: Commit**

```bash
git add infra/postgres/03-schema.sql
git commit -m "infra: database schema — tenants, users, resources, reservations, sso"
```

---

## Task 6: Row-Level Security Policies

**Files:**
- Create: `infra/postgres/04-rls.sql`

- [ ] **Step 1: Create `infra/postgres/04-rls.sql`**

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security — Tenant Isolation
--
-- The Go API sets `SET LOCAL app.tenant_id = '<uuid>'` at the start of each
-- request (inside a transaction). All queries run as api_user and see only
-- rows for that tenant.
--
-- current_setting('app.tenant_id', true) — the `true` arg is missing_ok:
--   returns NULL if the setting isn't set rather than throwing an error.
--   This means superuser connections (migrations, admin queries) with no
--   app.tenant_id set will get NULL, which never matches any tenant_id,
--   so they see zero rows via api_user. Superuser itself bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

-- ── Tenant isolation policies ─────────────────────────────────────────────────

-- Direct tenant_id check for tables that have the column
CREATE POLICY tenant_isolation ON users
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON resources
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON reservations
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON sso_providers
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- user_identities has no tenant_id — isolate via user_id membership.
-- Because users has RLS applied, this subquery is automatically filtered
-- by the current tenant setting.
CREATE POLICY tenant_isolation ON user_identities
    TO api_user
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE tenant_id::text = current_setting('app.tenant_id', true)
        )
    );
```

- [ ] **Step 2: Commit**

```bash
git add infra/postgres/04-rls.sql
git commit -m "infra: row-level security — tenant isolation policies for all tables"
```

---

## Task 7: App Package Stubs

Turborepo requires all workspace packages to have valid `package.json` or `go.mod` files. These stubs satisfy that without building anything real (Plans B–D fill these in).

**Files:**
- Create: `apps/api/go.mod`
- Create: `apps/api/main.go`
- Create: `apps/web/package.json`
- Create: `apps/mobile/package.json`
- Create: `packages/types/package.json`
- Create: `packages/ui/package.json`

- [ ] **Step 1: Create `apps/api/go.mod`**

```
module github.com/takeaseat/takeaseat/apps/api

go 1.26
```

- [ ] **Step 2: Create `apps/api/main.go`**

```go
package main

import (
	"log"
	"os"
)

func main() {
	log.SetOutput(os.Stdout)
	log.Println("takeaseat api starting — stub")
}
```

- [ ] **Step 3: Create `apps/api/Dockerfile`**

```dockerfile
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o bin/api ./...

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /app/bin/api .
EXPOSE 8000
CMD ["./api"]
```

- [ ] **Step 4: Create `apps/web/package.json`**

```json
{
  "name": "@takeaseat/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 5: Create `apps/mobile/package.json`**

```json
{
  "name": "@takeaseat/mobile",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "expo start",
    "build": "expo export",
    "lint": "expo lint"
  }
}
```

- [ ] **Step 6: Create `packages/types/package.json`**

```json
{
  "name": "@takeaseat/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/generated/index.ts",
  "scripts": {
    "generate": "orval"
  }
}
```

- [ ] **Step 7: Create `packages/ui/package.json`**

```json
{
  "name": "@takeaseat/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src"
  }
}
```

- [ ] **Step 8: Install root dependencies**

```bash
npm install
```

Expected output: `node_modules/` at root, symlinks in each workspace.

- [ ] **Step 9: Commit**

```bash
git add apps/api/go.mod apps/api/main.go apps/api/Dockerfile
git add apps/web/package.json apps/mobile/package.json
git add packages/types/package.json packages/ui/package.json
git add package-lock.json
git commit -m "chore: add app and package stubs for all workspaces"
```

---

## Task 8: Smoke Test — Verify Stack and Schema

**Files:**
- Create: `scripts/verify-schema.sh`

- [ ] **Step 1: Create `scripts/verify-schema.sh`**

```bash
#!/usr/bin/env bash
# Verifies the postgres schema and RLS tenant isolation.
# Run after `docker compose up -d postgres` and postgres is healthy.
# Usage: ./scripts/verify-schema.sh

set -euo pipefail

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-postgres}"
PGPASSWORD="${POSTGRES_PASSWORD:-changeme_postgres}"
PGDB="${POSTGRES_DB:-takeaseat}"
API_USER="${API_DB_USER:-api_user}"
API_PASS="${API_DB_PASSWORD:-changeme_api}"

export PGPASSWORD

echo "=== 1. Verify tables exist ==="
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -c "\dt" 2>&1 | \
  grep -E "tenants|users|resources|reservations|sso_providers|user_identities" | \
  { read -r line && echo "OK: $line" || (echo "FAIL: tables not found" && exit 1); } || true

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" << 'EOSQL'
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants','users','resources','reservations','sso_providers','user_identities')
ORDER BY tablename;
EOSQL

echo ""
echo "=== 2. Verify extensions ==="
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -c \
  "SELECT extname FROM pg_extension WHERE extname IN ('postgis','btree_gist','pgcrypto') ORDER BY extname;"

echo ""
echo "=== 3. Verify RLS tenant isolation ==="

# Seed two tenants + one resource each as superuser
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" << 'EOSQL'
DO $$
DECLARE
  t1 UUID := '11111111-1111-1111-1111-111111111111';
  t2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Clean up previous test runs
  DELETE FROM reservations WHERE tenant_id IN (t1, t2);
  DELETE FROM resources    WHERE tenant_id IN (t1, t2);
  DELETE FROM users        WHERE tenant_id IN (t1, t2);
  DELETE FROM tenants      WHERE id        IN (t1, t2);

  INSERT INTO tenants (id, name, slug) VALUES
    (t1, 'Tenant Alpha', 'alpha'),
    (t2, 'Tenant Beta',  'beta');

  INSERT INTO resources (tenant_id, name, type, capacity) VALUES
    (t1, 'Alpha Room A', 'room', 10),
    (t2, 'Beta Desk 1',  'desk', 1);
END $$;
EOSQL

# As api_user with tenant set to t1 — should see only Alpha's resource
export PGPASSWORD="$API_PASS"
RESULT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$API_USER" -d "$PGDB" -t << 'EOSQL'
BEGIN;
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT name FROM resources;
COMMIT;
EOSQL
)

echo "Resources visible to Tenant Alpha: $RESULT"
if echo "$RESULT" | grep -q "Alpha Room A" && ! echo "$RESULT" | grep -q "Beta Desk 1"; then
  echo "OK: RLS isolates Tenant Alpha correctly"
else
  echo "FAIL: RLS isolation broken for Tenant Alpha"
  exit 1
fi

# As api_user with tenant set to t2 — should see only Beta's resource
RESULT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$API_USER" -d "$PGDB" -t << 'EOSQL'
BEGIN;
SET LOCAL app.tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT name FROM resources;
COMMIT;
EOSQL
)

echo "Resources visible to Tenant Beta: $RESULT"
if echo "$RESULT" | grep -q "Beta Desk 1" && ! echo "$RESULT" | grep -q "Alpha Room A"; then
  echo "OK: RLS isolates Tenant Beta correctly"
else
  echo "FAIL: RLS isolation broken for Tenant Beta"
  exit 1
fi

echo ""
echo "=== All checks passed ==="
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x scripts/verify-schema.sh
git add scripts/verify-schema.sh
git commit -m "test: add schema + RLS smoke test script"
```

- [ ] **Step 3: Start postgres**

```bash
docker compose up -d postgres
```

Wait for healthy:
```bash
docker compose ps
# postgres should show "healthy" under Status
```

If not healthy after 30 seconds:
```bash
docker compose logs postgres
# Common issue: port 5432 already in use — check with: lsof -i :5432
```

- [ ] **Step 4: Run verification**

```bash
# Load env vars
set -a && source .env && set +a

./scripts/verify-schema.sh
```

Expected output:
```
=== 1. Verify tables exist ===
 tenants | users | resources | reservations | sso_providers | user_identities
(6 rows)

=== 2. Verify extensions ===
  extname
-----------
 btree_gist
 pgcrypto
 postgis
(3 rows)

=== 3. Verify RLS tenant isolation ===
Resources visible to Tenant Alpha:  Alpha Room A
OK: RLS isolates Tenant Alpha correctly
Resources visible to Tenant Beta:  Beta Desk 1
OK: RLS isolates Tenant Beta correctly

=== All checks passed ===
```

- [ ] **Step 5: Start full stack**

```bash
docker compose up -d
```

Wait ~30 seconds for Zitadel to initialize (it runs DB migrations on first start). Then:

```bash
docker compose ps
# All services should show "running" or "healthy"

curl -s http://localhost:8080/healthz
# Expected: {"status":"ok"} (Zitadel health endpoint)
```

If Zitadel fails:
```bash
docker compose logs zitadel
# Common issue: ZITADEL_MASTERKEY must be exactly 32 bytes
# Fix: openssl rand -base64 32 | head -c 32
```

- [ ] **Step 6: Stop stack**

```bash
docker compose down
# Note: postgres_data volume persists — schema survives restarts
# To reset completely: docker compose down -v
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: Plan A complete — monorepo scaffold, infra, schema, RLS verified"
```

---

## Plan A Complete

Stack is running. Schema applied. RLS tenant isolation verified.

**What's next:**
- **Plan B:** `openapi.yaml` + Go API (Chi router, Zitadel JWT middleware, sqlc queries, all REST endpoints, SSE + Redis pub/sub)
- **Plan C:** `packages/types` (orval code gen) + Next.js web app (OIDC auth, resource/booking UI)
- **Plan D:** Expo mobile app (PKCE auth, booking UI)

Plans B, C, D are independent of each other once Plan B is complete (C and D both consume the generated types from openapi.yaml).
