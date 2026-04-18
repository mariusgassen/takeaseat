-- migrate:up
-- Favorites: frequently used resources per user
CREATE TABLE favorites (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID    NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, resource_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Waitlist: when a slot is taken, users can join waitlist
CREATE TABLE waitlist (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID       NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    notified   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_resource ON waitlist(resource_id, start_time, end_time);
CREATE INDEX idx_waitlist_user ON waitlist(user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON favorites TO api_user;
GRANT SELECT, INSERT, DELETE ON waitlist TO api_user;

-- migrate:down
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;