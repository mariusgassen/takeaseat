#!/usr/bin/env bash
# Verifies the postgres schema and RLS tenant isolation.
# Run after `docker compose up -d postgres` and postgres is healthy.
# Usage: ./scripts/verify-schema.sh
# Requires env vars: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD,
#                    POSTGRES_DB, API_DB_USER, API_DB_PASSWORD

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

# As api_user with tenant set to t1
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

# As api_user with tenant set to t2
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
