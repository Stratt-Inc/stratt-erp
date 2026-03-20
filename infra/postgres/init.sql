-- STRATT PostgreSQL initialization
-- This file runs automatically when the postgres container starts for the first time.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create stratt user (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'stratt') THEN
    CREATE ROLE stratt WITH LOGIN PASSWORD 'stratt_dev_password';
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO stratt', current_database());
END
$$;
GRANT ALL ON SCHEMA public TO stratt;
