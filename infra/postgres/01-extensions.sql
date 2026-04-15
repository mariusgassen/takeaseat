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
