-- Drop all existing tables (safe - will cascade delete all data)
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
