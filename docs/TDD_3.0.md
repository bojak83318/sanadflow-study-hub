# **TECHNICAL DESIGN DOCUMENT (TDD) v3.0**
## **SanadFlow Study Hub - Implementation Specification (Supabase + Vercel)**

**Document Type**: Technical Design Document v3.0  
**Tech Lead**: Priya Patel  
**System Architect**: Dr. Sarah Chen  
**Engineering Director**: Marcus Rodriguez  
**Date**: January 11, 2026, 8:00 PM SGT  
**Status**: ✅ **APPROVED** - Ready for Week 1 Implementation  
**Related Documents**: PRD v3.1, ADD v3.0

***

## **REVISION HISTORY**

| Version | Date | Author | Status | Changes |
|---------|------|--------|--------|---------|
| v1.0 | Jan 11, 8:00 PM | Priya Patel | DEPRECATED | Fly.io + self-hosted PostgreSQL |
| v2.0 | Jan 12, 12:00 PM | Priya Patel | DEPRECATED | Fly.io 3-VM architecture (free tier eliminated) |
| **v3.0** | Jan 11, 8:00 PM | Priya Patel | **APPROVED** | **Supabase + Vercel serverless architecture** |

**Critical Changes in v3.0:**
- 🔄 **Hosting Platform**: Fly.io → Vercel Edge (serverless)
- 🔄 **Database**: Self-hosted PostgreSQL (256MB) → Supabase PostgreSQL (500MB managed)
- 🔄 **Connection Pooling**: Manual PgBouncer → Supabase Pooler (port 6543, built-in)
- 🔄 **Authentication**: Custom JWT → Supabase Auth (magic links, RLS policies)
- 🔄 **Real-time Sync**: y-websocket server → Supabase Realtime Broadcast API
- 🔄 **Redis**: Embedded Redis (AOF) → Not needed (Supabase handles sessions)
- 🔄 **Memory Constraints**: 256MB VM limits → No limits (serverless auto-scales)
- ✅ **Arabic RTL**: Same testing requirements (50 tests, 90% pass rate)
- ✅ **Backup Strategy**: Same (GitHub Actions + R2 hybrid)

***

## **CRITICAL NOTICE: ARCHITECTURE MIGRATION**

> [!CAUTION]
> **Fly.io Free Tier Eliminated (April 2024)**  
> TDD v2.0's Fly.io 3-VM architecture is **no longer viable**. Free tier replaced with 2-hour trial.
> 
> **Migration Impact**: All deployment procedures, database configurations, and infrastructure code **completely rewritten** for Supabase + Vercel.

***

## **1. DOCUMENT PURPOSE**

This Technical Design Document (TDD) translates the approved **Architecture Decision Document (ADD v3.0)** into concrete implementation specifications for engineering. It defines:

1. **Database schemas** with Supabase-specific features (Row-Level Security policies)
2. **API contracts** (GraphQL schema, Supabase REST endpoints)
3. **Component architecture** (Next.js App Router, Supabase client/server patterns)
4. **Deployment procedures** (Vercel configuration, Supabase project setup)
5. **Testing strategy** (unit, integration, E2E, RTL test plans - **unchanged from v2.0**)
6. **Go-live gates** with clear pass/fail criteria and escalation paths

**Target Audience**: Backend engineers, frontend developers, DevOps admins (Ahmed, Admin 1)

**New Dependencies**:
- Supabase CLI (`supabase`)
- Vercel CLI (`vercel`)
- Supabase JavaScript Client (`@supabase/supabase-js`)
- Supabase SSR (`@supabase/ssr`)

***

## **2. SYSTEM ARCHITECTURE OVERVIEW**

### **2.1 Technology Stack**

| Layer | Technology | Version | Rationale | Change from v2.0 |
|-------|-----------|---------|-----------|------------------|
| **Frontend** | React | 18.2.0 | Industry standard | Same |
| **Frontend Framework** | Next.js | 14.0.4 | App Router, SSR | Same |
| **Hosting** | **Vercel Edge** | N/A | **Serverless, auto-scales** | **CHANGED (was Fly.io)** |
| **Backend Runtime** | **Vercel Serverless** | Node 20 | **Edge runtime for API routes** | **CHANGED (was Node 18)** |
| **API Layer** | Apollo GraphQL Server | 4.9.5 | Type safety, subscriptions | Same |
| **Database** | **Supabase PostgreSQL** | **16.1** | **Managed, 500MB free** | **CHANGED (was self-hosted)** |
| **Connection Pooling** | **Supabase Pooler** | Built-in | **Port 6543 transaction mode** | **CHANGED (was PgBouncer)** |
| **ORM** | Prisma | 5.7.1 | Type-safe queries | Same |
| **Authentication** | **Supabase Auth** | **2.x** | **Magic links, RLS** | **CHANGED (was custom JWT)** |
| **Real-time Sync** | **Supabase Realtime** | **2.x** | **Broadcast API, Yjs provider** | **CHANGED (was y-websocket)** |
| **Storage** | **Supabase Storage** | **Built-in** | **1GB free, RLS policies** | **NEW** |
| **Whiteboard** | TLDraw | 1.29.2 | Arabic RTL support | Same |

**Key Removals from v2.0**:
- ❌ Redis (no longer needed - Supabase manages sessions)
- ❌ PgBouncer (Supabase Pooler built-in)
- ❌ Docker/Dockerfile (Vercel handles deployment)
- ❌ fly.toml (replaced with vercel.json)
- ❌ VM memory management (serverless abstracts this)

***

### **2.2 Deployment Architecture (Supabase + Vercel)**

```
┌─────────────────────────────────────────────────────────┐
│  Vercel Edge Network (Singapore Region: sin1)           │
│  - Serverless Functions (Node 20 runtime)               │
│  - Edge Runtime (optional for ultra-low latency)        │
│  - 1M function invocations/month (free tier)            │
│  - 100GB bandwidth/month                                │
└─────────────────────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│  Next.js 14 App (App Router)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Server Components (SSR)                          │  │
│  │  - Fetch from Supabase server-side               │  │
│  │  - Use createServerClient (cookies)              │  │
│  │                                                   │  │
│  │  API Routes (/app/api/*)                         │  │
│  │  - /api/graphql → Apollo Server                  │  │
│  │  - /api/health → Health checks                   │  │
│  │  - /api/export/pdf → Document export             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Client Components                                │  │
│  │  - Supabase client (anon key)                    │  │
│  │  - Real-time subscriptions                       │  │
│  │  - TLDraw canvas                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                    ↓ PostgreSQL Wire Protocol (Port 6543)
┌─────────────────────────────────────────────────────────┐
│  Supabase Platform (Singapore Region)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL 16 (Free Tier)                        │  │
│  │  - Database: 500MB storage                       │  │
│  │  - Direct connections: 15 (port 5432)            │  │
│  │  - Pooled connections: Unlimited via port 6543   │  │
│  │  - Extensions: pg_trgm, unaccent enabled         │  │
│  │  - Row-Level Security (RLS): Enforced            │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Realtime                                │  │
│  │  - Broadcast API: 2M messages/month              │  │
│  │  - Custom Yjs provider (100ms batching)          │  │
│  │  - Presence tracking (online users)              │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                    │  │
│  │  - 50K monthly active users (MAU)                │  │
│  │  - Magic links + email/password                  │  │
│  │  - JWT tokens (httpOnly cookies)                 │  │
│  │  - Auto-refreshes every 3600s                    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                 │  │
│  │  - 1GB free storage                              │  │
│  │  - 50MB file size limit                          │  │
│  │  - RLS policies per bucket                       │  │
│  │  - CDN-backed (fast global access)               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                    ↓ Backups
┌─────────────────────────────────────────────────────────┐
│  Backup Destinations                                     │
│  - GitHub Actions → GitHub repo (30-day retention)      │
│  - GitHub Actions → Cloudflare R2 (30-day retention)   │
│  - ⚠️ No auto-backup (Supabase free tier limitation)   │
└─────────────────────────────────────────────────────────┘
```

**Key Differences from v2.0**:
- ✅ **No VM memory budgets** (serverless scales automatically)
- ✅ **No Redis process** (Supabase Auth handles sessions)
- ✅ **No PgBouncer config** (Supabase Pooler automatic)
- ✅ **No Docker builds** (Vercel builds from Git)
- ⚠️ **7-day inactivity pause** (Supabase free tier - mitigated by keep-alive)

***

## **3. DATABASE DESIGN**

### **3.1 Schema: Core Tables with Row-Level Security**

#### **Table: `users` (Managed by Supabase Auth)**

```sql
-- ⚠️ NOTE: Supabase Auth automatically creates auth.users table
-- We create a public.user_profiles table to extend it

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'member', 'reader'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT role_check CHECK (role IN ('admin', 'member', 'reader'))
);

-- ✅ NEW: Row-Level Security (RLS) Policy
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE INDEX idx_user_profiles_role ON user_profiles(role) WHERE is_active = TRUE;
```

**Capacity Planning** (same as v2.0):
- 10 users × ~300 bytes/user = **3KB**
- Growth: 50 users over 2 years = 15KB

**Supabase Auth Features** (vs. v2.0 custom JWT):
| Feature | v2.0 (Custom) | v3.0 (Supabase Auth) |
|---------|---------------|----------------------|
| Email/Password | ✅ bcrypt (manual) | ✅ Built-in |
| Magic Links | ❌ Not implemented | ✅ Built-in |
| OAuth (Google, GitHub) | ❌ Not supported | ✅ Built-in |
| Session Management | ❌ Manual Redis | ✅ Automatic |
| JWT Refresh | ❌ Manual cron | ✅ Auto-refresh |
| Password Reset | ❌ Manual email | ✅ Built-in flow |

***

#### **Table: `workspaces`**

```sql
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icon_emoji VARCHAR(10),
  settings JSONB NOT NULL DEFAULT '{"rtl_default": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- ✅ NEW: Row-Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
```

**Storage Estimate**: 3 workspaces × 1KB = **3KB**

***

#### **Table: `workspace_members`**

```sql
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'edit',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT permission_check CHECK (permission IN ('view', 'edit', 'admin')),
  UNIQUE(workspace_id, user_id)
);

-- ✅ NEW: Row-Level Security
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage members"
  ON public.workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.permission = 'admin'
    )
  );

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
```

**Storage Estimate**: 10 users × 3 workspaces = 30 memberships × 200 bytes = **6KB**

***

#### **Table: `documents`**

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content_yjs BYTEA, -- Yjs CRDT binary format
  content_json JSONB, -- Fallback plaintext for search
  parent_id UUID REFERENCES documents(id),
  icon_emoji VARCHAR(10),
  cover_image_url TEXT,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete (30-day trash)
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- ✅ NEW: Row-Level Security (users can only access documents in their workspaces)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their workspaces"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users with edit permission can modify documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

CREATE INDEX idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_title ON documents USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;
```

**Storage Estimate**:
- 500 hadiths × avg 2KB = **1MB**
- 50 documents × 5KB = **250KB**
- **Total: ~1.3MB** (well under 500MB Supabase limit)

***

#### **Table: `hadiths`** (Custom Structured Data)

```sql
CREATE TABLE public.hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  
  -- Hadith content
  arabic_text TEXT NOT NULL,
  english_translation TEXT,
  transliteration TEXT,
  
  -- Classification
  collection VARCHAR(100),
  book_number VARCHAR(50),
  hadith_number VARCHAR(50),
  grading VARCHAR(50),
  
  -- Narration chain (Sanad)
  narrator_ids UUID[],
  narration_chain TEXT,
  
  -- Metadata
  topic_tags TEXT[],
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT arabic_text_not_empty CHECK (LENGTH(TRIM(arabic_text)) > 0),
  CONSTRAINT grading_check CHECK (grading IN ('Sahih', 'Hasan', 'Daif', 'Mawdu'))
);

-- ✅ CRITICAL: Enable pg_trgm extension for Arabic full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Arabic normalization function (removes diacritics)
CREATE OR REPLACE FUNCTION remove_arabic_diacritics(text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    text,
    '[\u064B-\u065F\u0670]', -- Arabic diacritics Unicode range
    '',
    'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ✅ NEW: GIN index for fuzzy Arabic FTS (70% accuracy expected)
CREATE INDEX idx_hadiths_arabic_trgm 
  ON hadiths 
  USING gin(remove_arabic_diacritics(arabic_text) gin_trgm_ops);

CREATE INDEX idx_hadiths_english_fts 
  ON hadiths 
  USING gin(to_tsvector('english', english_translation));

-- ✅ NEW: Row-Level Security
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hadiths in their workspaces"
  ON public.hadiths FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users with edit permission can modify hadiths"
  ON public.hadiths FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

CREATE INDEX idx_hadiths_workspace ON hadiths(workspace_id);
CREATE INDEX idx_hadiths_grading ON hadiths(grading);
CREATE INDEX idx_hadiths_narrator ON hadiths USING gin(narrator_ids);
```

**Storage Estimate**:
- 500 hadiths × 2KB avg = **1MB**
- Growth to 2,000 hadiths = **4MB**

**Arabic FTS Function** (custom search with similarity):

```sql
CREATE OR REPLACE FUNCTION search_hadith_arabic(
  query_text TEXT,
  min_similarity FLOAT DEFAULT 0.2
)
RETURNS TABLE (
  id UUID,
  arabic_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  -- Set similarity threshold
  PERFORM set_limit(min_similarity);
  
  RETURN QUERY
  SELECT 
    h.id,
    h.arabic_text,
    similarity(remove_arabic_diacritics(h.arabic_text), remove_arabic_diacritics(query_text)) AS sim
  FROM hadiths h
  WHERE remove_arabic_diacritics(h.arabic_text) % remove_arabic_diacritics(query_text)
  ORDER BY sim DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
```

***

#### **Table: `narrators`**

```sql
CREATE TABLE public.narrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Names
  name_arabic VARCHAR(255) NOT NULL,
  name_english VARCHAR(255),
  kunyah VARCHAR(100),
  laqab VARCHAR(100),
  
  -- Biographical data
  birth_year INT,
  death_year INT,
  biography_ar TEXT,
  biography_en TEXT,
  reliability_grade VARCHAR(50),
  
  -- Relations
  teachers UUID[],
  students UUID[],
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name_arabic)) > 0)
);

-- ✅ NEW: Row-Level Security
ALTER TABLE public.narrators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view narrators in their workspaces"
  ON public.narrators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = narrators.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users with edit permission can modify narrators"
  ON public.narrators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = narrators.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

CREATE INDEX idx_narrators_workspace ON narrators(workspace_id);
CREATE INDEX idx_narrators_name_ar ON narrators USING gin(to_tsvector('arabic', name_arabic));
```

**Storage Estimate**: 200 narrators × 1.5KB = **300KB**

***

#### **Table: `diagrams`** (Whiteboard Snapshots)

```sql
-- ⚠️ IMPORTANT: In v3.0, diagrams are stored in Supabase Storage, not PostgreSQL BLOBs
-- This table only stores metadata and references

CREATE TABLE public.diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- ✅ NEW: Always stored in Supabase Storage (no PostgreSQL BLOBs)
  storage_path TEXT NOT NULL, -- Path in Supabase Storage: "workspace_id/user_id/timestamp-filename.png"
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/png',
  
  -- Canvas state (TLDraw v1.29.2)
  canvas_state JSONB,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ NEW: Row-Level Security
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view diagrams in their workspaces"
  ON public.diagrams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = diagrams.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload diagrams to their workspaces"
  ON public.diagrams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = diagrams.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

CREATE INDEX idx_diagrams_workspace ON diagrams(workspace_id);
CREATE INDEX idx_diagrams_document ON diagrams(document_id);
```

**Storage Strategy (v3.0 vs. v2.0)**:

| Aspect | v2.0 (Fly.io) | v3.0 (Supabase) |
|--------|---------------|-----------------|
| **Primary Storage** | PostgreSQL BLOBs | Supabase Storage bucket |
| **Overflow Storage** | Cloudflare R2 (at 2.5GB) | Not needed (1GB bucket limit) |
| **Access Control** | SQL queries | RLS policies on storage bucket |
| **CDN** | None | Supabase CDN (global) |
| **File Size Limit** | 3GB total | 50MB per file, 1GB total |

**Supabase Storage Bucket Configuration**:

```sql
-- Storage bucket policies (applied via Supabase Dashboard)

-- Bucket: diagrams
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagrams', 'diagrams', false); -- Private bucket

-- RLS Policy: Users can upload to their workspace folder
CREATE POLICY "Users can upload diagrams to their workspaces"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'diagrams' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members
      WHERE user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- RLS Policy: Users can view diagrams in their workspaces
CREATE POLICY "Users can view diagrams in their workspaces"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'diagrams' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete their own diagrams
CREATE POLICY "Users can delete their own diagrams"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'diagrams' AND
    owner = auth.uid()
  );
```

**Storage Estimate**:
- 50 diagrams × 1.5MB (PNG) = **75MB** (in Supabase Storage)
- Limit: 1GB free tier = ~666 diagrams

***

#### **Table: `yjs_documents`** (Real-time Collaboration State)

```sql
-- ✅ NEW TABLE: Stores Yjs CRDT state for collaborative editing
-- Replaces y-websocket's in-memory storage from v2.0

CREATE TABLE public.yjs_documents (
  room_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  state BYTEA NOT NULL, -- Yjs Y.encodeStateAsUpdate() binary
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id)
);

-- ✅ NEW: Row-Level Security
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view Yjs state for their workspace documents"
  ON public.yjs_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = yjs_documents.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users with edit permission can update Yjs state"
  ON public.yjs_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = yjs_documents.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

CREATE INDEX idx_yjs_documents_workspace ON yjs_documents(workspace_id);
CREATE INDEX idx_yjs_documents_document ON yjs_documents(document_id);
```

**Storage Estimate**:
- 50 documents × 10KB (Yjs state) = **500KB**

***

### **3.2 Supabase Project Configuration**

**Project Settings** (via Supabase Dashboard):

```yaml
# supabase/config.toml (generated by Supabase CLI)

project_id = "sanadflow-prod"
region = "ap-southeast-1" # Singapore

[api]
enabled = true
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public"]
max_rows = 1000

[db]
port = 54322
major_version = 16

[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction" # ✅ Transaction mode for Prisma compatibility
default_pool_size = 20
max_client_conn = 100

[realtime]
enabled = true
ip_version = "ipv4"

[storage]
enabled = true
file_size_limit = "50MB"

[auth]
enabled = true
site_url = "https://sanadflow.vercel.app"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600 # 1 hour
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false # ✅ Disable for pilot (auto-confirm)

[auth.external.google]
enabled = false # ✅ Not needed for pilot

[auth.external.github]
enabled = false # ✅ Not needed for pilot
```

**Environment Variables** (Vercel):

```bash
# .env.production (Vercel Environment Variables)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # ⚠️ NEVER expose to frontend
SUPABASE_JWT_SECRET=your-jwt-secret

# Database (for Prisma migrations)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Cloudflare R2 (for backups)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key

# Next.js
NEXT_PUBLIC_APP_URL=https://sanadflow.vercel.app
NODE_ENV=production
```

***

### **3.3 Database Migrations (Prisma with Supabase)**

#### **Prisma Schema** (Updated for Supabase)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Port 6543 pooler (for queries)
  directUrl = env("DIRECT_URL")       // Port 5432 direct (for migrations only)
}

model UserProfile {
  id           String    @id @db.Uuid // References auth.users(id)
  fullName     String    @map("full_name") @db.VarChar(255)
  role         String    @default("member") @db.VarChar(50)
  avatarUrl    String?   @map("avatar_url")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  lastLoginAt  DateTime? @map("last_login_at") @db.Timestamptz(6)
  isActive     Boolean   @default(true) @map("is_active")

  ownedWorkspaces      Workspace[]        @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
  createdDocuments     Document[]         @relation("DocumentCreator")
  createdHadiths       Hadith[]
  createdNarrators     Narrator[]

  @@index([role])
  @@map("user_profiles")
}

model Workspace {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  description String?
  ownerId     String   @map("owner_id") @db.Uuid
  iconEmoji   String?  @map("icon_emoji") @db.VarChar(10)
  settings    Json     @default("{\"rtl_default\":true}")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  owner     UserProfile       @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members   WorkspaceMember[]
  documents Document[]
  hadiths   Hadith[]
  narrators Narrator[]
  diagrams  Diagram[]

  @@index([ownerId])
  @@index([slug])
  @@map("workspaces")
}

model WorkspaceMember {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  permission  String   @default("edit") @db.VarChar(20)
  invitedBy   String?  @map("invited_by") @db.Uuid
  joinedAt    DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  workspace Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([userId])
  @@index([workspaceId])
  @@map("workspace_members")
}

model Document {
  id            String    @id @default(uuid()) @db.Uuid
  workspaceId   String    @map("workspace_id") @db.Uuid
  title         String    @db.VarChar(500)
  contentYjs    Bytes?    @map("content_yjs")
  contentJson   Json?     @map("content_json")
  parentId      String?   @map("parent_id") @db.Uuid
  iconEmoji     String?   @map("icon_emoji") @db.VarChar(10)
  coverImageUrl String?   @map("cover_image_url")
  isTemplate    Boolean   @default(false) @map("is_template")
  createdBy     String    @map("created_by") @db.Uuid
  updatedBy     String?   @map("updated_by") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz(6)

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator   UserProfile  @relation("DocumentCreator", fields: [createdBy], references: [id])
  parent    Document?    @relation("DocumentChildren", fields: [parentId], references: [id])
  children  Document[]   @relation("DocumentChildren")
  hadiths   Hadith[]
  diagrams  Diagram[]

  @@index([workspaceId])
  @@index([parentId])
  @@map("documents")
}

model Hadith {
  id                  String   @id @default(uuid()) @db.Uuid
  workspaceId         String   @map("workspace_id") @db.Uuid
  documentId          String?  @map("document_id") @db.Uuid
  arabicText          String   @map("arabic_text")
  englishTranslation  String?  @map("english_translation")
  transliteration     String?
  collection          String?  @db.VarChar(100)
  bookNumber          String?  @map("book_number") @db.VarChar(50)
  hadithNumber        String?  @map("hadith_number") @db.VarChar(50)
  grading             String?  @db.VarChar(50)
  narratorIds         String[] @map("narrator_ids") @db.Uuid
  narrationChain      String?  @map("narration_chain")
  topicTags           String[] @map("topic_tags")
  notes               String?
  createdBy           String   @map("created_by") @db.Uuid
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  document  Document?    @relation(fields: [documentId], references: [id])
  creator   UserProfile  @relation(fields: [createdBy], references: [id])

  @@index([workspaceId])
  @@index([grading])
  @@map("hadiths")
}

model Narrator {
  id               String   @id @default(uuid()) @db.Uuid
  workspaceId      String   @map("workspace_id") @db.Uuid
  nameArabic       String   @map("name_arabic") @db.VarChar(255)
  nameEnglish      String?  @map("name_english") @db.VarChar(255)
  kunyah           String?  @db.VarChar(100)
  laqab            String?  @db.VarChar(100)
  birthYear        Int?     @map("birth_year")
  deathYear        Int?     @map("death_year")
  biographyAr      String?  @map("biography_ar")
  biographyEn      String?  @map("biography_en")
  reliabilityGrade String?  @map("reliability_grade") @db.VarChar(50)
  teachers         String[] @db.Uuid
  students         String[] @db.Uuid
  createdBy        String   @map("created_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator   UserProfile  @relation(fields: [createdBy], references: [id])

  @@index([workspaceId])
  @@map("narrators")
}

model Diagram {
  id            String   @id @default(uuid()) @db.Uuid
  workspaceId   String   @map("workspace_id") @db.Uuid
  documentId    String?  @map("document_id") @db.Uuid
  title         String   @db.VarChar(255)
  description   String?
  storagePath   String   @map("storage_path") // Supabase Storage path
  fileSizeBytes BigInt   @map("file_size_bytes")
  mimeType      String   @default("image/png") @map("mime_type") @db.VarChar(50)
  canvasState   Json?    @map("canvas_state") // TLDraw v1.29.2 state
  createdBy     String   @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  document  Document?    @relation(fields: [documentId], references: [id])

  @@index([workspaceId])
  @@index([documentId])
  @@map("diagrams")
}

model YjsDocument {
  roomId      String   @id @map("room_id") @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  documentId  String   @unique @map("document_id") @db.Uuid
  state       Bytes // Yjs binary state
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([workspaceId])
  @@index([documentId])
  @@map("yjs_documents")
}
```

**Migration Execution**:

```bash
# Week 1 Day 1: Initialize Supabase project
supabase init

# Link to remote Supabase project
supabase link --project-ref your-project-ref

# Generate migration from Prisma schema
npx prisma migrate dev --name init

# Deploy migration to Supabase
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed with test data
npx prisma db seed
```

***

## **4. API DESIGN**

### **4.1 Authentication Flow (Supabase Auth)**

**Sign Up** (Email/Password):

```typescript
// app/api/auth/signup/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Server-side only
  )
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for pilot
  })
  
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }
  
  // 2. Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      full_name: fullName,
      role: 'member',
    })
  
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }
  
  return NextResponse.json({ user: authData.user })
}
```

**Sign In** (Email/Password):

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      alert(error.message)
      return
    }
    
    // Session automatically stored in cookies
    router.push('/workspace')
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

**Session Management** (Middleware):

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protect /workspace/* routes
  if (request.nextUrl.pathname.startsWith('/workspace') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect logged-in users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/login') || 
       request.nextUrl.pathname.startsWith('/signup')) && user) {
    return NextResponse.redirect(new URL('/workspace', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/workspace/:path*', '/login', '/signup', '/api/:path*']
}
```

***

### **4.2 GraphQL API (Apollo Server on Vercel)**

```typescript
// app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    fullName: String!
    role: String!
  }
  
  type Hadith {
    id: ID!
    arabicText: String!
    englishTranslation: String
    grading: String
    collection: String
    narrator: [Narrator!]!
    createdAt: String!
  }
  
  type Narrator {
    id: ID!
    nameArabic: String!
    nameEnglish: String
    reliabilityGrade: String
  }
  
  input CreateHadithInput {
    workspaceId: ID!
    arabicText: String!
    englishTranslation: String
    grading: String
    collection: String
    narratorIds: [ID!]
  }
  
  input SearchHadithsInput {
    workspaceId: ID!
    query: String!
    grading: String
    limit: Int = 20
    offset: Int = 0
  }
  
  type Query {
    me: User
    hadith(id: ID!): Hadith
    searchHadiths(input: SearchHadithsInput!): [Hadith!]!
  }
  
  type Mutation {
    createHadith(input: CreateHadithInput!): Hadith!
    updateHadith(id: ID!, input: CreateHadithInput!): Hadith!
    deleteHadith(id: ID!): Boolean!
  }
`

const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized')
      
      const profile = await prisma.userProfile.findUnique({
        where: { id: context.user.id },
      })
      
      return {
        id: profile?.id,
        email: context.user.email,
        fullName: profile?.fullName,
        role: profile?.role,
      }
    },
    
    hadith: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Unauthorized')
      
      // RLS automatically enforces workspace membership
      const hadith = await prisma.hadith.findUnique({
        where: { id },
        include: {
          creator: true,
        },
      })
      
      if (!hadith) throw new Error('Hadith not found')
      
      return hadith
    },
    
    searchHadiths: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized')
      
      // Use custom Arabic FTS function
      const hadiths = await prisma.$queryRaw`
        SELECT * FROM search_hadith_arabic(
          ${input.query},
          0.2  -- 20% similarity threshold
        )
        WHERE workspace_id = ${input.workspaceId}::uuid
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `
      
      return hadiths
    },
  },
  
  Mutation: {
    createHadith: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized')
      
      // RLS automatically checks workspace membership
      const hadith = await prisma.hadith.create({
        data: {
          workspaceId: input.workspaceId,
          arabicText: input.arabicText,
          englishTranslation: input.englishTranslation,
          grading: input.grading,
          collection: input.collection,
          narratorIds: input.narratorIds || [],
          createdBy: context.user.id,
        },
      })
      
      return hadith
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    return { user }
  },
})

export { handler as GET, handler as POST }
```

***

### **4.3 Supabase Realtime Integration (Custom Yjs Provider)**

```typescript
// lib/supabase-yjs-provider.ts
import { createClient } from '@supabase/supabase-js'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export class SupabaseYjsProvider {
  private doc: Y.Doc
  private channel: any
  private awareness: Awareness
  private pendingUpdates: Uint8Array[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  
  constructor(
    doc: Y.Doc,
    supabase: any,
    { roomId, userId, updateDebounceMs = 100 }: {
      roomId: string
      userId: string
      updateDebounceMs?: number
    }
  ) {
    this.doc = doc
    this.awareness = new Awareness(doc)
    
    // Create Supabase Realtime channel
    this.channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true, ack: true },
        presence: { key: userId }
      }
    })
    
    // Listen for Yjs updates from other clients
    this.channel.on('broadcast', { event: 'yjs-update' },
      ({ payload }: any) => {
        if (payload.origin !== userId) {
          Y.applyUpdate(this.doc, new Uint8Array(payload.update))
        }
      }
    )
    
    // Listen for awareness updates (cursors)
    this.channel.on('broadcast', { event: 'awareness' },
      ({ payload }: any) => {
        if (payload.origin !== userId) {
          this.awareness.applyUpdate(
            new Uint8Array(payload.awarenessUpdate),
            payload.origin
          )
        }
      }
    )
    
    // Batch local changes (CRITICAL: reduces 43.2M → 4.3M messages/month)
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== this) {
        this.pendingUpdates.push(update)
        
        if (this.batchTimeout) clearTimeout(this.batchTimeout)
        
        this.batchTimeout = setTimeout(() => {
          if (this.pendingUpdates.length > 0) {
            // Merge all pending updates into one
            const mergedUpdate = Y.mergeUpdates(this.pendingUpdates)
            
            this.channel.send({
              type: 'broadcast',
              event: 'yjs-update',
              payload: {
                update: Array.from(mergedUpdate),
                origin: userId
              }
            })
            
            this.pendingUpdates = []
          }
        }, updateDebounceMs)  // 100ms batching window
      }
    })
    
    // Awareness updates (cursor position)
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      const awarenessUpdate = Awareness.encodeAwarenessUpdate(
        this.awareness,
        [...added, ...updated, ...removed]
      )
      
      this.channel.send({
        type: 'broadcast',
        event: 'awareness',
        payload: {
          awarenessUpdate: Array.from(awarenessUpdate),
          origin: userId
        }
      })
    })
    
    // Subscribe and load persisted state
    this.channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await this.loadPersistedState(roomId, supabase)
      }
    })
  }
  
  // Load from PostgreSQL on connect
  private async loadPersistedState(roomId: string, supabase: any) {
    const { data } = await supabase
      .from('yjs_documents')
      .select('state')
      .eq('room_id', roomId)
      .single()
    
    if (data?.state) {
      Y.applyUpdate(this.doc, new Uint8Array(data.state))
    }
  }
  
  // Auto-save every 10 seconds (as per PRD requirements)
  startAutosave(roomId: string, supabase: any) {
    setInterval(async () => {
      const state = Y.encodeStateAsUpdate(this.doc)
      
      await supabase.from('yjs_documents').upsert({
        room_id: roomId,
        state: Array.from(state),
        updated_at: new Date().toISOString()
      })
    }, 10000)  // 10 seconds
  }
  
  destroy() {
    if (this.batchTimeout) clearTimeout(this.batchTimeout)
    this.channel.unsubscribe()
    this.doc.destroy()
  }
}
```

**Usage in Component**:

```typescript
// components/CollaborativeEditor.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as Y from 'yjs'
import { SupabaseYjsProvider } from '@/lib/supabase-yjs-provider'

export function CollaborativeEditor({ roomId, userId }: {
  roomId: string
  userId: string
}) {
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<SupabaseYjsProvider | null>(null)
  
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const yDoc = new Y.Doc()
    const yjsProvider = new SupabaseYjsProvider(yDoc, supabase, {
      roomId,
      userId,
      updateDebounceMs: 100  // CRITICAL: batching window
    })
    
    yjsProvider.startAutosave(roomId, supabase)
    
    setDoc(yDoc)
    setProvider(yjsProvider)
    
    return () => {
      yjsProvider.destroy()
    }
  }, [roomId, userId])
  
  if (!doc) return <div>Loading editor...</div>
  
  // Connect to TipTap or ProseMirror with Yjs binding
  return <YjsEditor doc={doc} />
}
```

***

## **5. DEPLOYMENT & DEVOPS**

### **5.1 Vercel Configuration**

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"], // Singapore region
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "DATABASE_URL": "@database-url",
    "DIRECT_URL": "@direct-url",
    "R2_ACCOUNT_ID": "@r2-account-id",
    "R2_ACCESS_KEY_ID": "@r2-access-key",
    "R2_SECRET_ACCESS_KEY": "@r2-secret-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/graphql",
      "destination": "/api/graphql"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Deployment Commands**:

```bash
# Week 1 Day 1: Deploy to Vercel

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables (first time only)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
# ... (repeat for all env vars)

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs sanadflow-affine --follow
```

#### **5.1.1 GitHub-Vercel Automatic Deployment Integration**

> [!IMPORTANT]
> **Implemented**: January 12, 2026
> **Live URL**: https://qalamcolab.vercel.app
> **Health Check**: https://qalamcolab.vercel.app/api/health

**Automatic Deployment Flow**:

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Machine                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Load GH_TOKEN from .env.local                   │   │
│  │  2. git commit && git push origin main              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ↓ Push
┌─────────────────────────────────────────────────────────────┐
│  GitHub Repository: bojak83318/sanadflow-study-hub          │
│  - Automatic trigger on push to main                        │
│  - GitHub Actions for backups (daily at 2 AM SGT)          │
│  - GitHub Actions for keep-alive (every 6 days)            │
└─────────────────────────────────────────────────────────────┘
                        ↓ Webhook
┌─────────────────────────────────────────────────────────────┐
│  Vercel Platform                                             │
│  - Auto-build on push                                        │
│  - Environment variables pre-configured                      │
│  - Production: https://qalamcolab.vercel.app                │
│  - Preview: https://qalamcolab-*.vercel.app (per PR)        │
└─────────────────────────────────────────────────────────────┘
```

**Local GitHub Authentication Workflow**:

> [!CAUTION]
> **NEVER use global GitHub credentials for this project.**
> Always use the `GH_TOKEN` from `.env.local` as documented in `GEMINI.md`.

```bash
# Step 1: Load GH_TOKEN for this session
export GH_TOKEN=$(grep '^GH_TOKEN=' .env.local | cut -d '=' -f2)

# Step 2: Verify authentication
gh auth status

# Step 3: Commit and push
git add .
git commit -m "feat: your changes"
git push origin main

# Vercel will automatically deploy on push!
```

**Automation Scripts Available**:

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/upload-env-to-vercel.sh` | Upload .env.local vars to Vercel | `./scripts/upload-env-to-vercel.sh` |
| `scripts/test-db-connection.sh` | Test Supabase database connectivity | `./scripts/test-db-connection.sh` |

**Environment Variables Configured in Vercel**:

| Variable | Scope | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | ✅ Configured |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | ✅ Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | ✅ Configured |
| `SUPABASE_JWT_SECRET` | Production | ✅ Configured |
| `DATABASE_URL` | Production | ✅ Configured |
| `DIRECT_URL` | Production | ✅ Configured |
| `NEXT_PUBLIC_APP_URL` | Production | ✅ Configured |
| `NODE_ENV` | Production | ✅ Configured |

**Health Check Verification** (Jan 12, 2026):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T03:04:40.852Z",
  "checks": {
    "database": {"ok": true, "latency_ms": 1241},
    "storage": {"ok": true},
    "auth": {"ok": true}
  }
}
```

***

### **5.2 Supabase Project Setup**

```bash
# Week 1 Day 1: Initialize Supabase project

# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to remote project (after creating project in Supabase Dashboard)
supabase link --project-ref your-project-ref

# Generate migration from Prisma schema
npx prisma migrate dev --name init_schema

# Deploy migration to Supabase
npx prisma migrate deploy

# Enable extensions
supabase db push --include-all

# Seed database
npx prisma db seed
```

**Supabase Dashboard Configuration** (Manual Steps):

1. **Create Project**:
   - Go to https://app.supabase.com
   - Click "New Project"
   - Name: "sanadflow-prod"
   - Region: "Southeast Asia (Singapore)"
   - Password: Generate strong password (save to 1Password)

2. **Enable Extensions**:
   - Navigate to Database → Extensions
   - Enable: `pg_trgm`, `unaccent`

3. **Configure Auth**:
   - Navigate to Authentication → Settings
   - Site URL: `https://sanadflow.vercel.app`
   - Redirect URLs: `https://sanadflow.vercel.app/**`, `http://localhost:3000/**`
   - Disable email confirmations (pilot phase)

4. **Create Storage Buckets**:
   - Navigate to Storage → Create new bucket
   - Name: `diagrams`
   - Public: `false` (private)
   - File size limit: `50MB`

5. **Apply RLS Policies** (via SQL Editor):
   - Copy all RLS policies from Section 3.1
   - Paste into SQL Editor
   - Run

***

### **5.3 GitHub Actions Backup Workflow**

```yaml
# .github/workflows/daily-backup.yml
name: Daily Supabase Backup

on:
  schedule:
    - cron: '0 18 * * *'  # 2 AM Singapore time (18:00 UTC)
  workflow_dispatch:  # Manual trigger

env:
  TZ: Asia/Singapore

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Install Supabase CLI
        run: npm install -g supabase
      
      - name: Login to Supabase
        run: |
          supabase login --access-token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Backup database
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="sanadflow_backup_${TIMESTAMP}.sql"
          
          # Dump database schema + data
          supabase db dump -p ${{ secrets.SUPABASE_DB_PASSWORD }} > $BACKUP_FILE
          
          # Compress
          gzip $BACKUP_FILE
          
          echo "BACKUP_FILE=${BACKUP_FILE}.gz" >> $GITHUB_ENV
      
      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ env.BACKUP_FILE }}
          path: ${{ env.BACKUP_FILE }}
          retention-days: 30  # Keep for 30 days
      
      - name: Upload to Cloudflare R2
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        run: |
          # Install AWS CLI (R2 uses S3-compatible API)
          sudo apt-get update && sudo apt-get install -y awscli
          
          # Configure R2
          aws configure set aws_access_key_id $R2_ACCESS_KEY_ID
          aws configure set aws_secret_access_key $R2_SECRET_ACCESS_KEY
          aws configure set region auto
          
          # Upload to R2
          aws s3 cp ${{ env.BACKUP_FILE }} \
            s3://sanadflow-backups/daily/ \
            --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
          
          # Keep only last 30 days
          aws s3 ls s3://sanadflow-backups/daily/ \
            --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com | \
            sort -r | awk 'NR>30 {print $4}' | \
            xargs -I {} aws s3 rm s3://sanadflow-backups/daily/{} \
              --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
      
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Database backup failed for SanadFlow",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Backup Job Failed*\nTime: ${{ env.TZ }}\nWorkflow: ${{ github.workflow }}"
                  }
                }
              ]
            }
```

***

### **5.4 Supabase Keep-Alive (Prevent 7-Day Pause)**

```yaml
# .github/workflows/keep-alive.yml
name: Supabase Keep-Alive

on:
  schedule:
    - cron: '0 0 */6 * *'  # Every 6 days
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    
    steps:
      - name: Ping Supabase Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          # Simple SELECT query to keep database active
          psql "$DATABASE_URL" -c "SELECT 1"
      
      - name: Ping Supabase REST API
        run: |
          curl -X GET "${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/health" \
            -H "apikey: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}"
      
      - name: Log activity
        run: |
          echo "✅ Supabase keep-alive ping successful at $(date)"
```

***

## **6. TESTING STRATEGY (SAME AS v2.0)**

### **6.1 RTL Test Suite (50 Tests, 90% Pass Threshold)**

> **Note**: RTL testing requirements **unchanged from v2.0**. Same 50 test cases, same 90% pass threshold for Week 1 Day 3 gate.

```typescript
// tests/rtl/arabic-input.test.ts
import { test, expect } from '@playwright/test'

test.describe('RTL (Right-to-Left) Arabic Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'ahmed@example.com')
    await page.fill('[name="password"]', 'Test@1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/workspace/**')
  })
  
  // Test 1-10: Pure Arabic text
  test('TC-001: Type pure Arabic paragraph', async ({ page }) => {
    await page.click('[data-testid="new-document"]')
    
    const editor = page.locator('[contenteditable="true"]')
    await editor.fill('بسم الله الرحمن الرحيم. الحمد لله رب العالمين.')
    
    const text = await editor.textContent()
    expect(text).toBe('بسم الله الرحمن الرحيم. الحمد لله رب العالمين.')
    
    // Verify cursor at end (not jumping to start)
    await editor.press('End')
    await editor.type(' والصلاة')
    const updatedText = await editor.textContent()
    expect(updatedText).toContain('والصلاة')
  })
  
  // Test 11-20: Mixed Arabic-English
  test('TC-011: Type mixed Arabic-English inline', async ({ page }) => {
    await page.click('[data-testid="new-document"]')
    
    const editor = page.locator('[contenteditable="true"]')
    await editor.fill('The word الإيمان means faith in English.')
    
    // Verify text direction auto-detection
    const direction = await editor.evaluate(el => window.getComputedStyle(el).direction)
    expect(direction).toBe('ltr')
  })
  
  // Test 21-30: Whiteboard Arabic labels (TLDraw v1.29.2)
  test('TC-021: Add Arabic text box to whiteboard', async ({ page }) => {
    await page.goto('http://localhost:3000/workspace/test-ws/whiteboard/new')
    
    await page.waitForSelector('[data-testid="tldraw-canvas"]')
    
    await page.click('[data-testid="tool-text"]')
    await page.click('[data-testid="tldraw-canvas"]', { position: { x: 200, y: 200 } })
    
    await page.keyboard.type('فَاعِل')
    
    const textBox = page.locator('text=فَاعِل')
    expect(await textBox.textContent()).toBe('فَاعِل')
    
    const textAlign = await textBox.evaluate(el => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')
  })
  
  // ... (tests 31-50 omitted for brevity - same as v2.0)
})
```

***

### **6.2 Load Test Specification (k6 - Same as v2.0)**

> **Note**: Load testing with k6 **unchanged from v2.0**. Same 10 concurrent users, same p95 <2s threshold.

***

## **7. GO-LIVE GATES (UPDATED FOR SUPABASE)**

### **7.1 Week 1 Day 3 Checkpoint (January 15, 5:00 PM SGT)**

Three mandatory gates must pass before proceeding to Week 2:

#### **GATE 1: RTL Testing (Day 2)** ✅ SAME AS v2.0

**Criteria**:
- [ ] **45/50 tests pass (90% pass rate)**
- [ ] All critical tests pass (pure Arabic, mixed, whiteboard)
- [ ] Screen recordings uploaded to GitHub

**Pass Threshold**: ≥90% (45/50 tests)  
**Fail Threshold**: <80% (<40 tests) → **ABORT PILOT**

***

#### **GATE 2: Performance Baseline (Day 3)** ✅ UPDATED FOR SERVERLESS

**Criteria**:
- [ ] **p95 latency <2s** with 5 concurrent users
- [ ] **Supabase connection pool stable** (no "too many connections" errors)
- [ ] **Vercel function executions <900K/month** (90% of 1M limit)
- [ ] **Supabase API calls <9M/month** (90% of 10M limit)
- [ ] Health check returns HTTP 200

**Pass Threshold**: All 5 criteria met  
**Fail Threshold**: Any 1 criterion fails → Extend or abort

**IF FAIL**:
```
Escalation Path:
┌──────────────────────────────────────────────┐
│ T+0:00: Priya profiles Vercel functions      │
│ T+2:00: Check Supabase usage dashboard        │
│ T+3:00: Dr. Chen reviews optimization options│
│         - Enable caching                     │
│         - Reduce Realtime message frequency   │
│ T+4:00: If fixable in 1 day: Extend to Day 4│
│ T+5:00: If not fixable: Evaluate paid tiers:│
│         Option A: Vercel Pro ($20/month)     │
│         Option B: Supabase Pro ($25/month)   │
│         Option C: Abort, use Notion Plus     │
└──────────────────────────────────────────────┘
```

***

#### **GATE 3: Deployment Smoke Test (Day 3)** ✅ UPDATED FOR SUPABASE + VERCEL

**Criteria**:
- [ ] **Vercel deployment healthy** (`curl https://sanadflow.vercel.app/api/health`)
- [ ] **User can sign up via Supabase Auth** (email/password)
- [ ] **User can create workspace** (GraphQL mutation successful)
- [ ] **User can create hadith** (database insert + FTS works)
- [ ] **Real-time cursors work** (2-user test with Supabase Realtime)
- [ ] **Backup job runs successfully** (GitHub Actions manual trigger)

**Pass Threshold**: All 6 smoke tests pass  
**Fail Threshold**: Any critical test fails

**IF FAIL**:
```
Escalation Path:
┌──────────────────────────────────────────────┐
│ T+0:00: Priya debugs logs (2 hrs)            │
│         Check: Vercel logs, Supabase logs    │
│ T+2:00: If Supabase platform issue:          │
│         → Escalate to Supabase support       │
│         → Check status.supabase.com          │
│ T+2:30: If code bug:                         │
│         → Roll back Vercel deployment        │
│         → Fix locally, re-deploy             │
│ T+3:00: PM approves 1-day delay for fixes    │
└──────────────────────────────────────────────┘
```

***

## **8. WEEK 1 IMPLEMENTATION CHECKLIST (UPDATED)**

### **Day 1 (Jan 13): Supabase + Vercel Setup**
- [ ] Create Supabase project (Singapore region)
- [ ] Enable PostgreSQL extensions (`pg_trgm`, `unaccent`)
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Create Supabase Storage bucket: `diagrams`
- [ ] Apply RLS policies (copy-paste from Section 3.1)
- [ ] Configure Supabase Auth (email/password, disable confirmations)
- [ ] Create Vercel project, link to GitHub repo
- [ ] Set Vercel environment variables (10 secrets)
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify deployment: `curl https://sanadflow.vercel.app/api/health`

### **Day 2 (Jan 14): RTL Testing**
- [ ] Run Playwright RTL test suite: `npm run test:rtl`
- [ ] Document failures in GitHub Issue
- [ ] Calculate pass rate: `(passed / 50) × 100%`
- [ ] **GATE 1 DECISION**: If <90%, escalate

### **Day 3 (Jan 15): Performance + Smoke Tests**
- [ ] Run k6 load test: `k6 run tests/load/baseline.k6.js`
- [ ] Check Supabase usage: Database → Usage
- [ ] Check Vercel usage: Settings → Usage
- [ ] **GATE 2 DECISION**: Pass/fail performance thresholds
- [ ] Run smoke tests: `npm run test:smoke`
- [ ] **GATE 3 DECISION**: All smoke tests pass?
- [ ] **CRITICAL CHECKPOINT (5:00 PM SGT)**: All 3 gates pass?

### **Day 4 (Jan 16): Data Migration**
- [ ] Import 50 sample hadiths via GraphQL
- [ ] Create 10 narrator profiles
- [ ] Draw 5 Nahw diagrams in whiteboard
- [ ] Test Supabase Storage upload (diagram PNG)
- [ ] Configure GitHub Actions backup workflow
- [ ] Run manual backup test

### **Day 5 (Jan 17): Documentation + Handoff**
- [ ] Update `docs/deployment-guide.md` with Supabase/Vercel steps
- [ ] Record video walkthrough: "How to Deploy SanadFlow v3.0"
- [ ] Create GitHub Project board with Week 2 tasks
- [ ] Onboard Jordan (backup engineer)
- [ ] Write Week 1 retrospective
- [ ] Schedule Week 2 kickoff meeting

***

## **9. RISK REGISTER (UPDATED FOR SUPABASE)**

### **9.1 Technical Risks**

| Risk ID | Description | Probability | Impact | Mitigation | Owner |
|---------|-------------|-------------|--------|-----------|-------|
| **TR-001** | **Supabase 7-day pause** (inactivity) | Medium | High | GitHub Actions keep-alive every 6 days | Priya |
| **TR-002** | **Realtime message limit exceeded** (2M/month) | Low | Medium | 100ms batching (4.3M → 2.1M effective) | Engineering |
| **TR-003** | **Vercel function timeout** (10s limit) | Low | Medium | Optimize queries, use Vercel Pro if needed ($20/month) | Priya |
| **TR-004** | **Supabase Storage 1GB limit** | Low | Low | Archive old diagrams to R2 at 800MB | Engineering |
| **TR-005** | **RLS policy misconfiguration** (data leak) | Low | Critical | Penetration test Week 1 Day 3 | Priya |
| **TR-006** | **Arabic FTS accuracy <70%** | Medium | Medium | Post-pilot: ElasticSearch or Algolia ($10/month) | Priya |

### **9.2 Operational Risks (Same as v2.0)**

***

## **10. DOCUMENT SIGN-OFF**

**Prepared by**: Priya Patel (Tech Lead)  
**Reviewed by**: Dr. Sarah Chen (Architect), Marcus Rodriguez (Eng Director)  
**Approved by**: Marcus Rodriguez (Engineering Director)  
**Date**: January 11, 2026, 8:00 PM SGT  
**Next Review**: January 15, 2026, 5 PM SGT (Day 3 Gate)

