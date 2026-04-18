-- migrate:up
SET client_min_messages = WARNING;

-- Tenants
CREATE TABLE tenants (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    slug         TEXT        NOT NULL UNIQUE,
    sso_enforced BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
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

-- Resources
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
    location   geometry(Point, 4326),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_tenant_id ON resources(tenant_id);
CREATE INDEX idx_resources_type      ON resources(tenant_id, type);
CREATE INDEX idx_resources_location  ON resources USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX idx_resources_tenant_type_active ON resources(tenant_id, type) WHERE is_active = TRUE;

-- Reservations
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
    updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    EXCLUDE USING GIST (
        resource_id WITH =,
        during      WITH &&
    ) WHERE (status IN ('confirmed', 'checked_in'))
);

CREATE INDEX idx_reservations_tenant_id   ON reservations(tenant_id);
CREATE INDEX idx_reservations_resource_id ON reservations(resource_id);
CREATE INDEX idx_reservations_user_id     ON reservations(user_id);
CREATE INDEX idx_reservations_during      ON reservations USING GIST(during);
CREATE INDEX idx_reservations_resource_during ON reservations USING GIST (resource_id, during) WHERE status IN ('confirmed', 'checked_in');
CREATE INDEX idx_reservations_tenant_status ON reservations(tenant_id, status);

-- SSO Providers
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

-- User Identities
CREATE TABLE user_identities (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    provider_id UUID        NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
    subject     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, subject)
);

CREATE INDEX idx_user_identities_user_id     ON user_identities(user_id);
CREATE INDEX idx_user_identities_provider_id ON user_identities(provider_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON
    tenants, users, resources, reservations, sso_providers, user_identities
    TO api_user;
GRANT USAGE ON SCHEMA public TO api_user;

-- migrate:down
DROP TABLE IF EXISTS user_identities CASCADE;
DROP TABLE IF EXISTS sso_providers CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TYPE IF EXISTS sso_protocol CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;