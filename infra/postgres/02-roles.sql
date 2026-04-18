-- api_user: the role used by the Go API.
-- RLS policies are scoped to this role — superuser bypasses RLS by default.
-- The Go API connects as api_user; migrations run as superuser via a separate connection.

\connect takeaseat
CREATE ROLE api_user WITH LOGIN PASSWORD 'changeme_api';

-- Grant connect to the app database
GRANT CONNECT ON DATABASE takeaseat TO api_user;

-- Schema usage
GRANT USAGE ON SCHEMA public TO api_user;

-- Table permissions granted after schema creation (see 03-schema.sql footer)
-- SELECT, INSERT, UPDATE, DELETE on all app tables — NOT schema-altering DDL
