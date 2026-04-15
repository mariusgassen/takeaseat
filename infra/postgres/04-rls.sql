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
