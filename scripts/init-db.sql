-- Database initialization script
-- TDD v2.0 Section 3.1

-- Enable necessary extensions for Arabic full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create Arabic text search configuration
-- Note: PostgreSQL's built-in 'simple' config works for Arabic as it doesn't use stemming
-- which is more reliable for Arabic text (70% accuracy acceptable per TDD)

-- Add GIN indexes for Arabic full-text search after tables are created
-- These are created by Prisma migrations, but we add explicit FTS indexes

-- Function to normalize Arabic text (remove diacritics for search)
CREATE OR REPLACE FUNCTION normalize_arabic(text) 
RETURNS text AS $$
  SELECT regexp_replace(
    $1,
    '[\u064B-\u065F\u0670]',  -- Arabic diacritics range
    '',
    'g'
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Create index on normalized Arabic text for better search
-- This will be added after hadiths table is created by Prisma

COMMENT ON DATABASE affine_development IS 'SanadFlow Study Hub - Islamic Sciences Collaborative Platform';
