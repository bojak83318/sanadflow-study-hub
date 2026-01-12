# **TECHNICAL DESIGN DOCUMENT (TDD) v2.0 - FINAL**
## **SanadFlow Study Hub - Implementation Specification**

**Document Type**: Technical Design Document v2.0 (FINAL)  
**Tech Lead**: Priya Patel  
**System Architect**: Dr. Sarah Chen  
**Engineering Director**: Marcus Rodriguez  
**Date**: January 12, 2026, 12:00 PM SGT  
**Status**: ✅ **APPROVED** - Ready for Week 1 Implementation  
**Related Documents**: PRD v2.0, ADD v2.0

***

## **REVISION HISTORY**

| Version | Date | Author | Status | Changes |
|---------|------|--------|--------|---------|
| v1.0 | Jan 11, 8:00 PM | Priya Patel (Tech Lead) | DRAFT | Initial implementation specification |
| v2.0 | Jan 12, 12:00 PM | Priya Patel (Tech Lead) | **FINAL** | 10 revisions from architecture review (Jan 11, 9:00 PM) |

**Key Changes in v2.0:**
- ✅ **PostgreSQL `shared_buffers`**: Reduced from 200MB → 64MB (OOM risk mitigation)
- ✅ **PgBouncer**: Session mode declared **permanent** for pilot (removed Week 3+ migration plan)
- ✅ **TLDraw**: Downgraded from v2.0.0-beta.2 → v1.29.2 stable (production reliability)
- ✅ **Load Testing**: Added detailed k6 test specification with pass/fail thresholds
- ✅ **Monitoring**: Added PostgreSQL slow query logging + BetterStack ingestion config
- ✅ **Go-Live Gates**: Added Section 10.2 with 3 gates + escalation matrix
- ✅ **Open Questions**: Resolved all 5 technical questions (Q-001 through Q-005)
- ✅ **Backup Engineer**: Jordan assigned for Day 3-5 Fly.io deployment support
- ✅ **Week 1 Checklist**: Added 3 new tasks (slow query logging, TLDraw downgrade, R2 CORS)

***

## **1. DOCUMENT PURPOSE**

This Technical Design Document (TDD) translates the approved Architecture Decision Document (ADD v2.0) into concrete implementation specifications for the engineering team. It defines:[1][2]

1. **Database schemas** with exact column types, indexes, and constraints
2. **API contracts** (GraphQL schema, REST endpoints)
3. **Component architecture** (frontend/backend modules)
4. **Deployment procedures** (Docker configs, CI/CD pipelines)
5. **Testing strategy** (unit, integration, E2E, RTL test plans)
6. **Go-live gates** with clear pass/fail criteria and escalation paths

**Target Audience**: Backend engineers, frontend developers, DevOps admins (Ahmed, Admin 1)

***

## **2. SYSTEM ARCHITECTURE OVERVIEW**

### **2.1 Technology Stack**

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | React | 18.2.0 | AFFiNE's built-in framework [2] |
| **Frontend Framework** | Next.js | 14.0.4 | SSR for SEO, API routes [2] |
| **Backend Runtime** | Node.js | 18.17.0 LTS | Long-term support, stable [2] |
| **API Layer** | Apollo GraphQL Server | 4.9.5 | Real-time subscriptions, type safety [1] |
| **Database** | PostgreSQL | 16.1 | Native JSON support, GIN indexes for Arabic FTS [2] |
| **Cache** | Redis | 7.2.3 | Embedded, AOF persistence [2] |
| **ORM** | Prisma | 5.7.1 | Type-safe queries, migrations [2] |
| **Real-time Sync** | Yjs CRDT | 13.6.10 | Conflict-free collaborative editing [1] |
| **Whiteboard** | TLDraw | **1.29.2** ✅ | **CHANGED**: Canvas with Arabic RTL support (stable release) |

**CHANGE LOG**: TLDraw downgraded from v2.0.0-beta.2 to v1.29.2 stable per architecture review (Jan 11, 9:10 PM). Rationale: Production stability over beta features.[2]

### **2.2 Deployment Architecture (Fly.io)**

```
┌────────────────────────────────────────────────────┐
│  Fly.io Region: Singapore (sin)                    │
│  Total Resources: 3× 256MB VMs = 768MB RAM        │
└────────────────────────────────────────────────────┘

VM1: sanadflow-web (256MB)
├── Node.js 18 (150MB heap limit)
├── Next.js SSR
├── Apollo GraphQL Server
├── Embedded Redis (100MB AOF)
└── Health check endpoint

VM2: sanadflow-db (256MB) ✅ REVISED
├── PostgreSQL 16 (64MB shared_buffers) ← CHANGED from 200MB
├── 1GB persistent volume (/var/lib/postgresql)
├── WAL archiving (3-day retention)
├── OS + kernel: 30MB
├── Connection overhead (50 conns × 1MB): 50MB
├── Reserve buffer: 16MB
└── Database: affine_production

VM3: sanadflow-services (256MB)
├── PgBouncer (session mode, 50 max clients) ✅ PERMANENT
├── Backup cron jobs (pg_dump to R2)
├── Prometheus metrics exporter
└── BetterStack log agent ✅ NEW
```

**MEMORY BUDGET (VM2 - REVISED)**:
```
Total RAM: 256MB
├── PostgreSQL base process: 80MB
├── shared_buffers: 64MB ← CHANGED (was 200MB)
├── OS kernel/cache: 30MB
├── Connection overhead (50 × 1MB): 50MB
├── WAL buffers: 16MB
└── Safety margin: 16MB
────────────────────────────
Total: 256MB (exact fit)

Under Load (10 concurrent users):
├── Peak PostgreSQL memory: ~200MB
├── Available for OS: 56MB
└── Swap usage: <20MB (acceptable)
```

**APPROVAL**: Dr. Sarah Chen confirmed 64MB `shared_buffers` is safe for 256MB RAM (25% rule). Performance trade-off accepted for pilot stability.[2]

***

## **3. DATABASE DESIGN**

### **3.1 Schema: Core Tables**

#### **Table: `users`**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt, cost=12
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'member', 'reader'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;
```

**Capacity Planning**:
- 10 users × ~500 bytes/user = **5KB** (negligible)
- Growth: 50 users over 2 years = 25KB

***

#### **Table: `workspaces`**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly: 'hadith-studies'
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon_emoji VARCHAR(10), -- e.g., '📚'
  settings JSONB NOT NULL DEFAULT '{}', -- Flexible: {"rtl_default": true}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
```

**Storage Estimate**:
- 3 workspaces × 1KB = **3KB**

***

#### **Table: `workspace_members`**
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'edit', -- 'view', 'edit', 'admin'
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id) -- Prevent duplicate memberships
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
```

**Storage Estimate**:
- 10 users × 3 workspaces = 30 memberships × 200 bytes = **6KB**

***

#### **Table: `documents`**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content_yjs BYTEA, -- Yjs CRDT binary format (compressed)
  content_json JSONB, -- Fallback plaintext for search
  parent_id UUID REFERENCES documents(id), -- Nested pages
  icon_emoji VARCHAR(10),
  cover_image_url TEXT,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete (30-day trash)
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

CREATE INDEX idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_title ON documents USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;
```

**Storage Estimate**:[1]
- 500 hadiths × avg 2KB (Arabic text + metadata) = **1MB**
- 50 documents × 5KB (rich text) = **250KB**
- **Total: ~1.3MB** (well under 3GB limit)

***

#### **Table: `hadiths`** (Custom Structured Data)
```sql
CREATE TABLE hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id), -- Optional: Link to note
  
  -- Hadith content
  arabic_text TEXT NOT NULL,
  english_translation TEXT,
  transliteration TEXT,
  
  -- Classification
  collection VARCHAR(100), -- 'Sahih Bukhari', 'Sahih Muslim', etc.
  book_number VARCHAR(50),
  hadith_number VARCHAR(50),
  grading VARCHAR(50), -- 'Sahih', 'Hasan', 'Daif', 'Mawdu'
  
  -- Narration chain (Sanad)
  narrator_ids UUID[], -- Array of narrator UUIDs
  narration_chain TEXT, -- Full isnad text
  
  -- Metadata
  topic_tags TEXT[], -- ['Prayer', 'Fasting', 'Charity']
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT arabic_text_not_empty CHECK (LENGTH(TRIM(arabic_text)) > 0)
);

-- Full-text search on Arabic text [file:85]
-- ✅ RESOLVED Q-001: Native PostgreSQL Arabic FTS tested locally (70% accuracy acceptable for pilot)
CREATE INDEX idx_hadiths_arabic_fts ON hadiths USING gin(to_tsvector('arabic', arabic_text));
CREATE INDEX idx_hadiths_english_fts ON hadiths USING gin(to_tsvector('english', english_translation));
CREATE INDEX idx_hadiths_workspace ON hadiths(workspace_id);
CREATE INDEX idx_hadiths_grading ON hadiths(grading);
CREATE INDEX idx_hadiths_narrator ON hadiths USING gin(narrator_ids);
```

**Storage Estimate**:[1]
- 500 hadiths × 2KB avg = **1MB**
- Growth to 2,000 hadiths = **4MB**

***

#### **Table: `narrators`**
```sql
CREATE TABLE narrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Names
  name_arabic VARCHAR(255) NOT NULL,
  name_english VARCHAR(255),
  kunyah VARCHAR(100), -- e.g., 'Abu Hurairah'
  laqab VARCHAR(100), -- Title/epithet
  
  -- Biographical data
  birth_year INT, -- Hijri year
  death_year INT,
  biography_ar TEXT,
  biography_en TEXT,
  reliability_grade VARCHAR(50), -- 'Thiqah', 'Saduq', etc.
  
  -- Relations
  teachers UUID[], -- Array of narrator UUIDs
  students UUID[],
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name_arabic)) > 0)
);

CREATE INDEX idx_narrators_workspace ON narrators(workspace_id);
CREATE INDEX idx_narrators_name_ar ON narrators USING gin(to_tsvector('arabic', name_arabic));
CREATE INDEX idx_narrators_name_en ON narrators USING gin(to_tsvector('english', name_english));
```

**Storage Estimate**:
- 200 narrators × 1.5KB = **300KB**

***

#### **Table: `diagrams`** (Whiteboard Snapshots)
```sql
CREATE TABLE diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Storage strategy [file:86]
  storage_location VARCHAR(20) NOT NULL, -- 'postgres' or 'r2'
  blob BYTEA, -- PNG/SVG binary (if postgres)
  r2_url TEXT, -- Cloudflare R2 URL (if offloaded)
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/png',
  
  -- Canvas state (TLDraw v1.29.2) ✅ CHANGED
  canvas_state JSONB, -- Serialized shapes, arrows, text
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT storage_xor CHECK (
    (storage_location = 'postgres' AND blob IS NOT NULL AND r2_url IS NULL) OR
    (storage_location = 'r2' AND blob IS NULL AND r2_url IS NOT NULL)
  )
);

CREATE INDEX idx_diagrams_workspace ON diagrams(workspace_id);
CREATE INDEX idx_diagrams_storage ON diagrams(storage_location);
CREATE INDEX idx_diagrams_document ON diagrams(document_id);
```

**Storage Estimate**:[2]
- 50 diagrams × 1.5MB (PNG) = **75MB** (in PostgreSQL)
- If DB >2.5GB, offload to R2 (10GB free tier)

***

#### **Table: `comments`**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id), -- Thread replies
  
  content TEXT NOT NULL,
  content_json JSONB, -- Rich text formatting
  
  -- Selection context (what text was highlighted)
  selection_start INT,
  selection_end INT,
  selection_text TEXT,
  
  author_id UUID NOT NULL REFERENCES users(id),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

CREATE INDEX idx_comments_document ON comments(document_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_unresolved ON comments(is_resolved) WHERE is_resolved = FALSE;
```

**Storage Estimate**:
- 200 comments × 500 bytes = **100KB**

***

#### **Table: `document_versions`** (Version History)
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  version_number INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_yjs BYTEA,
  content_json JSONB,
  
  -- Change metadata
  changed_by UUID NOT NULL REFERENCES users(id),
  change_description TEXT, -- Optional: "Fixed narrator spelling"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, version_number)
);

CREATE INDEX idx_doc_versions_document ON document_versions(document_id, version_number DESC);
```

**Retention Policy**:[1]
- Keep all versions for 30 days
- After 30 days: Keep only major versions (every 10th)

**Storage Estimate**:
- 500 documents × 5 versions × 2KB = **5MB**

***

### **3.2 PostgreSQL Configuration (256MB RAM) ✅ REVISED**

```ini
# postgresql.conf (optimized for Fly.io VM2)

# ============================================
# MEMORY SETTINGS ✅ REVISED
# ============================================
shared_buffers = 64MB              # ← CHANGED from 200MB (25% of 256MB RAM)
effective_cache_size = 160MB       # 63% of RAM (OS will cache)
work_mem = 2MB                     # Per query operation
maintenance_work_mem = 16MB        # For VACUUM, CREATE INDEX

# ============================================
# CONNECTION POOLING (via PgBouncer)
# ============================================
max_connections = 50               # PgBouncer will pool these

# ============================================
# WAL SETTINGS (Point-in-Time Recovery)
# ============================================
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
max_wal_size = 200MB
min_wal_size = 80MB

# ============================================
# CHECKPOINT SETTINGS
# ============================================
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# ============================================
# QUERY PERFORMANCE
# ============================================
random_page_cost = 1.1             # SSD storage
effective_io_concurrency = 200
default_statistics_target = 100

# ============================================
# LOGGING ✅ NEW (BetterStack integration)
# ============================================
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB

# Log slow queries (>500ms) [file:85]
log_min_duration_statement = 500   # ✅ NEW: Log queries >500ms
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'ddl'              # Log schema changes
log_connections = on               # ✅ NEW: Track connection patterns
log_disconnections = on            # ✅ NEW: Track connection patterns

# Performance analysis
log_lock_waits = on                # Log if query waits >1s for lock
log_temp_files = 0                 # Log all temp file usage
```

**CHANGE JUSTIFICATION**: Dr. Sarah Chen flagged 200MB `shared_buffers` as OOM risk (78% of RAM). PostgreSQL best practice: 25% of system RAM, max 40%. Reduced to 64MB for pilot stability. Performance impact: ~30% slower complex queries, acceptable for <10 users.[2]

***

### **3.3 Database Migrations (Prisma)**

#### **Migration 001: Initial Schema**
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String    @map("password_hash") @db.VarChar(255)
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
  comments             Comment[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Workspace {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  description String?
  ownerId     String   @map("owner_id") @db.Uuid
  iconEmoji   String?  @map("icon_emoji") @db.VarChar(10)
  settings    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  owner     User              @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members   WorkspaceMember[]
  documents Document[]
  hadiths   Hadith[]
  narrators Narrator[]
  diagrams  Diagram[]

  @@index([ownerId])
  @@index([slug])
  @@map("workspaces")
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

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  document  Document? @relation(fields: [documentId], references: [id])
  creator   User      @relation(fields: [createdBy], references: [id])

  @@index([workspaceId])
  @@index([grading])
  @@map("hadiths")
}

// ... (other models similar structure)
```

**Migration Execution**:
```bash
# Week 1 Day 1: Initialize database
npx prisma migrate deploy --name init

# Generate Prisma Client
npx prisma generate

# Seed with test data
npx prisma db seed
```

***

## **4. API DESIGN**

### **4.1 GraphQL Schema** (Excerpt - Full schema in Appendix A)

```graphql
# schema.graphql

scalar DateTime
scalar JSON
scalar UUID

# ============================================
# AUTHENTICATION & USERS
# ============================================

type User {
  id: UUID!
  email: String!
  fullName: String!
  role: UserRole!
  avatarUrl: String
  createdAt: DateTime!
  lastLoginAt: DateTime
  isActive: Boolean!
}

enum UserRole {
  ADMIN
  MEMBER
  READER
}

type AuthPayload {
  token: String!
  user: User!
  expiresAt: DateTime!
}

input SignUpInput {
  email: String!
  password: String!
  fullName: String!
}

input SignInInput {
  email: String!
  password: String!
}

# ============================================
# HADITHS (Structured Data)
# ============================================

type Hadith {
  id: UUID!
  workspace: Workspace!
  document: Document
  arabicText: String!
  englishTranslation: String
  transliteration: String
  collection: String
  bookNumber: String
  hadithNumber: String
  grading: HadithGrading
  narrators: [Narrator!]! # Resolved from narratorIds
  narrationChain: String
  topicTags: [String!]!
  notes: String
  creator: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum HadithGrading {
  SAHIH
  HASAN
  DAIF
  MAWDU
}

input CreateHadithInput {
  workspaceId: UUID!
  arabicText: String!
  englishTranslation: String
  collection: String
  grading: HadithGrading
  narratorIds: [UUID!]
  topicTags: [String!]
}

input SearchHadithsInput {
  workspaceId: UUID!
  query: String! # Arabic or English (70% accuracy with native FTS)
  grading: HadithGrading
  collection: String
  tags: [String!]
  limit: Int = 20
  offset: Int = 0
}

# ============================================
# QUERIES
# ============================================

type Query {
  # Authentication
  me: User
  
  # Hadiths
  hadith(id: UUID!): Hadith
  searchHadiths(input: SearchHadithsInput!): HadithConnection!
  
  # Health Check
  health: HealthStatus!
}

type HealthStatus {
  status: String! # "healthy", "degraded", "unhealthy"
  timestamp: DateTime!
  checks: JSON!
  metrics: JSON!
}

# ============================================
# MUTATIONS
# ============================================

type Mutation {
  # Authentication
  signUp(input: SignUpInput!): AuthPayload!
  signIn(input: SignInInput!): AuthPayload!
  signOut: Boolean!
  
  # Hadiths
  createHadith(input: CreateHadithInput!): Hadith!
  updateHadith(id: UUID!, input: CreateHadithInput!): Hadith!
  deleteHadith(id: UUID!): Boolean!
}

# ============================================
# SUBSCRIPTIONS (Real-time Collaboration)
# ============================================

type Subscription {
  # Document real-time updates
  documentUpdated(documentId: UUID!): DocumentUpdatePayload!
  
  # Cursor positions (live collaboration)
  cursorMoved(documentId: UUID!): CursorPayload!
}

type DocumentUpdatePayload {
  documentId: UUID!
  updateType: DocumentUpdateType!
  delta: JSON # Yjs CRDT delta
  user: User!
  timestamp: DateTime!
}

enum DocumentUpdateType {
  CONTENT_CHANGED
  TITLE_CHANGED
  DELETED
  RESTORED
}
```

**Full GraphQL schema** (120 lines): See Appendix A

***

### **4.2 PgBouncer Configuration ✅ REVISED**

```ini
# pgbouncer.ini (PERMANENT session mode for pilot)

[databases]
affine_production = host=localhost port=5432 dbname=affine_production user=postgres

[pgbouncer]
# ✅ CHANGED: Session mode declared PERMANENT (removed Week 3+ migration note)
# Rationale: Guaranteed Prisma compatibility, sufficient for ≤10 users
# Post-pilot: Re-evaluate only if connection pool utilization >80%
pool_mode = session                # Long-lived per user session
max_client_conn = 50               # From internet
default_pool_size = 5              # Per database (sufficient for 10 users)
reserve_pool_size = 2              # Emergency buffer
reserve_pool_timeout = 3           # Seconds before reject

# Logging
logfile = /var/log/pgbouncer/pgbouncer.log
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Health check
stats_users = postgres
admin_users = postgres

# Server settings
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = SELECT 1
```

**APPROVAL**: Marcus Rodriguez (Jan 11, 9:25 PM) - Session mode permanent for pilot. Post-pilot optimization only if needed.[2]

***

### **4.3 REST API Endpoints (Supplementary)**

For operations not suitable for GraphQL (file uploads, webhooks):

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|------------|
| `/api/health` | GET | Health check [2] | None | Unlimited |
| `/api/auth/signup` | POST | User registration | None | 5/min per IP |
| `/api/auth/signin` | POST | User login | None | 10/min per IP |
| `/api/auth/refresh` | POST | Refresh JWT token | Bearer | 100/min |
| `/api/upload/diagram` | POST | Upload PNG diagram | Bearer | 10/min per user |
| `/api/export/pdf` | POST | Export document to PDF [1] | Bearer | 5/min per user |
| `/api/backup/trigger` | POST | Manual backup trigger | Admin only | 1/day |
| `/api/metrics` | GET | Prometheus metrics | Internal | Unlimited |

***

## **5. FRONTEND ARCHITECTURE**

### **5.1 Component Structure (Next.js 14)**

```
src/
├── app/                           # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login form
│   │   ├── signup/
│   │   │   └── page.tsx          # Registration form
│   │   └── layout.tsx            # Auth layout (centered, no sidebar)
│   ├── (workspace)/
│   │   ├── [workspaceId]/
│   │   │   ├── page.tsx          # Workspace home
│   │   │   ├── documents/
│   │   │   │   ├── [documentId]/
│   │   │   │   │   └── page.tsx  # Document editor
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Create document
│   │   │   ├── hadiths/
│   │   │   │   ├── page.tsx      # Hadith database view
│   │   │   │   └── [hadithId]/
│   │   │   │       └── page.tsx  # Hadith detail
│   │   │   ├── narrators/
│   │   │   │   └── page.tsx      # Narrator list
│   │   │   ├── whiteboard/
│   │   │   │   └── [diagramId]/
│   │   │   │       └── page.tsx  # TLDraw v1.29.2 canvas ✅
│   │   │   └── settings/
│   │   │       └── page.tsx      # Workspace settings
│   │   └── layout.tsx            # Workspace layout (sidebar)
│   ├── api/
│   │   ├── graphql/
│   │   │   └── route.ts          # Apollo Server handler
│   │   ├── health/
│   │   │   └── route.ts          # Health check endpoint
│   │   ├── upload/
│   │   │   └── diagram/
│   │   │       └── route.ts      # Diagram upload
│   │   └── export/
│   │       └── pdf/
│   │           └── route.ts      # PDF export
│   ├── layout.tsx                # Root layout (RTL support)
│   └── page.tsx                  # Landing page
├── components/
│   ├── editor/
│   │   ├── DocumentEditor.tsx    # Rich text editor (Yjs CRDT)
│   │   ├── Toolbar.tsx           # Formatting toolbar
│   │   ├── CollaborativeCursor.tsx # Live cursors [file:85]
│   │   └── AutoSaveIndicator.tsx # "Saved at HH:MM" [file:85]
│   ├── hadith/
│   │   ├── HadithCard.tsx        # Hadith display card
│   │   ├── HadithForm.tsx        # Create/edit form
│   │   ├── NarratorPicker.tsx    # Dropdown with search
│   │   └── GradingBadge.tsx      # Color-coded grading
│   ├── whiteboard/
│   │   ├── WhiteboardCanvas.tsx  # TLDraw v1.29.2 wrapper ✅
│   │   ├── ArabicTextBox.tsx     # RTL-aware text box [file:85]
│   │   └── ExportButton.tsx      # Export to PNG
│   ├── workspace/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── WorkspaceSwitcher.tsx # Workspace dropdown
│   │   └── MemberList.tsx        # Workspace members
│   ├── ui/
│   │   ├── Button.tsx            # Reusable button
│   │   ├── Input.tsx             # Form input (RTL aware)
│   │   ├── Modal.tsx             # Dialog component
│   │   └── Toast.tsx             # Notifications
│   └── layout/
│       ├── Header.tsx            # Top navigation
│       └── Footer.tsx            # Footer with links
├── lib/
│   ├── apollo-client.ts          # Apollo Client config
│   ├── auth.ts                   # JWT verification
│   ├── prisma.ts                 # Prisma client singleton
│   ├── redis.ts                  # Redis client (embedded)
│   ├── storage.ts                # R2 upload helpers
│   └── yjs.ts                    # Yjs CRDT setup
├── hooks/
│   ├── useAuth.ts                # Authentication hook
│   ├── useWorkspace.ts           # Current workspace context
│   ├── useRealtime.ts            # WebSocket subscription
│   └── useRTL.ts                 # RTL detection hook
├── types/
│   ├── graphql.ts                # Generated GraphQL types
│   └── models.ts                 # TypeScript interfaces
└── styles/
    ├── globals.css               # Global styles (RTL support)
    └── editor.css                # Editor-specific styles
```

***

### **5.2 Key Frontend Component: WhiteboardCanvas.tsx ✅ REVISED**

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
// ✅ CHANGED: Import from TLDraw v1.29.2 (stable) instead of v2 beta
import { Tldraw, TldrawApp, TDDocument } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export function WhiteboardCanvas() {
  const { diagramId } = useParams();
  const [app, setApp] = useState<TldrawApp | null>(null);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const rTldrawApp = useRef<TldrawApp>();

  useEffect(() => {
    if (!app) return;

    // Load existing diagram from database
    loadDiagram(diagramId as string).then((doc) => {
      app.loadDocument(doc);
    });

    // Auto-save every 10 seconds [file:85]
    const saveInterval = setInterval(() => {
      const document = app.document;
      saveDiagram(diagramId as string, document);
      setLastSaved(new Date());
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [app, diagramId]);

  async function loadDiagram(id: string): Promise<TDDocument> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetDiagram($id: UUID!) {
            diagram(id: $id) {
              canvasState
            }
          }
        `,
        variables: { id },
      }),
    });

    const { data } = await response.json();
    return data.diagram.canvasState as TDDocument;
  }

  async function saveDiagram(id: string, document: TDDocument) {
    await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation UpdateDiagram($id: UUID!, $canvasState: JSON!) {
            updateDiagram(id: $id, canvasState: $canvasState) {
              id
              updatedAt
            }
          }
        `,
        variables: { id, canvasState: document },
      }),
    });
  }

  // ✅ NEW: Export diagram as PNG
  async function exportToPNG() {
    if (!app) return;

    const svg = await app.getSvg(app.selectedIds);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, 'diagram.png');
        formData.append('workspaceId', 'workspace-id'); // TODO: Get from context
        formData.append('title', 'Nahw Diagram');
        formData.append('canvasState', JSON.stringify(app.document));

        await fetch('/api/upload/diagram', {
          method: 'POST',
          body: formData,
        });
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  }

  return (
    <div className="relative h-screen w-full">
      {/* Auto-save indicator */}
      <div className="absolute top-4 right-4 z-50 bg-white/90 px-3 py-1 rounded-full text-sm">
        Last saved: {lastSaved.toLocaleTimeString()}
      </div>

      {/* Export button */}
      <button
        onClick={exportToPNG}
        className="absolute top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Export to PNG
      </button>

      {/* TLDraw v1.29.2 canvas */}
      {/* ✅ CHANGED: v1 API (simpler, stable) */}
      <Tldraw
        onMount={(app: TldrawApp) => {
          setApp(app);
          rTldrawApp.current = app;
        }}
        showPages={false}
        showMenu={true}
        showZoom={true}
        showStyles={true}
        showUI={true}
      />
    </div>
  );
}
```

**CHANGE JUSTIFICATION**: TLDraw v2 beta not production-ready (Dr. Sarah Chen, Jan 11, 9:12 PM). v1.29.2 has full Arabic RTL support via `textAlign: 'right'`. Refactor estimated 4 hours (Priya, Jan 13).[2]

***

## **6. DEPLOYMENT & DEVOPS**

### **6.1 Dockerfile (Multi-stage Build)**

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

***

### **6.2 fly.toml (Fly.io Production) ✅ REVISED**

```toml
app = "sanadflow-affine"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"
  AFFINE_SERVER_HOST = "0.0.0.0"
  AFFINE_SERVER_PORT = "3000"

[[services]]
  internal_port = 3000
  protocol = "tcp"
  auto_stop_machines = false  # Always-on [file:86]
  auto_start_machines = true
  min_machines_running = 1

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "5s"
    grace_period = "10s"
    restart_limit = 3

  [[services.http_checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "get"
    path = "/api/health"
    protocol = "http"
    restart_limit = 3

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

[[mounts]]
  source = "affine_data"
  destination = "/app/data"
  initial_size = "1GB"
```

***

## **7. TESTING STRATEGY**

### **7.1 Testing Pyramid**

| Test Type | Coverage Target | Tools | Execution Time |
|-----------|----------------|-------|----------------|
| **Unit Tests** | 70% | Jest, React Testing Library | <5 min |
| **Integration Tests** | 50% | Jest + Prisma | <10 min |
| **E2E Tests** | 30% critical paths | Playwright | <15 min |
| **RTL Tests** | 100% (50 cases) [1] | Custom Playwright | <5 min |
| **Load Tests** | 10 concurrent users [1] | k6 | <5 min |

***

### **7.2 RTL Test Suite**[1]

```typescript
// tests/rtl/arabic-input.test.ts

import { test, expect } from '@playwright/test';

test.describe('RTL (Right-to-Left) Arabic Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'ahmed@example.com');
    await page.fill('[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/workspace/**');
  });
  
  // Test 1-10: Pure Arabic text
  test('TC-001: Type pure Arabic paragraph', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill('بسم الله الرحمن الرحيم. الحمد لله رب العالمين.');
    
    const text = await editor.textContent();
    expect(text).toBe('بسم الله الرحمن الرحيم. الحمد لله رب العالمين.');
    
    // Verify cursor at end (not jumping to start)
    await editor.press('End');
    await editor.type(' والصلاة');
    const updatedText = await editor.textContent();
    expect(updatedText).toContain('والصلاة');
  });
  
  // Test 11-20: Mixed Arabic-English
  test('TC-011: Type mixed Arabic-English inline', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill('The word الإيمان means faith in English.');
    
    // Verify text direction auto-detection
    const direction = await editor.evaluate(el => window.getComputedStyle(el).direction);
    expect(direction).toBe('ltr'); // Overall direction based on first strong character
  });
  
  // Test 21-30: Whiteboard Arabic labels (TLDraw v1.29.2) ✅
  test('TC-021: Add Arabic text box to whiteboard', async ({ page }) => {
    await page.goto('http://localhost:3000/workspace/test-ws/whiteboard/new');
    
    // Wait for TLDraw canvas
    await page.waitForSelector('[data-testid="tldraw-canvas"]');
    
    // Add text box
    await page.click('[data-testid="tool-text"]');
    await page.click('[data-testid="tldraw-canvas"]', { position: { x: 200, y: 200 } });
    
    // Type Arabic
    await page.keyboard.type('فَاعِل');
    
    // Verify text renders RTL
    const textBox = page.locator('text=فَاعِل');
    expect(await textBox.textContent()).toBe('فَاعِل');
    
    // Verify text alignment (should be right-aligned)
    const textAlign = await textBox.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('right');
  });
  
  // ... (tests 31-50 similar pattern)
});

// Export test summary with pass/fail gate
test.afterAll(async () => {
  const results = test.info();
  const passRate = results.passed / results.total;
  
  console.log(`RTL Tests: ${results.passed}/${results.total} passed (${(passRate * 100).toFixed(1)}%)`);
  
  // ✅ GO/NO-GO GATE: 90% pass rate required [file:86]
  if (passRate < 0.9) {
    throw new Error(
      `RTL tests failed (${(passRate * 100).toFixed(1)}% < 90%). ABORT DEPLOYMENT.`
    );
  }
});
```

**GATE ENFORCEMENT**: If RTL tests <90%, Week 1 Day 2 checkpoint fails. Escalate to Dr. Chen + PM for abort decision.[2]

***

### **7.3 Load Test Specification ✅ NEW**

```javascript
// tests/load/10-concurrent-users.k6.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Load test configuration
export let options = {
  stages: [
    { duration: '1m', target: 5 },   // Ramp up to 5 users
    { duration: '3m', target: 10 },  // Hold 10 concurrent users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    // ✅ PRD requirement: p95 <2s [file:85]
    http_req_duration: ['p(95)<2000'], // 95% of requests <2 seconds
    // ✅ NEW: Error rate <5%
    http_req_failed: ['rate<0.05'],    // <5% errors
    // ✅ NEW: Memory growth monitoring (via health check)
    'checks{type:memory}': ['rate>0.95'], // 95% of memory checks pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://sanadflow-affine.fly.dev';

// Test scenario: Typical user workflow
export default function () {
  let response;
  let token;

  // ========================================
  // Scenario 1: Login (Authentication)
  // ========================================
  response = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify({
    email: `test-user-${__VU}@example.com`, // Unique per virtual user
    password: 'Test@1234',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'login successful': (r) => r.status === 200,
    'received JWT token': (r) => r.json('token') !== undefined,
  });

  errorRate.add(response.status !== 200);
  token = response.json('token');

  sleep(1); // Think time

  // ========================================
  // Scenario 2: Create Hadith Entry
  // ========================================
  response = http.post(`${BASE_URL}/api/graphql`, JSON.stringify({
    query: `
      mutation CreateHadith($input: CreateHadithInput!) {
        createHadith(input: $input) {
          id
          arabicText
          createdAt
        }
      }
    `,
    variables: {
      input: {
        workspaceId: 'test-workspace-id', // Pre-seeded workspace
        arabicText: 'حَدَّثَنَا مُحَمَّدُ بْنُ سِنَانٍ',
        englishTranslation: 'Muhammad ibn Sinan narrated to us...',
        grading: 'SAHIH',
      },
    },
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  check(response, {
    'hadith created': (r) => r.status === 200,
    'response time <2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status !== 200);

  sleep(2); // Think time

  // ========================================
  // Scenario 3: Search Hadiths (Full-text)
  // ========================================
  response = http.post(`${BASE_URL}/api/graphql`, JSON.stringify({
    query: `
      query SearchHadiths($input: SearchHadithsInput!) {
        searchHadiths(input: $input) {
          edges {
            node {
              id
              arabicText
              grading
            }
          }
        }
      }
    `,
    variables: {
      input: {
        workspaceId: 'test-workspace-id',
        query: 'محمد', // Common Arabic name (tests FTS)
        limit: 20,
      },
    },
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  check(response, {
    'search successful': (r) => r.status === 200,
    'search returned results': (r) => r.json('data.searchHadiths.edges').length > 0,
    'search response time <500ms': (r) => r.timings.duration < 500, // PRD requirement [file:85]
  });

  errorRate.add(response.status !== 200);

  sleep(3); // Think time

  // ========================================
  // Scenario 4: Health Check (Memory Monitor)
  // ========================================
  response = http.get(`${BASE_URL}/api/health`);

  const healthData = response.json();
  const memoryUsage = healthData.checks.memory.heap_used_mb;

  check(response, {
    'health check OK': (r) => r.status === 200,
    'memory <220MB': (r) => memoryUsage < 220, // ✅ GO/NO-GO gate [file:86]
  }, { type: 'memory' });

  errorRate.add(response.status !== 200);

  sleep(1);
}

// ========================================
// Test Summary (Post-execution)
// ========================================
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const errorPercent = data.metrics.errors.values.rate * 100;
  const memoryChecks = data.metrics['checks{type:memory}'].values.rate;

  console.log(`\n========================================`);
  console.log(`LOAD TEST RESULTS (10 Concurrent Users)`);
  console.log(`========================================`);
  console.log(`p95 Latency: ${p95.toFixed(0)}ms (Target: <2000ms)`);
  console.log(`Error Rate: ${errorPercent.toFixed(2)}% (Target: <5%)`);
  console.log(`Memory Checks: ${(memoryChecks * 100).toFixed(1)}% passed (Target: >95%)`);
  console.log(`========================================\n`);

  // ✅ GO/NO-GO DECISION LOGIC
  const passGate = p95 < 2000 && errorPercent < 5 && memoryChecks > 0.95;

  if (!passGate) {
    console.error(`❌ PERFORMANCE GATE FAILED`);
    console.error(`   - Extend Week 1 for optimization OR abort pilot`);
    console.error(`   - Escalate to Marcus Rodriguez (Eng Director)`);
  } else {
    console.log(`✅ PERFORMANCE GATE PASSED - Proceed to Week 2`);
  }

  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}
```

**EXECUTION**:
```bash
# Week 2 Day 6 (Jan 20): Run load test
k6 run --env BASE_URL=https://sanadflow-affine.fly.dev tests/load/10-concurrent-users.k6.js

# Output thresholds automatically enforced by k6
# Exit code 0 = pass, 1 = fail (CI/CD friendly)
```

**APPROVAL**: Marcus Rodriguez (Jan 11, 9:32 PM) - Detailed k6 specification added with 3 thresholds (latency, errors, memory).[2]

***

## **8. MONITORING & OBSERVABILITY ✅ REVISED**

### **8.1 BetterStack Log Ingestion ✅ NEW**

```yaml
# betterstack-agent.yml (deployed to VM3)

sources:
  # PostgreSQL slow query logs
  - name: postgresql-slow-queries
    type: files
    paths:
      - /var/log/postgresql/postgresql-*.log
    parser: postgres
    
  # Application logs (Next.js)
  - name: nextjs-app
    type: files
    paths:
      - /var/log/affine/app.log
    parser: json
    
  # PgBouncer logs
  - name: pgbouncer
    type: files
    paths:
      - /var/log/pgbouncer/pgbouncer.log
    parser: syslog

# ✅ NEW: Filter for slow queries (>500ms) [file:85]
filters:
  - name: slow-queries-only
    source: postgresql-slow-queries
    type: grep
    pattern: 'duration: [5-9][0-9]{2}\.[0-9]+ ms|duration: [0-9]{4,}\.[0-9]+ ms'
    # Matches: 500-999ms or 1000+ms
    
  - name: error-logs-only
    source: nextjs-app
    type: grep
    pattern: '"level":"error"|"level":"fatal"'

# Alerts (Slack webhook)
alerts:
  - name: slow-query-spike
    condition: count(slow-queries-only) > 10 per 5min
    action: slack
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    message: "⚠️ Slow query spike: {{count}} queries >500ms in 5min"
    
  - name: error-rate-high
    condition: count(error-logs-only) > 100 per hour
    action: slack
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    message: "🚨 Error rate high: {{count}} errors in past hour"
```

**DEPLOYMENT**:
```bash
# Week 1 Day 3: Install BetterStack agent on VM3
curl -sSL https://logs.betterstack.com/install.sh | sudo bash
sudo cp betterstack-agent.yml /etc/betterstack/agent.yml
sudo systemctl start betterstack-agent
sudo systemctl enable betterstack-agent
```

**APPROVAL**: Dr. Sarah Chen (Jan 11, 9:45 PM) - Added slow query logging config + BetterStack ingestion.[1]

***

### **8.2 Cloudflare R2 CORS Policy ✅ RESOLVED Q-004**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://sanadflow-affine.fly.dev"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST"
      ],
      "AllowedHeaders": [
        "*"
      ],
      "MaxAgeSeconds": 3600,
      "ExposeHeaders": [
        "ETag"
      ]
    }
  ]
}
```

**SECURITY CHANGE**: Restricted CORS from `*.fly.dev` (insecure) to exact subdomain `sanadflow-affine.fly.dev` to prevent hotlinking by other Fly.io apps (Marcus Rodriguez, Jan 11, 9:38 PM).

**DEPLOYMENT**:
```bash
# Week 1 Day 1: Configure R2 bucket CORS
aws s3api put-bucket-cors \
  --bucket sanadflow-media-prod \
  --cors-configuration file://r2-cors.json \
  --endpoint-url https://[account-id].r2.cloudflarestorage.com
```

***

## **9. OPEN QUESTIONS & RESOLUTIONS ✅ UPDATED**

| ID | Question | Status | Owner | Resolution |
|----|----------|--------|-------|------------|
| **Q-001** | PostgreSQL GIN indexes for Arabic FTS: Native support or custom plugin? | ✅ **RESOLVED** | Priya | Tested locally with 10 hadiths. Native `to_tsvector('arabic', ...)` works with ~70% accuracy (acceptable for pilot). Post-pilot: Custom Arabic dictionary or ElasticSearch ($10/month). |
| **Q-002** | PostgreSQL `shared_buffers`: 200MB safe for 256MB RAM? | ✅ **RESOLVED** | Dr. Chen | **NO**. Reduced to 64MB (25% rule). Performance trade-off accepted for stability. Resolved Jan 11, 9:05 PM. |
| **Q-003** | PgBouncer session mode: Does it break Prisma transactional queries? | ✅ **RESOLVED** | Marcus | Session mode **permanent** for pilot (not Week 3+ migration). Guaranteed Prisma compatibility. Re-evaluate only if connection pool >80%. Resolved Jan 11, 9:25 PM. |
| **Q-004** | Cloudflare R2 CORS: Allow `*.fly.dev` or specific subdomain? | ✅ **RESOLVED** | Priya | **Specific subdomain only** (`sanadflow-affine.fly.dev`). Security risk mitigated. Deployed Day 1 (Jan 13). Resolved Jan 11, 9:38 PM. |
| **Q-005** | TLDraw v2 beta vs. v1 stable: Which for production? | ✅ **RESOLVED** | Dr. Chen | **v1.29.2 stable**. v2 beta not production-ready. Full RTL support confirmed in v1. Downgrade task: 4 hours (Priya, Jan 13). Resolved Jan 11, 9:12 PM. |

***

## **10. GO-LIVE GATES & APPROVAL PROCESS ✅ NEW SECTION**

### **10.1 Week 1 Day 3 Checkpoint (January 15, 5:00 PM SGT)**

Three mandatory gates must pass before proceeding to Week 2:[2]

***

#### **GATE 1: RTL Testing (Day 2)**

**Criteria**:
- [ ] **45/50 tests pass (90% pass rate)**[2]
- [ ] All critical tests pass:
  - Pure Arabic paragraph (TC-001 to TC-010)
  - Mixed Arabic-English inline (TC-011 to TC-020)
  - Whiteboard Arabic text boxes (TC-021 to TC-030)
- [ ] Screen recordings of all failures uploaded to GitHub Issues
- [ ] Test report generated with pass/fail breakdown

**Pass Threshold**: ≥90% (45/50 tests)  
**Caution Zone**: 80-89% (40-44 tests) → Evaluate workarounds  
**Fail Threshold**: <80% (<40 tests) → **ABORT PILOT**

**IF FAIL**:
```
Escalation Path:
┌──────────────────────────────────────────────┐
│ T+0:00: Priya documents all failures (2 hrs) │
│ T+2:00: Dr. Chen reviews failures (1 hr)     │
│ T+3:00: Joint recommendation to PM           │
│         Option A: Fix critical bugs (1 day)  │
│         Option B: Abort, pivot to Notion Plus│
│ T+4:00: PM makes GO/NO-GO decision           │
│ T+5:00: If NO-GO: Marcus approves budget for │
│         Notion Plus ($30/month) [file:85]    │
└──────────────────────────────────────────────┘
```

**Deliverables**:
- RTL Test Report (HTML, JSON summary)
- Screen recordings (Loom, uploaded to docs/)
- Recommendation memo to PM

***

#### **GATE 2: Performance Baseline (Day 3)**

**Criteria**:
- [ ] **p95 latency <2s** with 5 concurrent users[2]
- [ ] **Memory usage <220MB** on VM1 (AFFiNE app, leaves 36MB for OS)
- [ ] **Zero database connection errors** (no PgBouncer queue exhaustion)
- [ ] PostgreSQL CPU <80% sustained
- [ ] Health check returns HTTP 200 (all checks pass)

**Pass Threshold**: All 5 criteria met  
**Fail Threshold**: Any 1 criterion fails → Extend or abort

**IF FAIL**:
```
Escalation Path:
┌──────────────────────────────────────────────┐
│ T+0:00: Priya profiles memory/CPU (4 hrs)    │
│ T+4:00: Dr. Chen reviews optimization options│
│         - Add indexes                        │
│         - Tune PostgreSQL work_mem           │
│         - Enable Redis caching               │
│ T+5:00: If fixable in 1 day: Extend to Day 4│
│ T+5:30: If not fixable: Marcus decides:      │
│         Option A: Upgrade Fly.io to 512MB    │
│                   ($5/month) [file:86]       │
│         Option B: Abort, use Railway         │
│                   ($5/month)                 │
│         Option C: Abort, use Notion Plus     │
│                   ($30/month)                │
└──────────────────────────────────────────────┘
```

**Deliverables**:
- Performance baseline report (Locust HTML)
- Memory profiling charts (Prometheus screenshots)
- Optimization recommendations (if needed)

***

#### **GATE 3: Deployment Smoke Test (Day 3)**

**Criteria**:
- [ ] **Health check returns HTTP 200** (`curl https://sanadflow-affine.fly.dev/api/health`)
- [ ] **User can sign up** (new account via `/signup`)
- [ ] **User can create workspace** (GraphQL mutation successful)
- [ ] **User can create hadith** (database insert + FTS index works)
- [ ] **Real-time cursors work** (2-user test with WebSocket)
- [ ] **Backup job runs successfully** (manual trigger via `/api/backup/trigger`)

**Pass Threshold**: All 6 smoke tests pass  
**Fail Threshold**: Any critical test fails (signup, database, backup)

**IF FAIL**:
```
Escalation Path:
┌──────────────────────────────────────────────┐
│ T+0:00: Priya debugs logs (2 hrs)            │
│         Check: Fly.io logs, Aiven metrics    │
│ T+2:00: If Fly.io platform issue:            │
│         → Escalate to Fly.io support         │
│         → Activate Koyeb+Aiven fallback      │
│            (2-hour RTO) [file:86]            │
│ T+2:30: If code bug:                         │
│         → Roll back deployment               │
│         → Fix locally, re-deploy             │
│ T+3:00: PM approves 1-day delay for fixes    │
│         (extend Week 1 to 6 days)            │
└──────────────────────────────────────────────┘
```

**Deliverables**:
- Smoke test results (pass/fail checklist)
- Deployment logs (Fly.io, Docker)
- Runbook updates (if new issues found)

***

### **10.2 Final Approval Process**

```
┌─────────────────────────────────────────────┐
│  ALL 3 GATES PASS                           │
│  ✅ RTL: 45/50 tests (90%)                  │
│  ✅ Performance: p95 1.8s, memory 210MB     │
│  ✅ Deployment: All smoke tests pass        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  APPROVALS REQUIRED                         │
│  1. Priya Patel (Tech Lead) - Gate results │
│  2. Dr. Sarah Chen (Architect) - Technical  │
│  3. Marcus Rodriguez (Eng Director) - Go    │
│  4. PM (Product Manager) - Final GO/NO-GO   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  TDD v2.0 FINAL → v3.0 PRODUCTION           │
│  - Status changed to "DEPLOYED"             │
│  - Week 2 sprint begins (Jan 20)            │
│  - Load testing (10 concurrent users)       │
│  - Data migration (50 hadiths)              │
└─────────────────────────────────────────────┘
```

**NO UNILATERAL ABORT**: Any single gate failure requires PM sign-off before aborting pilot (pilot costs $0, so flexibility to retry).[2]

***

## **11. WEEK 1 IMPLEMENTATION CHECKLIST ✅ UPDATED**

### **Day 1 (Jan 13): Local Development Setup**
- [ ] Clone AFFiNE repo fork from organization GitHub
- [ ] Install dependencies: `npm ci`
- [ ] ✅ **NEW**: Downgrade TLDraw to v1.29.2 (4 hours, Priya)
  ```bash
  npm uninstall @tldraw/tldraw
  npm install @tldraw/tldraw@1.29.2
  ```
- [ ] Refactor `WhiteboardCanvas.tsx` for v1 API (1 hour)
- [ ] Run `docker-compose up -d` (Postgres, Redis, PgBouncer)
- [ ] Run `npx prisma migrate deploy --name init`
- [ ] Seed database with test data: `npx prisma db seed`
- [ ] Start Next.js dev server: `npm run dev`
- [ ] Verify http://localhost:3000 loads (smoke test)

### **Day 2 (Jan 14): RTL Testing**
- [ ] Run Playwright RTL test suite (50 tests): `npm run test:rtl`
- [ ] Document failures in GitHub Issue #12 ("RTL Test Results - Week 1")
- [ ] Capture screen recordings of all failures (Loom)
- [ ] Calculate pass rate: `(passed / 50) × 100%`
- [ ] Generate HTML report: `npx playwright show-report`
- [ ] **GATE 1 DECISION**: If <90%, escalate to Dr. Chen + PM[1]
- [ ] Upload test artifacts to `docs/rtl-testing/week1/`

### **Day 3 (Jan 15): Fly.io Deployment**
- [ ] Create Fly.io account, install `flyctl`
- [ ] Run `flyctl launch --ha=false` (single VM initially)
- [ ] Configure `fly.toml` with 256MB RAM settings
- [ ] Set secrets:
  ```bash
  flyctl secrets set DATABASE_URL="postgresql://..."
  flyctl secrets set REDIS_URL="redis://localhost:6379"
  flyctl secrets set JWT_SECRET="..."
  flyctl secrets set R2_ACCESS_KEY="..."
  flyctl secrets set R2_SECRET_KEY="..."
  ```
- [ ] ✅ **NEW**: Configure Cloudflare R2 CORS (restrict to exact subdomain)
  ```bash
  aws s3api put-bucket-cors \
    --bucket sanadflow-media-prod \
    --cors-configuration file://r2-cors.json \
    --endpoint-url https://[account-id].r2.cloudflarestorage.com
  ```
- [ ] ✅ **NEW**: Install BetterStack log agent on VM3
  ```bash
  curl -sSL https://logs.betterstack.com/install.sh | sudo bash
  sudo cp betterstack-agent.yml /etc/betterstack/betterstack.yml
  sudo systemctl enable betterstack-agent
  sudo systemctl start betterstack-agent
  ```
- [ ] Deploy: `flyctl deploy --strategy=immediate`
- [ ] Verify deployment:
  ```bash
  flyctl status
  flyctl logs --app sanadflow-affine
  ```
- [ ] Test health endpoint:
  ```bash
  curl https://sanadflow-affine.fly.dev/api/health
  # Expected: HTTP 200 with JSON status
  ```
- [ ] **GATE 2 DECISION**: Run performance baseline test (5 users, 5 min)
  ```bash
  k6 run --vus 5 --duration 5m tests/load/baseline.k6.js
  ```
- [ ] Check memory usage via health endpoint:
  ```bash
  curl https://sanadflow-affine.fly.dev/api/health | jq '.checks.memory.heap_used_mb'
  # Expected: <220MB
  ```
- [ ] **GATE 3 DECISION**: Run smoke tests (6 tests, ~15 min)
  ```bash
  npm run test:smoke -- --config playwright.smoke.config.ts
  ```
- [ ] **CRITICAL CHECKPOINT (5:00 PM SGT)**: All 3 gates pass?
  - If YES: Notify team in Slack, proceed to Day 4-5
  - If NO: Execute escalation path (Section 10.1)

### **Day 4 (Jan 16): Data Migration & Backup**
- [ ] Import 50 sample hadiths via GraphQL mutations:
  ```bash
  node scripts/seed-hadiths.ts --count 50 --workspace-id <uuid>
  ```
- [ ] Create 10 narrator profiles:
  ```bash
  node scripts/seed-narrators.ts --count 10 --workspace-id <uuid>
  ```
- [ ] Draw 5 Nahw diagrams in whiteboard (manual testing)
  - [ ] I'rab tree for: "ضَرَبَ زَيْدٌ عَمْرًا"
  - [ ] I'rab tree for: "إِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ"
  - [ ] Sentence flow diagram (3 clauses)
  - [ ] Narrator chain diagram (5 narrators)
  - [ ] Fiqh ruling tree (4 branches)
- [ ] Test R2 offloading (simulate 2.6GB database):
  ```bash
  node scripts/test-r2-offload.ts --dummy-data-size 2.6GB
  # Expected: Next diagram uploads to R2, not PostgreSQL
  ```
- [ ] Configure GitHub Actions backup workflow:
  ```yaml
  # .github/workflows/daily-backup.yml
  name: Daily PostgreSQL Backup
  on:
    schedule:
      - cron: '0 18 * * *'  # 2 AM SGT (UTC+8)
    workflow_dispatch:
  
  jobs:
    backup:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Install PostgreSQL client
          run: sudo apt-get install -y postgresql-client
        
        - name: Run pg_dump
          env:
            DATABASE_URL: ${{ secrets.DATABASE_URL }}
          run: |
            pg_dump --format=directory --jobs=2 --compress=9 \
                    --file=backup-$(date +%Y%m%d) "$DATABASE_URL"
            tar -czf backups/daily/affine-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)
        
        - name: Commit and push
          run: |
            git config user.name "Backup Bot"
            git config user.email "backup@sanadflow.local"
            git add backups/
            git commit -m "Backup $(date +%Y-%m-%d)"
            git push
        
        - name: Notify Slack
          run: |
            SIZE=$(du -sh backups/daily/affine-$(date +%Y%m%d).tar.gz | awk '{print $1}')
            curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
                 -d '{"text": "✅ Backup completed: '"$SIZE"'"}'
  ```
- [ ] Run manual backup test:
  ```bash
  npx tsx scripts/backup.ts --target github
  # Verify backup appears in GitHub repo within 5 minutes
  ```

### **Day 5 (Jan 17): Documentation & Handoff**
- [ ] Update `docs/deployment-guide.md` with actual Fly.io commands
- [ ] Record video walkthrough: "How to Deploy SanadFlow" (10 min, upload to YouTube unlisted)
- [ ] Create GitHub Project board with Week 2 tasks:
  ```
  Week 2 Sprint (Jan 20-24):
  ├── Load test with 10 concurrent users (Day 6-7)
  ├── Performance optimization (Day 8-9)
  ├── User onboarding dry run (Day 10)
  └── Training session prep (presentations, videos)
  ```
- [ ] Onboard Jordan (backup engineer) via Slack call (30 min):
  - Share Fly.io credentials (read-only)
  - Walk through deployment architecture
  - Share runbook for common incidents
- [ ] Write Week 1 retrospective (Google Doc):
  - What went well
  - What needs improvement
  - Blockers encountered
  - Risk mitigation suggestions
- [ ] Schedule Week 2 kickoff meeting (Monday Jan 20, 9 AM SGT)

***

## **12. RISK REGISTER ✅ UPDATED**

### **12.1 Technical Risks**

| Risk ID | Description | Probability | Impact | Mitigation | Owner | Status |
|---------|-------------|-------------|--------|-----------|-------|--------|
| **TR-001** | **PostgreSQL 256MB insufficient** (query memory bloat) | Medium | High | Reduced `shared_buffers` to 64MB, Week 2 query profiling [1] | Priya | ✅ Mitigated |
| **TR-002** | **Fly.io concurrent connection limits** (app exhausts file descriptors) | Low | High | Monitor `lsof -p`, set `ulimit -n 4096` in Dockerfile | Priya | Open |
| **TR-003** | **Redis memory eviction** during real-time sync | Medium | Medium | Monitor evictions via `/api/health`, increase TTL for critical keys | Engineering | Open |
| **TR-004** | **R2 upload timeout** (>3s for 2MB PNG) | Low | Low | Implement async upload queue, user sees "uploading..." [1] | Engineering | Open |
| **TR-005** | **GitHub Actions timeout** (backup script >6 hours) | Low | Medium | Compress dumps to <1GB, parallel split uploads | Admin 1 | Open |
| **TR-006** | **PgBouncer deadlock** (connection starvation) | Low | High | Monitor `pgbouncer -R`, drain connections on restart | Priya | Open |
| **TR-007** ✅ **NEW** | **TLDraw v1 incompatibility** with existing AFFiNE code | Low | Medium | 4-hour refactor budget (Day 1), test with 5 diagrams (Day 4) | Priya | Open |

### **12.2 Operational Risks**

| Risk ID | Description | Probability | Impact | Mitigation | Owner | Status |
|---------|-------------|-------------|--------|-----------|-------|--------|
| **OR-001** | **Admin burnout** (2 students can't sustain on-call) | High | Medium | 3-tier escalation, <5 hrs/week budget, Jordan backup [1] | Marcus | ✅ Mitigated |
| **OR-002** | **Low user adoption** (<5 active of 10 students) | Medium | High | Mandatory Week 3 training, incentivize contributions | PM | Open |
| **OR-003** | **Accidental data deletion** (student deletes crucial hadith) | Low | Medium | Implement 30-day trash bin, version history [2] | Engineering | Open |
| **OR-004** | **Backup corruption** (undetected until restore needed) | Low | Critical | Monthly restore drills to staging [1] | Admin 1 | Open |
| **OR-005** | **Network outage** (entire Fly.io region down) | Very Low | Critical | RTO 4 hours, failover to Koyeb+Aiven [1] | Architect | Open |
| **OR-006** ✅ **NEW** | **Week 1 timeline slip** (23 tasks in 5 days) | Medium | Medium | Jordan backup (4 hours), de-scope data migration if needed, 1-day extension approved | Priya | Open |

***

## **13. DEPENDENCIES & ASSUMPTIONS**

### **13.1 External Dependencies**

| Dependency | Provider | Criticality | Mitigation if Unavailable |
|------------|----------|-------------|---------------------------|
| **Fly.io Platform** | Fly.io | Critical | Koyeb+Aiven fallback (2-hour RTO) [1] |
| **PostgreSQL 16** | Fly.io / Aiven | Critical | Fly.io Postgres or Aiven free tier |
| **Cloudflare R2** | Cloudflare | Medium | Store all diagrams in PostgreSQL (limits to 500 diagrams) |
| **GitHub Actions** | GitHub | Medium | Local cron job for backups (30-min setup) |
| **BetterStack Logs** | BetterStack | Low | Fly.io native logs (less features) |
| **TLDraw v1.29.2** | OSS (npm) | Medium | Fork repository if npm registry down |

### **13.2 Key Assumptions**

| Assumption | Validation Method | If False |
|------------|-------------------|----------|
| **Fly.io Singapore region available** | Check status.fly.io daily | Deploy to sin-b (backup region) |
| **AFFiNE self-hosted supports 10 users** | Load test Week 2 (Day 6-7) | Upgrade to AFFiNE Cloud ($20/month) |
| **Arabic FTS 70% accuracy acceptable** | User feedback Week 3 | Implement ElasticSearch ($10/month) |
| **Student admins can maintain infrastructure** | Week 3 onboarding | Hire part-time DevOps ($500/month) |
| **50 hadiths cataloged by Week 4** | Track in GitHub Project | Reduce target to 30 hadiths (MVP) |

***

## **14. DOCUMENT SIGN-OFF**

### **14.1 Approval Status**

```
┌─────────────────────────────────────────────┐
│  FINAL DECISION: ✅ APPROVED                 │
│  Status: Ready for Week 1 Implementation    │
└─────────────────────────────────────────────┘

Approved By:
  ✅ Dr. Sarah Chen (System Architect)
     Date: Jan 12, 2026, 11:45 AM SGT
     Comments: "All technical concerns resolved. PostgreSQL 
                config safe, TLDraw downgrade appropriate."

  ✅ Marcus Rodriguez (Engineering Director)
     Date: Jan 12, 2026, 11:50 AM SGT
     Comments: "Go-live gates well-defined. Load test spec 
                comprehensive. Approve with Jordan as backup."

  ✅ Priya Patel (Tech Lead)
     Date: Jan 12, 2026, 12:00 PM SGT
     Comments: "All 10 revisions incorporated. Ready for 
                Day 1 kickoff (Jan 13, 9 AM SGT)."

Conditions Met:
  ✅ PostgreSQL shared_buffers: 64MB (was 200MB)
  ✅ PgBouncer session mode: Permanent (no Week 3 migration)
  ✅ TLDraw downgraded: v1.29.2 stable (was v2 beta)
  ✅ Load test specification: k6 scripts with thresholds
  ✅ Monitoring: PostgreSQL slow query logging + BetterStack
  ✅ Go-Live Gates: 3 gates with escalation matrix defined
  ✅ Open Questions: All 5 resolved (Q-001 through Q-005)
  ✅ Backup Engineer: Jordan assigned for Day 3-5 support
  ✅ Week 1 Checklist: 3 new tasks added (23 total)
  ✅ CORS Security: R2 restricted to exact subdomain
```

***

### **14.2 Next Milestones**

| Milestone | Date | Deliverable | Owner |
|-----------|------|-------------|-------|
| **Week 1 Kickoff** | Jan 13, 9 AM SGT | Team briefing (30 min) | Priya |
| **RTL Gate 1** | Jan 14, 5 PM SGT | RTL test report (90% threshold) | Priya |
| **Performance Gate 2** | Jan 15, 3 PM SGT | Baseline metrics (p95 <2s) | Priya |
| **Deployment Gate 3** | Jan 15, 5 PM SGT | Smoke tests pass (6/6) | Priya |
| **Week 1 Retrospective** | Jan 17, 5 PM SGT | Lessons learned doc | Priya |
| **Week 2 Load Testing** | Jan 20-21 | 10 concurrent users (k6) | Priya |
| **Week 3 User Onboarding** | Jan 27-31 | 3 training sessions | PM |
| **Pilot Go-Live** | Feb 3, 2026 | Production announcement | PM |

***

### **14.3 Change Control**

**Post-Approval Changes Require**:
- **Minor changes** (typos, clarifications): Slack notification to team
- **Medium changes** (new tasks, timeline adjustments): Priya approval + Slack post
- **Major changes** (architecture, scope, gates): Re-approval from Dr. Chen + Marcus

**Living Document Policy**: This TDD will be updated weekly based on implementation learnings. Version history tracked in Git:
```bash
git log --oneline -- docs/TDD_v2.0_FINAL.md
```

***

## **15. APPENDICES**

### **Appendix A: Full GraphQL Schema** (120 lines)

```graphql
# Complete GraphQL schema for SanadFlow API
# See Section 4.1 for excerpt

scalar DateTime
scalar JSON
scalar UUID

# ... (full schema available in GitHub repo)
# Path: src/graphql/schema.graphql
# Lines: 320 total (types, inputs, queries, mutations, subscriptions)
```

**Note**: Full schema not included in TDD to maintain readability. See repository for complete type definitions.

***

### **Appendix B: Prisma Schema** (Complete)

```prisma
// prisma/schema.prisma
// Complete database schema with all models

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... (full Prisma schema available in GitHub repo)
// Path: prisma/schema.prisma
// Lines: 450 total (12 models)
```

***

### **Appendix C: Docker Compose (Local Development)**

```yaml
# docker-compose.yml (complete)
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: affine_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 100mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
  
  pgbouncer:
    image: pgbouncer/pgbouncer:1.21
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: postgres
      DATABASES_PASSWORD: dev_password
      DATABASES_DBNAME: affine_dev
      PGBOUNCER_POOL_MODE: session
      PGBOUNCER_MAX_CLIENT_CONN: 50
      PGBOUNCER_DEFAULT_POOL_SIZE: 5
    ports:
      - "6432:6432"
    volumes:
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro
    depends_on:
      postgres:
        condition: service_healthy
  
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:dev_password@pgbouncer:6432/affine_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      NEXT_PUBLIC_WS_URL: ws://localhost:3000
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      pgbouncer:
        condition: service_started
      redis:
        condition: service_healthy
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

***

### **Appendix D: Runbook (Incident Response)** (Excerpt)

```markdown
# SanadFlow Runbook - Incident Response Procedures

## Incident 1: Database Connection Errors

**Symptoms**:
- Users see "Failed to connect to database" error
- Health check shows `database: error`
- Logs show: `FATAL: sorry, too many clients already`

**Diagnosis**:
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check PgBouncer status
psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SHOW POOLS;"
```

**Resolution**:
1. Restart PgBouncer: `flyctl ssh console -C "supervisorctl restart pgbouncer"`
2. If still failing, increase pool size in `pgbouncer.ini` (default_pool_size: 5 → 10)
3. Deploy change: `flyctl deploy`
4. Monitor for 30 minutes

**Escalation**: If persists >30 min, contact Priya (Tech Lead)

---

## Incident 2: Out of Memory (OOM)

**Symptoms**:
- VM1 (app) crashes with exit code 137
- Fly.io logs show: `Process killed (SIGKILL)`
- Health check shows memory >240MB

**Diagnosis**:
```bash
# Check memory usage
curl https://sanadflow-affine.fly.dev/api/health | jq '.checks.memory'

# Check for memory leaks (locally)
node --inspect scripts/profile-memory.js
```

**Resolution**:
1. Immediate: Restart app VM: `flyctl restart --app sanadflow-affine`
2. Short-term: Enable swap (add 128MB): Edit `fly.toml`, set `swap_size_mb = 128`
3. Long-term: Optimize queries (Week 2), upgrade to 512MB ($5/month)

**Escalation**: If OOM >3 times/day, escalate to Marcus (Eng Director) for VM upgrade approval

... (full runbook 50+ pages available in GitHub repo)
```

***

### **Appendix E: Backup & Restore Procedures**

```bash
# ========================================
# BACKUP PROCEDURES
# ========================================

# 1. Manual Backup (GitHub)
npx tsx scripts/backup.ts --target github --compress gzip
# Output: backups/daily/affine-20260112.tar.gz (committed to repo)

# 2. Manual Backup (Cloudflare R2)
npx tsx scripts/backup.ts --target r2 --bucket sanadflow-backups
# Output: s3://sanadflow-backups/full-dump-20260112.tar.gz

# 3. Verify Backup Integrity
cd backups/daily/
tar -tzf affine-20260112.tar.gz | head -n 20
md5sum affine-20260112.tar.gz > affine-20260112.tar.gz.md5

# ========================================
# RESTORE PROCEDURES
# ========================================

# Scenario 1: Restore from GitHub (24-hour-old backup)
# Step 1: Download backup from GitHub repo
git clone https://github.com/sanadflow/backups.git
cd backups/daily/
tar -xzf affine-20260111.tar.gz

# Step 2: Drop and recreate database (DESTRUCTIVE)
psql $DATABASE_URL -c "DROP DATABASE affine_production WITH (FORCE);"
psql $DATABASE_URL -c "CREATE DATABASE affine_production;"

# Step 3: Restore schema and data
pg_restore --clean --if-exists --dbname=$DATABASE_URL backup-20260111/

# Step 4: Verify restoration (spot-check 10 records)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM hadiths;"
psql $DATABASE_URL -c "SELECT title FROM documents LIMIT 5;"

# Step 5: Update AFFiNE app (restart)
flyctl restart --app sanadflow-affine

# Estimated RTO: 2-4 hours
# Estimated RPO: 24 hours (last daily backup)

# ========================================
# Scenario 2: Restore from R2 (7-day-old backup)
# (Similar steps, download from R2 instead of GitHub)
aws s3 cp s3://sanadflow-backups/full-dump-20260105.tar.gz . --region auto
# ... (rest of steps identical)
```

***

## **16. GLOSSARY**

| Term | Definition |
|------|------------|
| **ADD** | Architecture Decision Document (defines infrastructure choices) |
| **AOF** | Append-Only File (Redis persistence mechanism) |
| **CRDT** | Conflict-free Replicated Data Type (real-time collaboration algorithm) |
| **FTS** | Full-Text Search (PostgreSQL text search capability) |
| **GIN Index** | Generalized Inverted Index (PostgreSQL index type for arrays, JSON, FTS) |
| **OOM** | Out of Memory (process killed due to RAM exhaustion) |
| **PITR** | Point-in-Time Recovery (restore database to specific timestamp) |
| **PRD** | Product Requirements Document (defines features and acceptance criteria) |
| **RTL** | Right-to-Left (text direction for Arabic, Hebrew) |
| **RTO** | Recovery Time Objective (how fast to recover from disaster) |
| **RPO** | Recovery Point Objective (how much data loss acceptable) |
| **SSR** | Server-Side Rendering (Next.js pre-renders pages on server) |
| **TDD** | Technical Design Document (this document) |
| **VM** | Virtual Machine (Fly.io compute unit) |
| **WAL** | Write-Ahead Log (PostgreSQL transaction log for recovery) |

***

## **17. CONTACT INFORMATION**

| Role | Name | Email | Slack | Phone | Availability |
|------|------|-------|-------|-------|--------------|
| **Tech Lead (DRI)** | Priya Patel | priya@sanadflow.org | @priya | +65-9123-4567 | Mon-Fri 9 AM-7 PM SGT |
| **System Architect** | Dr. Sarah Chen | sarah.chen@tech.edu | @sarah | +1-415-555-0199 | Mon-Fri 9 AM-5 PM PST |
| **Eng Director** | Marcus Rodriguez | marcus@sanadflow.org | @marcus | +1-650-555-0142 | Mon-Fri 8 AM-6 PM PST |
| **Admin 1 (Primary)** | Ahmed Al-Rashid | ahmed@students.edu | @ahmed | +971-50-123-4567 | Daily 7-9 PM GST |
| **Backup Engineer** | Jordan Kim | jordan@sanadflow.org | @jordan | +65-8234-5678 | On-call (Day 3-5) |
| **Product Manager** | [Your Name] | pm@sanadflow.org | @pm | [Your Phone] | 24/7 (pilot phase) |

***

**END OF TECHNICAL DESIGN DOCUMENT v2.0 (FINAL)**

***

**Document Metadata**:
- **File**: `TDD_v2.0_FINAL.md`
- **Word Count**: 14,230 words
- **Page Count**: ~85 pages (printed)
- **Last Modified**: January 12, 2026, 12:00 PM SGT
- **Git Commit**: `a3f7d9e` ("TDD v2.0 FINAL - All review feedback incorporated")
- **Next Review**: January 19, 2026 (Week 2 retrospective)

***
