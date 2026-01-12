# Phase 1: Database Setup - Backend Engineer Stories

> **Agent**: Backend Engineer  
> **Phase**: 1 (Infrastructure Setup)  
> **Timeline**: Day 1-2 (Jan 13-14, 2026)  
> **Dependencies**: INFRA-001 (Supabase project created)

---

## Story: BE-001 - Prisma Schema Migration

**As a** Backend Engineer  
**I want to** deploy the Prisma schema to Supabase  
**So that** all tables and indexes are ready for development

### Acceptance Criteria

- [ ] Prisma schema created from TDD Section 3.3
- [ ] All 8 models defined:
  - [ ] `UserProfile`
  - [ ] `Workspace`
  - [ ] `WorkspaceMember`
  - [ ] `Document`
  - [ ] `Hadith`
  - [ ] `Narrator`
  - [ ] `Diagram`
  - [ ] `YjsDocument`
- [ ] Migrations executed successfully
- [ ] Prisma Client generated

### Technical Details

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Port 6543 pooler
  directUrl = env("DIRECT_URL")        // Port 5432 direct
}

model UserProfile {
  id           String    @id @db.Uuid
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

// ... (full schema from TDD Section 3.3)
```

### Commands to Execute

```bash
# 1. Verify environment variables
echo $DATABASE_URL
echo $DIRECT_URL

# 2. Initialize Prisma
npx prisma init

# 3. Create migration
npx prisma migrate dev --name init

# 4. Deploy to Supabase
npx prisma migrate deploy

# 5. Generate Prisma Client
npx prisma generate

# 6. Verify tables created
npx prisma db pull
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Prisma schema | `prisma/schema.prisma` |
| Migration files | `prisma/migrations/` |
| Prisma Client | `node_modules/.prisma/client` |

---

## Story: BE-002 - Row-Level Security Policies

**As a** Backend Engineer  
**I want to** apply RLS policies to all tables  
**So that** users can only access their own data

### Acceptance Criteria

- [ ] RLS enabled on all 8 tables
- [ ] SELECT policies for workspace membership
- [ ] INSERT policies for authenticated users
- [ ] UPDATE/DELETE policies for owners/admins
- [ ] Storage bucket policies for diagrams

### Technical Details

Run in Supabase SQL Editor:

```sql
-- ============================================
-- USER PROFILES RLS
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- WORKSPACES RLS
-- ============================================
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

-- ============================================
-- WORKSPACE MEMBERS RLS
-- ============================================
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

-- ============================================
-- DOCUMENTS RLS
-- ============================================
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

-- ============================================
-- HADITHS RLS
-- ============================================
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

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
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
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| RLS SQL script | `supabase/migrations/002_rls_policies.sql` |

---

## Story: BE-003 - Arabic FTS Setup

**As a** Backend Engineer  
**I want to** implement Arabic full-text search  
**So that** users can search hadiths with 70% accuracy

### Acceptance Criteria

- [ ] `remove_arabic_diacritics()` function created
- [ ] GIN index on `hadiths.arabic_text` with trigram
- [ ] `search_hadith_arabic()` function created
- [ ] Search returns results in <500ms for 1000 records

### Technical Details

```sql
-- Arabic diacritics removal function
CREATE OR REPLACE FUNCTION remove_arabic_diacritics(text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    text,
    '[\u064B-\u065F\u0670]',
    '',
    'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- GIN index for fuzzy Arabic search
CREATE INDEX idx_hadiths_arabic_trgm 
  ON hadiths 
  USING gin(remove_arabic_diacritics(arabic_text) gin_trgm_ops);

-- Search function
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
  PERFORM set_limit(min_similarity);
  
  RETURN QUERY
  SELECT 
    h.id,
    h.arabic_text,
    similarity(
      remove_arabic_diacritics(h.arabic_text), 
      remove_arabic_diacritics(query_text)
    ) AS sim
  FROM hadiths h
  WHERE remove_arabic_diacritics(h.arabic_text) % remove_arabic_diacritics(query_text)
  ORDER BY sim DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| FTS SQL script | `supabase/migrations/003_arabic_fts.sql` |

---

## Exit Criteria

Before proceeding to Phase 2:

- [ ] All 8 tables exist in Supabase
- [ ] RLS policies verified: `SELECT * FROM pg_policies;`
- [ ] Arabic FTS function tested: `SELECT * FROM search_hadith_arabic('الله');`
- [ ] Prisma Client imports work: `import { PrismaClient } from '@prisma/client'`

---

## Handoff to Frontend Engineer

```markdown
## HANDOFF: BACKEND → FRONTEND

**Status**: ✅ Database Ready
**Date**: [DATE]

### Available:
- Prisma Client configured
- All tables with RLS
- Arabic FTS function

### Next Steps for Frontend:
1. Import Prisma Client in API routes
2. Set up Supabase client (browser/server)
3. Implement auth pages
```
