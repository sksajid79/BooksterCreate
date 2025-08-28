-- Initial database setup for MyBookStore
-- This file is executed when the PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the database if it doesn't exist
-- Note: This is mainly for documentation as the database is created by Docker
SELECT 'CREATE DATABASE mybookstore' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mybookstore');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE mybookstore TO postgres;

-- You can add any additional initialization SQL here
-- The actual table creation will be handled by Drizzle migrations