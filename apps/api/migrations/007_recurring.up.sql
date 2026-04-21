-- migrate:up
SET client_min_messages = WARNING;

CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly');

CREATE TABLE recurring_series (
    id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID                 NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id      UUID                 NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    resource_id  UUID                 NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    frequency    recurrence_frequency NOT NULL,
    days_of_week INT[]                NOT NULL DEFAULT '{}',
    time_start   TEXT                 NOT NULL,
    time_end     TEXT                 NOT NULL,
    date_start   DATE                 NOT NULL,
    date_end     DATE                 NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_series_tenant_id   ON recurring_series(tenant_id);
CREATE INDEX idx_recurring_series_user_id     ON recurring_series(user_id);
CREATE INDEX idx_recurring_series_resource_id ON recurring_series(resource_id);

ALTER TABLE reservations
    ADD COLUMN recurring_series_id UUID REFERENCES recurring_series(id) ON DELETE SET NULL;

CREATE INDEX idx_reservations_recurring_series_id ON reservations(recurring_series_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_series TO api_user;

-- migrate:down
ALTER TABLE reservations DROP COLUMN IF EXISTS recurring_series_id;
DROP TABLE IF EXISTS recurring_series CASCADE;
DROP TYPE IF EXISTS recurrence_frequency CASCADE;
