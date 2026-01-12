# **PRODUCT REQUIREMENTS DOCUMENT (PRD) v3.0**
## **SanadFlow Study Hub - Islamic Sciences Collaborative Platform**

**Document Type**: Product Requirements Document v3.0  
**Product Manager**: BMADv5 Product Team  
**System Architect**: Dr. Sarah Chen  
**Engineering Director**: Marcus Rodriguez  
**Date**: January 11, 2026  
**Status**: APPROVED  
**Target Release**: Week 4 (February 2, 2026)

---

## **REVISION HISTORY**

| Version | Date | Changes | Approver |
|---------|------|---------|----------|
| v1.0 | Jan 11, 2026 | Initial draft | PM |
| v2.0 | Jan 11, 2026 | Fly.io architecture (deprecated) | PM + Architect |
| v3.0 | Jan 11, 2026 | Supabase + Vercel architecture (Fly.io free tier eliminated) | PM + Architect + Eng Director |
| **v3.1** | Jan 11, 2026 | **Perplexity verification amendments** (bandwidth limits, backup strategy, RLS security) | PM + Architect + Eng Director |

**Key Changes in v3.0:**
- ⚠️ **Infrastructure Migration**: Fly.io → Supabase + Vercel (Fly.io eliminated free tier April 2024)
- ⚠️ **Database**: Fly Postgres → Supabase PostgreSQL (500MB free, built-in pooler)
- ⚠️ **Realtime**: y-websocket → Supabase Realtime Broadcast + custom Yjs provider
- ⚠️ **Hosting**: 3x 256MB VMs → Vercel Serverless (Edge Runtime)
- ⚠️ **Cache**: Embedded Redis → Supabase Edge Functions cache
- ✅ **Zero-cost pilot**: Maintained via Supabase + Vercel free tiers
- ✅ **Arabic FTS**: pg_trgm on Supabase PostgreSQL (same approach)
- ✅ **Keep-alive**: GitHub Actions cron to prevent Supabase 7-day inactivity pause

---

## **1. PRODUCT OVERVIEW**

### **1.1 Product Vision**
Build a production-grade, zero-pilot-cost knowledge management platform enabling 5-10 Islamic Sciences students to collaboratively study Nahw (Arabic Grammar), Hadith, and Usul al-Fiqh with real-time editing, visual diagramming, and structured databases—without compromising on Arabic RTL text support.

### **1.2 Problem Statement**
Current solutions fail our use case:
- **Notion**: Block limits (1,000 blocks with guests) + RTL auto-switching bugs + $180/6-month cost
- **AFFiNE Cloud**: 3-member workspace limit on free tier
- **Fly.io**: ❌ **Free tier eliminated** (trial only: $5 credit, 30 days)
- **PlanetScale**: ❌ **Free tier eliminated** (retired April 8, 2024)
- **Railway**: $5/month minimum (not truly free)
- **Render**: 15-minute spin-down + 90-day database deletion

### **1.3 Success Criteria**
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Pilot Cost** | $0/month | Invoice tracking |
| **Steady-State Budget** | $5-10/month | Contingency for tier upgrades |
| **Page Load Time** | <2 seconds (p95) | DevTools performance audit |
| **Uptime** | 99.5% (≤3.6 hrs/month) | UptimeRobot monitoring |
| **Concurrent Users** | 10 simultaneous editors | k6 load testing |
| **Hadith Entries** | 500+ by Month 3 | Database count |
| **RTL Bugs** | Zero cursor positioning bugs | 50-test RTL validation suite |

---

## **2. USER PERSONAS**

*(Unchanged from v2.0 - personas remain valid)*

### **Persona 1: Senior Student (Admin/DRI)**
- **Name**: Ahmed (25, Masters student)
- **Role**: Group leader, database curator, infrastructure maintainer
- **Technical Skills**: Comfortable with GitHub, basic CLI
- **Daily Usage**: 2-3 hours (evenings after lectures)
- **Goals**: 99.5% uptime, data integrity, <2 hrs/week DevOps
- **Key Story**: *"As an admin, I need automated backups so I can focus on studying."*

### **Persona 2: Active Contributor (Core Member)**
- **Name**: Fatima (23, Hadith researcher)
- **Role**: Primary content creator, Nahw specialist
- **Daily Usage**: 3-4 hours (dedicated study sessions)
- **Goals**: Fast data entry, visual Nahw diagrams, real-time collaboration
- **Key Story**: *"As a researcher, I need real-time cursor sync without conflicts."*

### **Persona 3: Casual Reader (Junior Student)**
- **Name**: Yusuf (21, undergraduate)
- **Role**: Exam prep, mobile-first user
- **Daily Usage**: 30 minutes (mobile browsing during commute)
- **Goals**: Mobile access, quick search, offline diagram review
- **Key Story**: *"As a commuter, I need mobile-responsive design that loads fast on 4G."*

---

## **3. FUNCTIONAL REQUIREMENTS**

*(Unchanged from v2.0 - functional requirements remain valid)*

### **3.1 Core Features (P0 - Must-Have for MVP)**

| Feature ID | Feature Name | Description | Acceptance Criteria | Priority |
|------------|--------------|-------------|---------------------|----------|
| **FR-001** | Real-time Collaborative Editing | Multiple users edit same document | 3+ users, <1s cursor sync | P0 |
| **FR-002** | Structured Database (Relations) | Link hadiths to narrators | Bi-directional links work | P0 |
| **FR-003** | Whiteboard/Canvas Mode | Draw I'rab sentence trees | TLDraw 1.29.2 with Arabic labels | P0 |
| **FR-004** | RTL Text Input | Arabic flows right-to-left | Zero cursor jumps in mixed text | P0 |
| **FR-005** | Auto-save | Prevent data loss | Saves every 10 seconds, visible indicator | P0 |
| **FR-006** | Search (Full-text) | Arabic + English keywords | <500ms for 1,000 records | P0 |

### **3.2 Important Features (P1 - Should-Have for MVP)**

| Feature ID | Feature Name | Acceptance Criteria | Priority |
|------------|--------------|---------------------|----------|
| **FR-007** | Version History | Restore to any point in 30 days | P1 |
| **FR-008** | Mobile Responsive | Touch-optimized, Arabic keyboard | P1 |
| **FR-009** | Export to PDF | Preserves RTL, includes diagrams | P1 |
| **FR-010** | Comment Threads | @mention notifications via email | P1 |
| **FR-011** | Workspace Permissions | View/Edit roles | P1 |

---

## **4. INFRASTRUCTURE REQUIREMENTS**

> [!IMPORTANT]
> **Architecture Changed:** Fly.io eliminated free tier. Migrated to Supabase + Vercel.

### **4.1 Core Infrastructure (IR-001 to IR-005)**

| Requirement ID | Component | Specification | Free Tier Limits | Cost |
|----------------|-----------|---------------|------------------|------|
| **IR-001** | **Application Hosting** | Vercel Hobby Plan | 1M invocations, 4 CPU-hours, **100GB bandwidth** | $0 |
| **IR-002** | **Database Hosting** | Supabase Free Tier | 500MB PostgreSQL, 50K MAU, **10GB egress** | $0 |
| **IR-003** | **Real-time Sync** | Supabase Realtime | 2M messages/month (**≈65K/day, batching required**) | $0 |
| **IR-004** | **Database Connections** | Supabase Pooler | **15 direct max, use port 6543 (Transaction mode)** | $0 |
| **IR-005** | **Authentication** | Supabase Auth | 50K MAU, email/password + magic links | $0 |
| **IR-006** | **File Storage** | Supabase Storage | 1GB, 50MB file size limit | $0 |

> [!CAUTION]
> **IR-003 Critical**: Broadcast messages count as **1 sent + N received**. For 10 concurrent users editing 4 hours/day without batching, you'll hit 43.2M messages/month (exceeds free tier). **MUST batch Yjs updates every 100ms** to reduce to ~4.3M messages/month.

### **4.2 Supporting Infrastructure (IR-007 to IR-011)**

| Requirement ID | Component | Specification | Rationale | Cost |
|----------------|-----------|---------------|-----------|------|
| **IR-007** | **Uptime Monitoring** | UptimeRobot Free | 50 monitors, 5-min intervals | $0 |
| **IR-008** | **Logging** | BetterStack Logs Free | 1GB/month, slow query tracking | $0 |
| **IR-009** | **Backups** | **GitHub Actions + Cloudflare R2** | Daily pg_dump (free tier has NO auto-backup) | $0 |
| **IR-010** | **Keep-Alive Cron** | GitHub Actions | Prevent 7-day inactivity pause (ping every 6 days) | $0 |
| **IR-011** | **Backup Storage** | Cloudflare R2 Free | 10GB storage, 30-day retention | $0 |

> [!WARNING]
> **IR-009 Critical**: Supabase free tier has **NO automated backups**. You MUST implement custom backup via GitHub Actions:
> ```yaml
> # .github/workflows/backup.yml
> name: Daily Supabase Backup
> on:
>   schedule:
>     - cron: '0 18 * * *'  # 2 AM SGT daily
> jobs:
>   backup:
>     runs-on: ubuntu-latest
>     steps:
>       - name: Backup database
>         run: npx supabase db dump -f backup_$(date +%Y%m%d).sql
>       - name: Upload to R2
>         uses: cloudflare/wrangler-action@v3
>         with:
>           command: r2 object put sanadflow-backups/backup_$(date +%Y%m%d).sql --file backup_$(date +%Y%m%d).sql
> ```

### **4.3 Cost Summary**

| Scenario | Monthly Cost | Notes |
|----------|--------------|-------|
| **Pilot (0-6 months)** | **$0** | Supabase + Vercel free tiers |
| **Steady-State (scaling)** | $45 | Supabase Pro ($25) + Vercel Pro ($20) |
| **Upgrade Trigger** | >50 users OR >2GB DB | Automatic alerts configured |

---

## **5. TECHNICAL ARCHITECTURE**

### **5.1 System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  Desktop Browsers   │  │  Mobile Browsers    │              │
│  │  Chrome, Firefox    │  │  iOS Safari, Chrome │              │
│  │  Safari, Edge       │  │  (PWA installable)  │              │
│  └──────────┬──────────┘  └──────────┬──────────┘              │
│             │ HTTPS/TLS 1.3           │                          │
└─────────────┼─────────────────────────┼──────────────────────────┘
              │                         │
              ↓                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Vercel Edge Network)                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Next.js 14.0.4 (App Router)                              │ │
│  │  - SSR for SEO + RTL meta tags                            │ │
│  │  - Apollo GraphQL API (/api/graphql)                      │ │
│  │  - Edge Runtime (preferredRegion: 'sin1')                 │ │
│  │  - TLDraw 1.29.2 whiteboard canvas                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Limits: 4 CPU-hours, 1M invocations, 100 deploys/day          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Supabase Client SDK
                      │ (PostgreSQL + Realtime + Auth)
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (Supabase - Singapore Region)                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL 16 (Free Tier)                                │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Tables:                                             │ │ │
│  │  │  - users (profiles, auth integration)                │ │ │
│  │  │  - workspaces (groups, permissions)                  │ │ │
│  │  │  - documents (Yjs CRDT state as BYTEA)              │ │ │
│  │  │  - hadiths (Arabic text, pg_trgm FTS)               │ │ │
│  │  │  - narrators (biographical data)                     │ │ │
│  │  │  - diagrams (canvas state, PNG metadata)            │ │ │
│  │  │  - yjs_documents (room_id, binary state)            │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  Extensions: pg_trgm, unaccent (Arabic FTS)              │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Supabase Realtime (Broadcast API)                        │ │
│  │  - Custom Yjs provider (replaces y-websocket)            │ │
│  │  - Awareness updates (cursor sync)                        │ │
│  │  - Auto-reconnect with exponential backoff                │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Supabase Auth                                            │ │
│  │  - Email/password (bcrypt)                                │ │
│  │  - Magic links (passwordless)                             │ │
│  │  - Row Level Security (RLS)                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Supabase Storage                                         │ │
│  │  - Diagram exports (PNG, <50MB)                          │ │
│  │  - 1GB free tier                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Limits: 500MB DB, 1GB storage, 50K MAU, 10GB egress          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Row Level Security (RLS)                                  │ │
│  │  - hadith_texts: Public read                               │ │
│  │  - yjs_documents: Room member check                        │ │
│  │  - room_members: User isolation                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Database Connection: Port 6543 (Transaction pooler)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MONITORING & AUTOMATION                                         │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  UptimeRobot       │  │  GitHub Actions    │                │
│  │  - /api/health     │  │  - Keep-alive cron │                │
│  │  - 5-min intervals │  │  - Every 6 days    │                │
│  │  - Slack alerts    │  │  - Supabase ping   │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### **5.2 Data Flow: Typical User Session**

```
1. User opens https://sanadflow.vercel.app
   ↓
2. Vercel Edge serves Next.js SSR (Singapore region)
   ↓
3. User logs in → Supabase Auth (magic link or password)
   ↓
4. JWT token stored in secure httpOnly cookie
   ↓
5. User opens document → Supabase Realtime channel subscribed
   ↓
6. Custom Yjs provider syncs document state via Broadcast API
   ↓
7. User edits hadith entry (Arabic text)
   ↓
8. Frontend normalizes text (NFC form) + auto-save every 10s
   ↓
9. GraphQL mutation → Vercel Edge → Supabase via pooler (port 6543)
   ↓
10. Row Level Security validates user has edit permission
   ↓
11. INSERT into hadiths table with pg_trgm index update
   ↓
12. Realtime broadcast notifies other editors
   ↓
13. User exports whiteboard → PNG uploaded to Supabase Storage
   ↓
14. User logs out (session persisted for 7 days)
```

### **5.3 Backup & Recovery Strategy**

| Backup Type | Frequency | Retention | RTO | RPO |
|-------------|-----------|-----------|-----|-----|
| **GitHub Actions pg_dump** | Daily (2 AM SGT) | 30 days | 2-4 hours | 24 hours |
| **Cloudflare R2** | Daily | 30 days | 2-4 hours | 24 hours |
| GitHub Repo | On deploy | Unlimited | N/A | N/A |
| Manual pg_dump | On-demand | User-managed | 4+ hours | Variable |

> [!WARNING]
> **NO AUTO-BACKUP ON FREE TIER**: Supabase free tier does NOT include automated backups.
> You MUST implement custom backup via GitHub Actions (see IR-009 in §4.2).

> [!CAUTION]
> **Supabase 7-Day Pause:** Free tier projects pause after 7 days of inactivity.
> Mitigated by GitHub Actions keep-alive cron running every 6 days.

---

## **6. NON-FUNCTIONAL REQUIREMENTS**

### **6.1 Performance**

| Metric | Target | Measurement | Failure Threshold |
|--------|--------|-------------|-------------------|
| Page Load Time | <2s (p95) | DevTools | >3s |
| API Response | <500ms | Supabase dashboard | >1s |
| Concurrent Users | 10 editors | k6 load test | OOM/429 errors |
| Search Latency | <500ms (1K records) | pg_trgm + EXPLAIN | >1s |
| Auto-save | Every 10 seconds | Frontend timer | Missed saves |
| Realtime Sync | <200ms cursor update | Supabase Realtime logs | >500ms |

### **6.2 Scalability**

| Dimension | Current (Free) | Upgrade Trigger | Upgraded (Pro) |
|-----------|----------------|-----------------|----------------|
| Database | 500MB | >400MB (80%) | 8GB |
| Storage | 1GB | >800MB | 100GB |
| MAU | 50,000 | >40,000 | 100,000 |
| Connections | 15 direct | Pooler only | 75 direct |

### **6.3 Security Requirements**

| Control | Implementation | Owner |
|---------|----------------|-------|
| Data Encryption (Transit) | TLS 1.3 (Vercel + Supabase) | Platform |
| Data Encryption (At Rest) | AES-256 (Supabase default) | Platform |
| Authentication | Supabase Auth (bcrypt, MFA optional) | Engineering |
| Authorization | Row Level Security (RLS) | Engineering |
| Secrets Management | Vercel encrypted env vars | DevOps |
| DDoS Protection | Vercel Edge + Supabase rate limits | Platform |

#### **SR-001: Authentication**
- Magic link authentication via Supabase Auth
- JWT stored in httpOnly cookies (not localStorage)
- Session expiry: 24 hours (configurable)

#### **SR-002: Authorization (Row Level Security)**

> [!IMPORTANT]
> **RLS is DISABLED by default on Supabase tables.** You MUST explicitly enable it on ALL tables.

```sql
-- 1. Enable RLS on ALL tables (Supabase defaults to OFF)
ALTER TABLE hadith_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 2. Define explicit policies
CREATE POLICY "Public read for hadith texts"
  ON hadith_texts FOR SELECT
  USING (true);  -- All users can read

CREATE POLICY "Authenticated users can edit Yjs documents"
  ON yjs_documents FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = yjs_documents.room_id
      AND user_id = auth.uid()
    )
  );

-- 3. Room membership table for isolation
CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')),
  PRIMARY KEY (room_id, user_id)
);

CREATE POLICY "Users can only access their rooms"
  ON yjs_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = yjs_documents.room_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );
```

#### **SR-003: Data Protection**
- Arabic text stored as UTF-8 with NFC normalization
- User emails encrypted at rest (Supabase default)
- Yjs CRDT state compressed (reduces egress by 70%)

#### **SR-004: Rate Limiting**
- Vercel Edge Middleware: 100 requests/minute per IP
- Supabase RLS policies prevent bulk data export
- Realtime message throttling: 10 updates/second per user

> [!CAUTION]
> **Service Role Key Security**: Never use `SUPABASE_SERVICE_KEY` in frontend code—it bypasses ALL RLS policies.
> ```typescript
> // ❌ NEVER DO THIS (frontend)
> const supabase = createClient(url, SUPABASE_SERVICE_KEY)  // Bypasses RLS!
> 
> // ✅ CORRECT (frontend)
> const supabase = createClient(url, SUPABASE_ANON_KEY)     // Enforces RLS
> ```

### **6.4 Reliability**

| Metric | Target | Monitoring |
|--------|--------|------------|
| Uptime SLA | 99.5% | UptimeRobot |
| Data Durability | 99.99% | Supabase daily backup |
| MTTR | <4 hours | Runbook + alerts |
| Error Rate | <1% API requests | Vercel analytics |

---

## **7. KNOWN LIMITATIONS & MITIGATIONS**

### **7.1 Supabase Free Tier Gotchas**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| 7-day inactivity pause | Project becomes inaccessible | GitHub Actions keep-alive every 6 days |
| 500MB database limit | ~10K hadith entries | Archive old data to CSV export |
| 2 projects per org | Can't have staging | Use branching in Supabase |
| 15 direct connections | Connection exhaustion | Use pooler (port 6543) with Prisma |
| **10GB egress/month** | Heavy FTS queries could exceed | Monitor egress, optimize queries at 80% |
| **NO auto-backup** | Data loss risk | GitHub Actions daily pg_dump to R2 |

### **7.2 Vercel Hobby Plan Gotchas**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Personal/non-commercial only | Legal risk if monetized | Stay non-commercial OR upgrade |
| 4 CPU-hours/month | Heavy load could exceed | Monitor Vercel dashboard |
| 100 deploys/day | CI/CD could hit limit | Batch deployments |
| **100GB bandwidth/month** | Text content ~2-5GB/month for 10 users | 20x safety margin ✓ |
| **No static file hosting** | Diagram exports need storage | Use Supabase Storage |

### **7.3 Realtime Broadcast Gotchas**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Message calculation** | 1 sent + N received per broadcast | Batch Yjs updates every 100ms |
| **Free tier hard limit** | Service stops at 2M (no overage) | Monitor via Supabase dashboard |
| **Per-keystroke updates** | 43.2M msgs/month for 10 users | Debounce to 100ms (→ 4.3M msgs/month) |

### **7.4 Security Gotchas**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **RLS disabled by default** | Data exposed to all auth users | Enable RLS on ALL tables explicitly |
| **Service role exposure** | Bypasses all security | Never use in frontend code |
| **Room isolation** | Users could access other rooms | Validate membership in RLS policies |

---

## **8. PHASE GATES**

### **Phase 0: RTL Validation (Days 1-2)**
- **Gate Criteria**: ≥45/50 RTL test cases pass
- **GO**: Proceed to Phase 1
- **NO-GO**: Pivot to Obsidian + shared folder

### **Phase 1: Infrastructure (Days 3-5)**
- **Gate Criteria**: 
  - Supabase project created (Singapore region)
  - Vercel project deployed
  - Health check returns 200
  - Keep-alive cron configured

### **Phase 2: Backend (Week 1.5-2)**
- **Gate Criteria**:
  - All Prisma migrations applied
  - GraphQL API functional
  - Arabic FTS working (<500ms)

### **Phase 3: Frontend (Week 2-3)**
- **Gate Criteria**:
  - TLDraw whiteboard functional
  - Yjs collaboration working
  - Auto-save indicator visible

### **Phase 4: Load Testing (Week 3)**
- **Gate Criteria**:
  - 10 concurrent users stable
  - p95 response <2s
  - Error rate <1%

### **Phase 5: Go-Live (Week 4)**
- **Gate Criteria**:
  - All Phase 4 tests pass
  - User onboarding complete (3 users)
  - Runbook documented

---

## **9. APPENDIX**

### **9.1 Deprecated Architecture (v2.0)**
The Fly.io-based architecture from PRD v2.0 is preserved in `PRD_2.0.md` for historical reference. It is no longer viable due to Fly.io eliminating their free tier.

### **9.2 References**
1. Supabase Free Tier Limits: https://supabase.com/pricing
2. Vercel Hobby Plan Limits: https://vercel.com/docs/limits
3. Perplexity AI Validation: January 11, 2026
4. y-supabase issues: https://github.com/supabase/supabase/discussions

---

*Document Status: APPROVED (v3.1 with Perplexity Verification Amendments)*
