-- Migration: 003_arabic_fts
-- SanadFlow Study Hub - Arabic Full-Text Search
-- TDD v3.0 Section 3.1 (Hadiths table)
-- Author: Backend Engineer Agent
-- Date: 2026-01-12

-- ============================================================================
-- ARABIC DIACRITICS REMOVAL FUNCTION
-- ============================================================================

-- Remove Arabic diacritics (harakat) for normalized search
-- This improves fuzzy matching by ignoring vowel marks
CREATE OR REPLACE FUNCTION remove_arabic_diacritics(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove Arabic diacritical marks (Unicode range U+064B to U+065F, U+0670)
  -- Fatha, Kasra, Damma, Sukun, Shadda, etc.
  RETURN regexp_replace(
    input_text,
    '[\u064B-\u065F\u0670]',
    '',
    'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- ============================================================================
-- GIN INDEXES FOR HADITH SEARCH
-- ============================================================================

-- Trigram index for Arabic fuzzy search (70% accuracy expected)
DROP INDEX IF EXISTS idx_hadiths_arabic_trgm;
CREATE INDEX idx_hadiths_arabic_trgm 
  ON hadiths 
  USING gin(remove_arabic_diacritics(arabic_text) gin_trgm_ops);

-- Full-text search index for English translations
DROP INDEX IF EXISTS idx_hadiths_english_fts;
CREATE INDEX idx_hadiths_english_fts 
  ON hadiths 
  USING gin(to_tsvector('english', COALESCE(english_translation, '')));

-- Trigram index for narrator names (Arabic)
DROP INDEX IF EXISTS idx_narrators_name_trgm;
CREATE INDEX idx_narrators_name_trgm 
  ON narrators 
  USING gin(remove_arabic_diacritics(name_arabic) gin_trgm_ops);

-- Full-text search for document titles
DROP INDEX IF EXISTS idx_documents_title_fts;
CREATE INDEX idx_documents_title_fts
  ON documents
  USING gin(to_tsvector('simple', title));

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- Search hadiths by Arabic text with similarity scoring
CREATE OR REPLACE FUNCTION search_hadith_arabic(
  query_text TEXT,
  workspace_uuid UUID,
  min_similarity FLOAT DEFAULT 0.2,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  arabic_text TEXT,
  english_translation TEXT,
  grading VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  -- Set similarity threshold for pg_trgm
  PERFORM set_limit(min_similarity);
  
  RETURN QUERY
  SELECT 
    h.id,
    h.arabic_text,
    h.english_translation,
    h.grading,
    similarity(
      remove_arabic_diacritics(h.arabic_text), 
      remove_arabic_diacritics(query_text)
    ) AS sim
  FROM hadiths h
  WHERE h.workspace_id = workspace_uuid
    AND remove_arabic_diacritics(h.arabic_text) % remove_arabic_diacritics(query_text)
  ORDER BY sim DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search hadiths by English translation
CREATE OR REPLACE FUNCTION search_hadith_english(
  query_text TEXT,
  workspace_uuid UUID,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  arabic_text TEXT,
  english_translation TEXT,
  grading VARCHAR,
  rank FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.arabic_text,
    h.english_translation,
    h.grading,
    ts_rank(
      to_tsvector('english', COALESCE(h.english_translation, '')),
      plainto_tsquery('english', query_text)
    ) AS rnk
  FROM hadiths h
  WHERE h.workspace_id = workspace_uuid
    AND to_tsvector('english', COALESCE(h.english_translation, '')) 
        @@ plainto_tsquery('english', query_text)
  ORDER BY rnk DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Combined search (Arabic OR English)
CREATE OR REPLACE FUNCTION search_hadith_combined(
  query_text TEXT,
  workspace_uuid UUID,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  arabic_text TEXT,
  english_translation TEXT,
  grading VARCHAR,
  score FLOAT,
  match_type TEXT
) AS $$
BEGIN
  -- Try Arabic first, then English
  RETURN QUERY
  (
    SELECT 
      h.id,
      h.arabic_text,
      h.english_translation,
      h.grading,
      similarity(remove_arabic_diacritics(h.arabic_text), remove_arabic_diacritics(query_text)) AS scr,
      'arabic'::TEXT AS mtype
    FROM hadiths h
    WHERE h.workspace_id = workspace_uuid
      AND remove_arabic_diacritics(h.arabic_text) % remove_arabic_diacritics(query_text)
  )
  UNION ALL
  (
    SELECT 
      h.id,
      h.arabic_text,
      h.english_translation,
      h.grading,
      ts_rank(
        to_tsvector('english', COALESCE(h.english_translation, '')),
        plainto_tsquery('english', query_text)
      ) AS scr,
      'english'::TEXT AS mtype
    FROM hadiths h
    WHERE h.workspace_id = workspace_uuid
      AND to_tsvector('english', COALESCE(h.english_translation, '')) 
          @@ plainto_tsquery('english', query_text)
  )
  ORDER BY score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search narrators by name
CREATE OR REPLACE FUNCTION search_narrator(
  query_text TEXT,
  workspace_uuid UUID,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name_arabic VARCHAR,
  name_english VARCHAR,
  reliability_grade VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  PERFORM set_limit(0.2);
  
  RETURN QUERY
  SELECT 
    n.id,
    n.name_arabic,
    n.name_english,
    n.reliability_grade,
    similarity(remove_arabic_diacritics(n.name_arabic), remove_arabic_diacritics(query_text)) AS sim
  FROM narrators n
  WHERE n.workspace_id = workspace_uuid
    AND (
      remove_arabic_diacritics(n.name_arabic) % remove_arabic_diacritics(query_text)
      OR n.name_english ILIKE '%' || query_text || '%'
    )
  ORDER BY sim DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT EXECUTE TO AUTHENTICATED USERS
-- ============================================================================

GRANT EXECUTE ON FUNCTION search_hadith_arabic TO authenticated;
GRANT EXECUTE ON FUNCTION search_hadith_english TO authenticated;
GRANT EXECUTE ON FUNCTION search_hadith_combined TO authenticated;
GRANT EXECUTE ON FUNCTION search_narrator TO authenticated;
