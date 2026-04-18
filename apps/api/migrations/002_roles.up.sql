-- migrate:up
CREATE ROLE api_user WITH LOGIN PASSWORD 'api_user';
CREATE ROLE admin_user WITH LOGIN PASSWORD 'admin_user';

-- migrate:down
DROP ROLE IF EXISTS admin_user;
DROP ROLE IF EXISTS api_user;