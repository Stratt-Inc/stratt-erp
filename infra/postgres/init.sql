-- Axiora PostgreSQL initialization
-- This file runs automatically when the postgres container starts for the first time.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create axiora user (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'axiora') THEN
    CREATE ROLE axiora WITH LOGIN PASSWORD 'axiora_dev_password';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE axiora_dev TO axiora;
GRANT ALL ON SCHEMA public TO axiora;
