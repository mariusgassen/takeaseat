-- migrate:up
-- Row-Level Security — Tenant Isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

-- Tenants: api_user sees only the current tenant's own row
CREATE POLICY tenant_isolation ON tenants
    TO api_user
    USING (id::text = current_setting('app.tenant_id', true))
    WITH CHECK (id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON users
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON resources
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON reservations
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON sso_providers
    TO api_user
    USING (tenant_id::text = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON user_identities
    TO api_user
    USING (user_id IN (
        SELECT id FROM users
        WHERE tenant_id::text = current_setting('app.tenant_id', true)
    ))
    WITH CHECK (user_id IN (
        SELECT id FROM users
        WHERE tenant_id::text = current_setting('app.tenant_id', true)
    ));

-- migrate:down
DROP POLICY IF EXISTS tenant_isolation ON user_identities;
DROP POLICY IF EXISTS tenant_isolation ON sso_providers;
DROP POLICY IF EXISTS tenant_isolation ON reservations;
DROP POLICY IF EXISTS tenant_isolation ON resources;
DROP POLICY IF EXISTS tenant_isolation ON users;
DROP POLICY IF EXISTS tenant_isolation ON tenants;
ALTER TABLE user_identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;