-- Migration: 001_init_schema
-- SanadFlow Study Hub - TDD v3.0 Section 3
-- Author: Backend Engineer Agent
-- Date: 2026-01-12

-- ============================================================================
-- EXTENSIONS (already enabled via Supabase Dashboard)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT role_check CHECK (role IN ('admin', 'member', 'reader'))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role) WHERE is_active = TRUE;

-- ============================================================================
-- WORKSPACES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  icon_emoji VARCHAR(10),
  settings JSONB NOT NULL DEFAULT '{"rtl_default": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- ============================================================================
-- WORKSPACE MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'edit',
  invited_by UUID REFERENCES public.user_profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT permission_check CHECK (permission IN ('view', 'edit', 'admin')),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content_yjs BYTEA,
  content_json JSONB,
  parent_id UUID REFERENCES documents(id),
  icon_emoji VARCHAR(10),
  cover_image_url TEXT,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  updated_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- HADITHS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  arabic_text TEXT NOT NULL,
  english_translation TEXT,
  transliteration TEXT,
  collection VARCHAR(100),
  book_number VARCHAR(50),
  hadith_number VARCHAR(50),
  grading VARCHAR(50),
  narrator_ids UUID[],
  narration_chain TEXT,
  topic_tags TEXT[],
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT arabic_text_not_empty CHECK (LENGTH(TRIM(arabic_text)) > 0),
  CONSTRAINT grading_check CHECK (grading IS NULL OR grading IN ('Sahih', 'Hasan', 'Daif', 'Mawdu'))
);

CREATE INDEX IF NOT EXISTS idx_hadiths_workspace ON hadiths(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hadiths_grading ON hadiths(grading);
CREATE INDEX IF NOT EXISTS idx_hadiths_narrator ON hadiths USING gin(narrator_ids);

-- ============================================================================
-- NARRATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.narrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name_arabic VARCHAR(255) NOT NULL,
  name_english VARCHAR(255),
  kunyah VARCHAR(100),
  laqab VARCHAR(100),
  birth_year INT,
  death_year INT,
  biography_ar TEXT,
  biography_en TEXT,
  reliability_grade VARCHAR(50),
  teachers UUID[],
  students UUID[],
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name_arabic)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_narrators_workspace ON narrators(workspace_id);

-- ============================================================================
-- DIAGRAMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/png',
  canvas_state JSONB,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagrams_workspace ON diagrams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_document ON diagrams(document_id);

-- ============================================================================
-- YJS DOCUMENTS (Real-time Collaboration State)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yjs_documents (
  room_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  state BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yjs_documents_workspace ON yjs_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_yjs_documents_document ON yjs_documents(document_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  content_json JSONB,
  selection_start INT,
  selection_end INT,
  selection_text TEXT,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES public.user_profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_document ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- ============================================================================
-- DOCUMENT VERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_yjs BYTEA,
  content_json JSONB,
  changed_by UUID NOT NULL REFERENCES public.user_profiles(id),
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['user_profiles', 'workspaces', 'workspace_members', 'documents', 'hadiths', 'narrators', 'diagrams', 'yjs_documents', 'comments'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at 
        BEFORE UPDATE ON %s 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
