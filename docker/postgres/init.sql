DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'hvac_user'
    ) THEN
        CREATE ROLE hvac_user LOGIN PASSWORD 'hvac_password';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = 'hvac_vector_db'
    ) THEN
        CREATE DATABASE hvac_vector_db OWNER hvac_user;
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE hvac_vector_db TO hvac_user;
