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
