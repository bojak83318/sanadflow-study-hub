# **PRODUCT REQUIREMENTS DOCUMENT (PRD) v2.0**
## **SanadFlow Study Hub - Islamic Sciences Collaborative Platform**

**Document Type**: Product Requirements Document v2.0  
**Product Manager**: BMADv5 Product Team  
**System Architect**: Dr. Sarah Chen  
**Engineering Director**: Marcus Rodriguez  
**Date**: January 11, 2026  
**Status**: APPROVED - Ready for Implementation  
**Target Release**: Week 4 (February 2, 2026)

***

## **REVISION HISTORY**

| Version | Date | Changes | Approver |
|---------|------|---------|----------|
| v1.0 | Jan 11, 2026 | Initial draft | PM |
| v2.0 | Jan 11, 2026 | Architecture review feedback incorporated | PM + Architect + Eng Director |

**Key Changes in v2.0:**
- Added PgBouncer connection pooling (IR-006)[1]
- Added Cloudflare R2 media offloading (IR-007)[2][1]
- Added application health checks (IR-008)[3]
- Added slow query logging (IR-009)[3]
- Moved RTL testing to Day 1 (critical gate)[4]
- Added 3-tier on-call escalation model
- Revised cost projection to "$0 pilot, $5-10/month steady-state"[3]
- Added Obsidian fallback alternative[4]

***

## **1. PRODUCT OVERVIEW**

### **1.1 Product Vision**
Build a production-grade, zero-pilot-cost knowledge management platform enabling 5-10 Islamic Sciences students to collaboratively study Nahw (Arabic Grammar), Hadith, and Usul al-Fiqh with real-time editing, visual diagramming, and structured databases—without compromising on Arabic RTL text support.

### **1.2 Problem Statement**
Current solutions fail our use case:
- **Notion**: Block limits (1,000 blocks with guests) + RTL auto-switching bugs + $180/6-month cost[5][4]
- **AFFiNE Cloud**: 3-member workspace limit on free tier[6][7]
- **Render**: 15-minute spin-down + 90-day database deletion[8][9]
- **Railway**: $5 credit expires after 30 days[10][11]
- **Generic solutions**: None optimized for mixed Arabic-English scholarly work with whiteboard integration

### **1.3 Success Criteria**
- **Zero pilot costs** for initial 6-month evaluation period
- **Steady-state budget**: $5-10/month after pilot (contingency for tier upgrades)[3]
- **Performance**: <2-second page loads for 10 concurrent users[3]
- **Reliability**: 99.5% uptime (≤3.6 hours downtime/month)[3]
- **Content**: 500+ hadith entries cataloged by Month 3[12]
- **RTL**: Arabic text works flawlessly with zero cursor positioning bugs[4]

***

## **2. USER PERSONAS**

### **Persona 1: Senior Student (Admin/DRI)**
- **Name**: Ahmed (25, Masters student)
- **Role**: Group leader, database curator, infrastructure maintainer
- **Technical Skills**: Comfortable with Docker, GitHub, command line
- **Daily Usage**: 2-3 hours (evenings after lectures)
- **Goals**: 
  - Maintain 99.5% uptime for exam season
  - Ensure hadith database integrity
  - Minimize time spent on DevOps (<2 hrs/week)
- **Pain Points**: 
  - Complex multi-service debugging
  - Fear of data loss during exams
  - Network latency impacting real-time editing[1]
- **Key User Story**: *"As an admin, I need automated backups so I can focus on studying instead of worrying about infrastructure."*[13]

### **Persona 2: Active Contributor (Core Member)**
- **Name**: Fatima (23, Hadith researcher)
- **Role**: Primary content creator, Nahw specialist
- **Technical Skills**: Basic command line, can follow tutorials
- **Daily Usage**: 3-4 hours (dedicated study sessions)
- **Goals**:
  - Fast data entry (500+ hadiths in 3 months)
  - Visual Nahw diagrams for I'rab trees[14]
  - Collaborate with 2-3 peers simultaneously[15]
- **Pain Points**:
  - Slow response times (>3s) breaking flow state[3]
  - Cursor jumping when typing Arabic[4]
  - Lost work from unsaved changes[15]
- **Key User Story**: *"As a researcher, I need real-time cursor sync so I can see what my study partner is editing without conflicts."*[15]

### **Persona 3: Casual Reader (Junior Student)**
- **Name**: Yusuf (21, undergraduate)
- **Role**: Exam prep, quick reference during commutes
- **Technical Skills**: Non-technical, mobile-first user
- **Daily Usage**: 30 minutes (mobile browsing)
- **Goals**:
  - Access notes on phone during 1-hour commute
  - Search hadiths by narrator or topic quickly
  - Review Nahw diagrams offline if possible
- **Pain Points**:
  - Complex navigation on small screens
  - Mobile keyboard doesn't support Arabic well[14]
  - App feels slow on 4G connection[3]
- **Key User Story**: *"As a commuter, I need mobile-responsive design so I can review notes without waiting for pages to load."*[14]

***

## **3. FUNCTIONAL REQUIREMENTS**

### **3.1 Core Features (P0 - Must-Have for MVP)**

| Feature ID | Feature Name | Description | Acceptance Criteria | Owner | Priority |
|------------|--------------|-------------|---------------------|-------|----------|
| **FR-001** | **Real-time Collaborative Editing** | Multiple users edit same document simultaneously | 3+ users can edit with <1s cursor sync latency [15] | Engineering | P0 |
| **FR-002** | **Structured Database (Relations)** | Link hadith entries to narrator profiles | Bi-directional links work (click narrator → see all hadiths) [12] | Engineering | P0 |
| **FR-003** | **Whiteboard/Canvas Mode** | Draw I'rab sentence trees with connectors | Can draw arrows connecting text boxes with Arabic labels [14] | Engineering | P0 |
| **FR-004** | **RTL Text Input** | Arabic text flows right-to-left correctly | Zero cursor jumps in mixed Arabic-English content [4] | Engineering | P0 |
| **FR-005** | **Auto-save** | Prevent data loss from browser crashes | Saves every 10 seconds, visible "saved" indicator [15] | Engineering | P0 |
| **FR-006** | **Search (Full-text)** | Find hadiths by Arabic or English keywords | Returns results in <500ms for 1,000-record database [12] | Engineering | P0 |

### **3.2 Important Features (P1 - Should-Have for MVP)**

| Feature ID | Feature Name | Description | Acceptance Criteria | Owner | Priority |
|------------|--------------|-------------|---------------------|-------|----------|
| **FR-007** | **Version History** | View document changes over time | Can restore document to any point in past 30 days [6] | Engineering | P1 |
| **FR-008** | **Mobile Responsive** | iOS/Android access with full editing | Touch-optimized interface, Arabic keyboard support [14] | Engineering | P1 |
| **FR-009** | **Export to PDF** | Generate study materials for offline review | Preserves Arabic RTL in PDF, includes diagrams [13] | Engineering | P1 |
| **FR-010** | **Comment Threads** | Asynchronous discussion on documents | @mention notifications via email [12] | Engineering | P1 |
| **FR-011** | **Workspace Permissions** | Control who can view/edit content | Workspace-level permissions (View/Edit) [16] | Engineering | P1 |

### **3.3 Nice-to-Have Features (P2 - Post-MVP)**

| Feature ID | Feature Name | Description | Defer Reason |
|------------|--------------|-------------|--------------|
| **FR-012** | **Advanced Search Filters** | Filter by grading (Sahih/Hasan), narrator, date | Complexity, can use basic search + manual filter |
| **FR-013** | **Diagram Templates** | Pre-built I'rab tree templates | Can create manually in whiteboard [14] |
| **FR-014** | **Bulk Import** | CSV upload for 100+ hadiths at once | Manual entry sufficient for 500-record target |
| **FR-015** | **Offline Mode (PWA)** | Work without internet, sync later | Adds 40+ engineering hours, mobile browser sufficient [14] |

***

## **4. INFRASTRUCTURE REQUIREMENTS**

### **4.1 Core Infrastructure (IR-001 to IR-005)**

| Requirement ID | Component | Specification | Rationale | Cost |
|----------------|-----------|---------------|-----------|------|
| **IR-001** | **Application Hosting** | Koyeb Free Tier: 0.1 vCPU, 512MB RAM, 2.5GB disk, 100GB bandwidth/month [3] | Always-on (no spin-down), Docker support, Git auto-deploy [3] | $0 |
| **IR-002** | **Database Hosting** | Aiven PostgreSQL 16 Hobbyist: 1 vCPU, 1GB RAM, 5GB storage, 1-day PITR [1] | Managed backups, TLS encryption, permanent free tier [1] | $0 |
| **IR-003** | **Version Control** | GitHub private repo with Actions (unlimited minutes on public repos) [13] | Backup automation, configuration as code, team collaboration [13] | $0 |
| **IR-004** | **Uptime Monitoring** | UptimeRobot Free: 50 monitors, 5-min intervals, webhook alerts [3] | 99.5% SLA tracking, automatic incident detection [3] | $0 |
| **IR-005** | **Backup Automation** | GitHub Actions workflow: daily pg_dump at 2 AM SGT [13] | Disaster recovery (RPO: 24 hours, RTO: 24 hours) [13] | $0 |

### **4.2 NEW: Performance & Scalability Enhancements (IR-006 to IR-009)**

| Requirement ID | Component | Specification | Rationale | Cost |
|----------------|-----------|---------------|-----------|------|
| **IR-006** | **Database Connection Pool** | PgBouncer sidecar container (50MB RAM allocation) [1] | Reduces DB connections from N users to 2-3 persistent, cuts latency 60% [1] | $0 |
| **IR-007** | **Media Offloading** | Cloudflare R2: 10GB storage, 1M Class A operations/month [2] | Offload whiteboard PNGs when nearing 5GB Aiven limit [1][2] | $0 |
| **IR-008** | **Application Health Checks** | Custom `/api/health` endpoint checking DB + Redis + disk [3] | UptimeRobot monitors app-level failures, not just HTTP 200 [3] | $0 |
| **IR-009** | **Slow Query Logging** | BetterStack Logs Free: 1GB/month log retention [3] | Diagnose database performance issues (queries >500ms) [1] | $0 |

**Total Pilot Cost**: $0/month  
**Steady-State Cost (Contingency)**: $5-10/month for tier upgrades if limits exceeded[3]

***

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
│  APPLICATION LAYER (Koyeb - Singapore Region)                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  AFFiNE Docker Container (Self-Hosted)                    │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  Frontend: Next.js 14 + React 18                     ││ │
│  │  │  Backend: Node.js 18 LTS + GraphQL API               ││ │
│  │  │  Cache: Embedded Redis 7 (ephemeral, <100MB RAM)    ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  PgBouncer Sidecar (NEW)                             ││ │
│  │  │  - Connection pooling: pool_mode=transaction        ││ │
│  │  │  - Max client conns: 50, server conns: 3            ││ │
│  │  │  - RAM allocation: 50MB                              ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
│  Resources: 0.1 vCPU, 512MB RAM, 2.5GB persistent volume       │
│  Network: 100GB/month bandwidth                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ PostgreSQL Wire Protocol (Port 5432)
                      │ via DATABASE_URL env var
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (Aiven - DigitalOcean Singapore/Frankfurt)          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL 16 (Hobbyist Plan)                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Tables:                                             │ │ │
│  │  │  - users (auth, profiles)                           │ │ │
│  │  │  - workspaces (groups)                              │ │ │
│  │  │  - documents (pages, blobs as JSON)                 │ │ │
│  │  │  - hadiths (structured data with relations)         │ │ │
│  │  │  - narrators (biographical data)                    │ │ │
│  │  │  - whiteboard_snapshots (canvas state)              │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Resources: 1 vCPU, 1GB RAM, 5GB SSD                           │
│  Backup: 1-day Point-in-Time Recovery (PITR)                   │
│  Security: TLS/SSL enforced, IP whitelist optional             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ pg_dump via GitHub Actions
                      │ (daily at 2 AM SGT)
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKUP LAYER (GitHub Private Repo)                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  sanadflow-notes/                                          │ │
│  │  ├── backups/                                              │ │
│  │  │   ├── daily/affine-20260111.sql.gz (daily dumps)      │ │
│  │  │   ├── weekly/affine-week-02.sql.gz (weekly snapshots)│ │
│  │  │   └── monthly/affine-jan-2026.sql.gz (monthly)       │ │
│  │  ├── configs/                                              │ │
│  │  │   ├── docker-compose.yml                               │ │
│  │  │   ├── pgbouncer.ini                                    │ │
│  │  │   └── .env.template                                    │ │
│  │  └── docs/                                                 │ │
│  │      ├── runbook.md (incident response)                   │ │
│  │      └── setup-guide.md (onboarding)                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Storage: Unlimited (private repos free for teams)             │
│  Actions: 2,000 minutes/month (sufficient for daily backups)   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Manual restore path
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│  MEDIA OFFLOAD LAYER (Cloudflare R2 - NEW)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Object Storage (S3-compatible API)                       │ │
│  │  - Whiteboard exports (PNG, >1MB each)                   │ │
│  │  - Archived diagrams (when DB >4.5GB)                    │ │
│  │  - Public URL: https://r2.sanadflow.workers.dev          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Resources: 10GB storage, 1M Class A operations/month          │
│  Trigger: Automatic when Aiven storage >4.5GB (90% full)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MONITORING LAYER                                                │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  UptimeRobot       │  │  BetterStack Logs  │                │
│  │  - /api/health     │  │  - Slow queries    │                │
│  │  - 5-min intervals │  │  - Error traces    │                │
│  │  - Slack alerts    │  │  - 1GB/month       │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### **5.2 Data Flow: Typical User Session**

```
1. User opens https://sanadflow.koyeb.app
   ↓
2. Koyeb load balancer routes to AFFiNE container
   ↓
3. Next.js serves React SPA (client-side rendering)
   ↓
4. User logs in → GraphQL mutation to /api/auth
   ↓
5. PgBouncer pools connection to Aiven PostgreSQL
   ↓ (Single persistent connection reused)
6. PostgreSQL verifies credentials, returns JWT token
   ↓
7. User creates new hadith entry (Arabic text + English)
   ↓
8. Frontend sends GraphQL mutation every 10 seconds (auto-save)
   ↓
9. Backend validates RTL encoding (UTF-8 check)
   ↓
10. INSERT into hadiths table via PgBouncer
   ↓
11. Real-time update broadcast via WebSocket to other editors
   ↓
12. User exports whiteboard diagram
   ↓
13. If DB >4.5GB: Upload PNG to Cloudflare R2
    Else: Store in whiteboard_snapshots table
   ↓
14. User logs out (session persisted for 7 days)
```

### **5.3 Backup & Recovery Flow**

```
Daily (2 AM SGT):
  GitHub Actions workflow triggers
    ↓
  Runner connects to Aiven PostgreSQL
    ↓
  Executes: pg_dump --format=directory --jobs=2 --compress=9
    ↓
  Splits output into <1GB chunks (if >1GB)
    ↓
  Commits to backups/daily/affine-YYYYMMDD.sql.gz
    ↓
  Pushes to GitHub repo
    ↓
  Slack notification: "Backup completed: 2.3GB"

Weekly (Sunday 2 AM):
  Copy daily backup → backups/weekly/

Monthly (1st of month):
  Copy weekly backup → backups/monthly/

Disaster Recovery (Manual):
  1. Provision new Aiven PostgreSQL instance
  2. Download latest backup from GitHub
  3. Execute: pg_restore --clean --if-exists <backup-file>
  4. Update DATABASE_URL in Koyeb
  5. Restart AFFiNE container
  6. Verify data integrity (10 spot checks)
  
  Estimated RTO: 4 hours
  Estimated RPO: 24 hours (last backup)
```

***

## **6. NON-FUNCTIONAL REQUIREMENTS**

### **6.1 Performance**

| Metric | Target | Measurement Method | Failure Threshold |
|--------|--------|-------------------|-------------------|
| **Page Load Time** | <2s (95th percentile) [3] | Chrome DevTools Network tab | >3s |
| **API Response Time** | <500ms (database queries) [1] | BetterStack slow query log | >1s |
| **Concurrent Users** | 10 simultaneous editors | Load test with Locust (Week 1) | OOM errors |
| **Whiteboard Rendering** | <1s (canvas with 50 objects) [14] | Manual stopwatch test | >2s |
| **Search Latency** | <500ms (1,000 hadiths) [12] | PostgreSQL EXPLAIN ANALYZE | >1s |
| **Auto-save Frequency** | Every 10 seconds [15] | Frontend timer inspection | Missed saves |

### **6.2 Scalability**

| Dimension | Current Capacity | Growth Plan | Hard Limit |
|-----------|------------------|-------------|------------|
| **Storage** | 5GB (Aiven) [1] | Archive to R2 at 4.5GB [2] | 10GB (R2 + Aiven) |
| **Users** | 10 active members | Upgrade to Koyeb Starter ($7.20/month) at 15 users [3] | 20 users (RAM limit) |
| **Bandwidth** | 100GB/month [3] | Block file uploads temporarily at 90GB | 100GB hard cap |
| **Database Connections** | 3 (via PgBouncer) [1] | Increase to 5 if latency >1s | 10 (Aiven limit) |

### **6.3 Security**

| Control | Implementation | Compliance Standard | Owner |
|---------|----------------|---------------------|-------|
| **Data Encryption (Transit)** | TLS 1.3 for all connections [1] | HTTPS enforced via Koyeb | Engineering |
| **Data Encryption (At Rest)** | Aiven default encryption (AES-256) [1] | PostgreSQL transparent encryption | Aiven |
| **Authentication** | Email + password (bcrypt hashing) [12] | OWASP password guidelines | Engineering |
| **Authorization** | Workspace-level RBAC (View/Edit) [16] | Least privilege principle | Engineering |
| **Secrets Management** | GitHub encrypted secrets [13] | Never commit .env to repo | DevOps |
| **Backup Security** | Private GitHub repo (2FA required) [13] | Access logs reviewed weekly | Admin |
| **DDoS Protection** | Cloudflare proxy (if custom domain) | Rate limiting: 100 req/min/IP | Optional |

### **6.4 Reliability**

| Metric | Target | Monitoring | Incident Response |
|--------|--------|------------|-------------------|
| **Uptime SLA** | 99.5% (≤3.6 hrs downtime/month) [3] | UptimeRobot 5-min checks | Tier 1: 2-hour response |
| **Data Durability** | 99.99% (no loss >10 records) | Daily backup integrity checks [13] | Tier 3: 4-hour response |
| **Mean Time to Recovery (MTTR)** | <4 hours (from backup) | Quarterly restore drills | Documented in runbook |
| **Error Rate** | <1% of API requests | BetterStack error tracking [3] | Alert at 5% error rate |

### **6.5 Usability**

| Criterion | Target | Test Method | Pass/Fail |
|-----------|--------|-------------|-----------|
| **Mobile Responsiveness** | Works on 375px width (iPhone SE) [14] | Manual testing on 3 devices | Pass if all features accessible |
| **Arabic Input** | Zero cursor jumps in mixed text [4] | 50 RTL test cases (Week 1) | Fail if >5% tests broken |
| **Onboarding Time** | New user creates first hadith in <10 minutes | User testing (3 participants) | Pass if 2/3 succeed |
| **Search Discoverability** | Users find search bar in <30 seconds | Cognitive walkthrough | Pass if 100% find it |

***

## **7. USER STORIES & ACCEPTANCE CRITERIA**

### **Epic 1: Content Creation & Management**

#### **US-001: Create Hadith Database Entry**
**As a** hadith researcher (Fatima),  
**I want to** create structured entries with Arabic text, translation, and narrator links,  
**So that** I can systematically catalog 500+ hadiths for exam prep.

**Acceptance Criteria:**
- [ ] Can type Arabic text without cursor jumping (50 test cases pass)[4]
- [ ] Can link to narrator profile via @ mention or dropdown[12]
- [ ] Auto-saves every 10 seconds (visible "Saved at HH:MM" indicator)[15]
- [ ] Mobile keyboard supports Arabic input (tested on iOS Safari)[14]
- [ ] Can add tags: Sahih, Hasan, Daif, etc.[12]
- [ ] Grading field pre-populated with 5 options (dropdown)[12]

**Priority**: P0  
**Estimate**: 8 story points  
**Dependencies**: FR-004 (RTL), FR-002 (Relations), FR-005 (Auto-save)

***

#### **US-002: Draw Nahw Diagram on Whiteboard**
**As a** Nahw student,  
**I want to** draw I'rab sentence trees with arrows connecting words,  
**So that** I can visualize grammatical relationships for 50+ practice sentences.

**Acceptance Criteria:**
- [ ] Can add text boxes with Arabic labels[14]
- [ ] Can draw arrows with customizable colors[14]
- [ ] Can export as PNG (300 DPI, preserves RTL)[13]
- [ ] Real-time sync: Partner sees my cursor position[15]
- [ ] Undo/redo works for 20 steps back[14]
- [ ] Whiteboard loads in <1 second (50 objects)[14]

**Priority**: P0  
**Estimate**: 13 story points  
**Dependencies**: FR-003 (Whiteboard), FR-004 (RTL), FR-001 (Collaboration)

***

### **Epic 2: Collaboration & Real-time Editing**

#### **US-003: See Live Editing Cursors**
**As an** active contributor,  
**I want to** see which parts of a document my peers are editing in real-time,  
**So that** I can avoid merge conflicts during group study sessions.

**Acceptance Criteria:**
- [ ] Live cursor positions show username (e.g., "Ahmed is typing...")[15]
- [ ] Cursor color unique per user (10 colors available)[15]
- [ ] Latency <1 second for cursor updates[15]
- [ ] Presence indicator shows online/offline status[15]
- [ ] Works on mobile (touch-optimized)[14]

**Priority**: P0  
**Estimate**: 5 story points  
**Dependencies**: FR-001 (Real-time collab), IR-006 (PgBouncer for low latency)

***

#### **US-004: Comment on Document Sections**
**As a** group member,  
**I want to** leave comments on specific hadith entries for asynchronous discussion,  
**So that** I can ask clarification questions without interrupting others' workflow.

**Acceptance Criteria:**
- [ ] Can select text and add comment thread[12]
- [ ] @mention sends email notification (e.g., "@Ahmed what's the grading?")[12]
- [ ] Can resolve comment thread when addressed[12]
- [ ] Mobile tap-and-hold opens comment menu[14]
- [ ] Comments persist in version history[6]

**Priority**: P1  
**Estimate**: 5 story points  
**Dependencies**: FR-010 (Comments), FR-007 (Version history)

***

### **Epic 3: Search & Discovery**

#### **US-005: Search Hadiths by Keyword**
**As a** casual reader (Yusuf),  
**I want to** search for hadiths using Arabic or English keywords,  
**So that** I can quickly find specific narrations during my 30-minute commute.

**Acceptance Criteria:**
- [ ] Search bar visible on homepage (no hidden menu)[12]
- [ ] Returns results in <500ms (1,000-record database)[12]
- [ ] Highlights matching text (bold, yellow background)[12]
- [ ] Supports mixed Arabic-English queries (e.g., "الإيمان faith")[12]
- [ ] Mobile keyboard switches to Arabic when typing RTL[14]

**Priority**: P0  
**Estimate**: 5 story points  
**Dependencies**: FR-006 (Search), FR-004 (RTL)

***

### **Epic 4: Data Integrity & Backup**

#### **US-006: Restore Deleted Document**
**As an** admin (Ahmed),  
**I want to** restore accidentally deleted hadiths from version history,  
**So that** I can recover from user errors without data loss.

**Acceptance Criteria:**
- [ ] "Trash" bin retains deleted items for 30 days[6]
- [ ] Can preview document before restoring[6]
- [ ] One-click restore button ("Restore to workspace")[6]
- [ ] Email confirmation sent to admin after restore[6]
- [ ] Works on mobile (swipe-to-restore gesture)[14]

**Priority**: P1  
**Estimate**: 3 story points  
**Dependencies**: FR-007 (Version history), IR-005 (Backups)

***

## **8. OUT OF SCOPE (Deferred to Post-MVP)**

| Feature | Rationale for Exclusion | Future Consideration |
|---------|-------------------------|---------------------|
| **AI-powered Hadith Grading** | Requires ML model training (40+ hours), resource-intensive inference | V2.0 if $100/month budget approved |
| **Audio/Video Lectures** | 5-minute video = ~50MB, exceeds 100GB bandwidth limit [3] | Use external Vimeo/YouTube embeds |
| **Custom Native Mobile App** | Web PWA sufficient for MVP, native app = 200+ hours [14] | V3.0 if >50 daily active users |
| **Advanced Permissions (Read-Only)** | AFFiNE self-hosted lacks granular RBAC [17] | Requires upgrade to AFFiNE Pro [6] |
| **LDAP/SSO Integration** | Overkill for 10-person group, adds 30+ hours | Enterprise V4.0 feature |
| **Calendar Integration** | Nice-to-have, not critical for exam prep | V2.0 if requested by 5+ users |
| **Dark Mode** | Cosmetic, low ROI (2-hour task) | Quick win for V1.1 |
| **Multi-language UI** | Group is bilingual (Arabic/English only) | V3.0 if internationalization needed |

***

## **9. RELEASE PLAN & MILESTONES**

### **Phase 0: Critical Gate - RTL Validation (Days 1-2)**

**Dates**: January 13-14, 2026  
**Owner**: Engineering (1 engineer assigned)  
**Goal**: Determine if AFFiNE's RTL implementation is production-viable[4]

**Tasks:**
- [ ] **Day 1 Morning**: Deploy AFFiNE locally (Docker Compose)
- [ ] **Day 1 Afternoon**: Run 50 RTL test cases:
  - Pure Arabic paragraph (100+ words from Quran)
  - Mixed Arabic-English inline text
  - Bidirectional lists (Arabic bullets, English sub-bullets)
  - Whiteboard text boxes with Arabic labels[14]
  - Mobile browser testing (iOS Safari, Android Chrome)[14]
- [ ] **Day 2 Morning**: Document cursor positioning bugs (if any)
- [ ] **Day 2 Afternoon**: Go/No-Go decision meeting

**Exit Criteria:**
- ✅ **GO**: ≥45/50 tests pass (90% success rate) → Proceed to Phase 1
- ⚠️ **CAUTION**: 40-44 tests pass → Evaluate workarounds (e.g., avoid inline mixing)
- ❌ **NO-GO**: <40 tests pass → Abort, pivot to Obsidian + Sync ($8/month)[4]

**Deliverables:**
- RTL Test Report (Google Sheets with pass/fail per test case)
- Screen recordings of failures (Loom videos)
- Recommendation memo to PM

***

### **Phase 1: Infrastructure Provisioning (Days 3-5)**

**Dates**: January 15-17, 2026  
**Owner**: DevOps + Engineering Director  
**Goal**: Deploy production infrastructure with monitoring[1][3]

**Tasks:**

**Day 3 (Database Setup):**
- [ ] Create Aiven account, provision PostgreSQL 16 (Singapore region)[1]
- [ ] Configure SSL/TLS, whitelist Koyeb IP ranges[1]
- [ ] Create `affine_production` database, run schema migrations[1]
- [ ] Test connection from local machine: `psql $DATABASE_URL`[1]
- [ ] Configure 1-day PITR backup[1]

**Day 4 (Application Deployment):**
- [ ] Fork AFFiNE repo to organization GitHub account[18]
- [ ] Configure Koyeb service via Git integration[3]
- [ ] Add environment variables:
  - `DATABASE_URL` (Aiven connection string)[1]
  - `REDIS_URL` (embedded Redis)[3]
  - `NODE_ENV=production`
  - `AFFINE_SERVER_HOST=0.0.0.0`
- [ ] Deploy PgBouncer sidecar (50MB RAM allocation)[1]
- [ ] Wait 10-15 minutes for build, verify deployment[3]
- [ ] Test health check endpoint: `curl https://sanadflow.koyeb.app/api/health`[3]

**Day 5 (Monitoring & Backup):**
- [ ] Create UptimeRobot monitor (5-min intervals, Slack webhook)[3]
- [ ] Set up BetterStack Logs account, configure ingestion[3]
- [ ] Create GitHub Actions workflow for daily backups (2 AM SGT)[13]
- [ ] Test backup manually: Run workflow → Verify SQL file in repo[13]
- [ ] Create Cloudflare R2 bucket `sanadflow-media` (10GB)[2]
- [ ] Generate R2 API tokens, add to Koyeb env vars[2]

**Exit Criteria:**
- [ ] Application accessible at public URL
- [ ] Health check returns HTTP 200 with JSON status
- [ ] Test user can log in and create workspace
- [ ] Backup file appears in GitHub repo
- [ ] UptimeRobot shows 100% uptime for 24 hours

**Deliverables:**
- Infrastructure diagram (updated with actual IPs/URLs)
- `.env.production` template in GitHub repo
- Onboarding guide (setup-guide.md) for admins

***

### **Phase 2: Load Testing & Optimization (Week 2)**

**Dates**: January 20-24, 2026  
**Owner**: System Architect + Engineering  
**Goal**: Validate performance under 10 concurrent users[3]

**Tasks:**

**Day 6 (Load Test Setup):**
- [ ] Write Locust test script simulating 10 users:
  - Login → Create hadith → Edit document → Search → Logout
- [ ] Target: 1,000 requests over 30 minutes
- [ ] Metrics: p50, p95, p99 response times[3]

**Day 7 (Baseline Performance):**
- [ ] Run load test against Koyeb deployment[3]
- [ ] Monitor Aiven database CPU/RAM in console[1]
- [ ] Check BetterStack for slow queries (>500ms)[3]
- [ ] Document baseline: "p95 = 1.8s, 3 slow queries identified"

**Day 8 (Optimization):**
- [ ] Add database indexes on hadiths.narrator_id, documents.workspace_id[1]
- [ ] Tune PgBouncer pool size (increase to 5 connections if needed)[1]
- [ ] Enable Redis caching for frequently accessed pages[3]
- [ ] Re-run load test, compare improvements

**Day 9 (Migration Dry Run):**
- [ ] Import 50 sample hadiths from CSV[12]
- [ ] Create 10 narrator profiles with relations[12]
- [ ] Draw 5 Nahw diagrams on whiteboard[14]
- [ ] Test Arabic RTL in production environment[4]

**Day 10 (Documentation):**
- [ ] Write runbook for common incidents (Appendix D)
- [ ] Create video tutorial: "How to Create Your First Hadith"
- [ ] Update setup-guide.md with Week 2 learnings

**Exit Criteria:**
- [ ] p95 response time <2 seconds under 10 concurrent users[3]
- [ ] No OOM errors during load test[3]
- [ ] Database size <1GB (plenty of headroom)[1]
- [ ] Arabic RTL works in production (5/5 diagrams correct)[4]

**Deliverables:**
- Load test report (Locust HTML dashboard)
- Performance tuning recommendations
- Incident response runbook (runbook.md)

***

### **Phase 3: User Onboarding & Training (Week 3)**

**Dates**: January 27-31, 2026  
**Owner**: Product Manager + 2 Senior Students  
**Goal**: Train all 10 students, achieve 80% adoption[19][12]

**Training Schedule:**

**Session 1 (Jan 27, 7-9 PM): AFFiNE Basics**
- Agenda:
  - Account creation & workspace invites[16]
  - Document editor (rich text, headings, lists)
  - Database views (Table, Kanban, Gallery)[12]
  - Auto-save indicator[15]
- Homework: Create 3 personal hadith entries[12]

**Session 2 (Jan 29, 7-8 PM): Nahw Diagramming**
- Agenda:
  - Whiteboard tools (shapes, arrows, text)[14]
  - I'rab tree template walkthrough[14]
  - Exporting diagrams as PNG[13]
  - Real-time collaboration demo[15]
- Homework: Draw 1 I'rab tree for: "ضَرَبَ زَيْدٌ عَمْرًا"[14]

**Session 3 (Jan 31, 7-8 PM): Collaboration Features**
- Agenda:
  - Live cursors & presence indicators[15]
  - Comment threads & @mentions[12]
  - Version history ("Time Machine")[6]
  - Search tips (Arabic + English keywords)[12]
- Homework: Comment on 2 peers' hadiths with questions[12]

**Daily Check-ins (Week 3):**
- [ ] Monitor usage analytics: Who logged in? Who created content?
- [ ] Answer questions in Telegram group (2-hour response time)
- [ ] Collect feedback via Google Form (5 questions)

**Exit Criteria:**
- [ ] 8/10 students completed homework assignments
- [ ] 50+ total hadiths created by group[12]
- [ ] 10+ Nahw diagrams in whiteboard workspace[14]
- [ ] Average satisfaction score ≥4/5 in feedback form

**Deliverables:**
- Training slides (Google Slides, shared to group)
- Video recordings of sessions (uploaded to YouTube unlisted)
- Feedback report (summary of Google Form responses)

***

### **Phase 4: Production Rollout & Monitoring (Week 4+)**

**Dates**: February 3, 2026 onwards  
**Owner**: Product Manager + Admin Team (2 students)  
**Goal**: Achieve 99.5% uptime, enter steady-state operations[3]

**Week 4 Activities:**
- [ ] Announce official "go-live" to all 10 students
- [ ] Establish 3-tier on-call rotation (see Section 10.2)
- [ ] Schedule weekly review meetings (Mondays 8 PM, 30 min)
- [ ] Begin monthly cost tracking (bandwidth, storage)

**Monthly Checkpoints (Months 2-6):**

**Month 2 (March 2026):**
- [ ] Review: Database growth (target: <2GB used)[1]
- [ ] Review: 200+ hadiths cataloged[12]
- [ ] Review: No critical incidents (Tier 3 escalations)
- [ ] Decision: Go/No-Go for Month 3 commitment

**Month 3 (April 2026):**
- [ ] Review: 500+ hadiths milestone achieved[12]
- [ ] Review: 50+ Nahw diagrams created[14]
- [ ] Review: Uptime SLA met (99.5%)[3]
- [ ] Decision: Extend to 6-month pilot OR pivot to paid plan

**Month 6 (July 2026):**
- [ ] Final evaluation: ROI analysis ($0 spent vs. $180 Notion cost)
- [ ] User satisfaction survey (10 questions, anonymous)
- [ ] Decision: Continue free tier OR upgrade to paid for features
- [ ] Knowledge transfer: Document lessons learned for next cohort

**Exit Criteria (End of Pilot):**
- [ ] Total cost: $0 (or <$60 if upgrades needed)[3]
- [ ] 500+ hadiths cataloged with full metadata[12]
- [ ] 99.5% uptime achieved (max 3.6 hrs downtime)[3]
- [ ] 8/10 students recommend platform to peers

***

## **10. OPERATIONAL MODEL**

### **10.1 Team Roles & Responsibilities**

| Role | Name | Time Commitment | Responsibilities | Escalation Path |
|------|------|----------------|------------------|----------------|
| **Product Manager / DRI** | [Your Name] | 5 hrs/week | Go/No-Go decisions, stakeholder communication, roadmap | N/A (top level) |
| **Admin 1 (Primary)** | Ahmed (Senior Student) | 3 hrs/week | Infrastructure maintenance, Tier 1 support, backups [13] | PM (30-min SLA) |
| **Admin 2 (Backup)** | [TBD Week 3] | 2 hrs/week | Backup admin, covers Ahmed's absences, documentation | Admin 1 → PM |
| **Content Curator** | Fatima (Researcher) | 5 hrs/week | Hadith database quality, narrator profiles, taxonomy | Admin 1 |
| **Training Lead** | [TBD Week 2] | 2 hrs/week | Onboard new members, maintain video tutorials [19] | PM |
| **System Architect** | Dr. Sarah Chen | 0.5 hrs/week | Code reviews, performance optimization, emergency consults | PM (4-hour SLA) |
| **Engineering Director** | Marcus Rodriguez | 0.5 hrs/week | Infrastructure reviews, vendor management, budget approval | PM (4-hour SLA) |

### **10.2 On-Call Escalation Model (NEW)**

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: Student Admins (2-hour response)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Scope:                                          │   │
│  │  - Password resets                               │   │
│  │  - "How do I...?" questions                     │   │
│  │  - Minor UI bugs (e.g., button not clickable)  │   │
│  │                                                   │   │
│  │  Tools:                                          │   │
│  │  - Telegram group (instant messaging)           │   │
│  │  - UptimeRobot dashboard (uptime checks)        │   │
│  │  - Koyeb web console (restart containers)       │   │
│  └─────────────────────────────────────────────────┘   │
│  Contact: Ahmed (@ahmed_admin) or Backup Admin         │
└─────────────────────┬───────────────────────────────────┘
                      │ Escalate if:
                      │ - Outage >30 minutes
                      │ - Data loss suspected
                      │ - Security incident
                      ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 2: Product Manager (30-minute response)           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Scope:                                          │   │
│  │  - Service outages (Koyeb/Aiven down)          │   │
│  │  - Database connection errors                    │   │
│  │  - Budget decisions (upgrade to paid tier)     │   │
│  │  - Performance degradation (>3s page loads)     │   │
│  │                                                   │   │
│  │  Tools:                                          │   │
│  │  - Aiven console (database metrics)             │   │
│  │  - BetterStack logs (error traces)              │   │
│  │  - GitHub Actions (trigger manual backups)     │   │
│  │  - Runbook (incident response procedures)      │   │
│  └─────────────────────────────────────────────────┘   │
│  Contact: PM via Telegram + Email (alerts forwarded)   │
└─────────────────────┬───────────────────────────────────┘
                      │ Escalate if:
                      │ - Data corruption detected
                      │ - Backup restore needed
                      │ - Architectural change required
                      ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 3: Technical Advisors (4-hour response)           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Scope:                                          │   │
│  │  - Database corruption / failed restores        │   │
│  │  - Security breaches (unauthorized access)      │   │
│  │  - Infrastructure redesign                       │   │
│  │  - Code-level debugging (AFFiNE bugs)          │   │
│  │                                                   │   │
│  │  Tools:                                          │   │
│  │  - PostgreSQL psql (direct DB access)          │   │
│  │  - AFFiNE source code (debugging)               │   │
│  │  - Backup repository (disaster recovery)       │   │
│  └─────────────────────────────────────────────────┘   │
│  Contact: Dr. Chen (architect) + Marcus (eng director) │
└─────────────────────────────────────────────────────────┘
```

### **10.3 Weekly Maintenance Checklist**

**Every Monday, 8:00 PM SGT (30 minutes):**

| Task | Owner | Tool | Success Criteria |
|------|-------|------|------------------|
| **1. Review uptime** | Admin 1 | UptimeRobot dashboard | ≥99.5% past 7 days [3] |
| **2. Check database size** | Admin 1 | Aiven console | <4.5GB (90% of limit) [1] |
| **3. Verify latest backup** | Admin 1 | GitHub repo commits [13] | Backup <24 hours old |
| **4. Test backup restore** | Admin 1 (monthly) | Local PostgreSQL | Restore completes in <30 min |
| **5. Review slow queries** | Admin 2 | BetterStack Logs [3] | <10 queries >500ms |
| **6. Check bandwidth usage** | PM | Koyeb dashboard | <80GB (80% of limit) [3] |
| **7. Collect user feedback** | Training Lead | Telegram poll | ≥1 suggestion captured |
| **8. Update runbook** | Admin 1 | GitHub docs/ folder | Any new incidents documented |

**Quarterly Deep Dives (Every 3 Months):**
- [ ] Full disaster recovery drill (restore from backup to staging)[13]
- [ ] Security audit (review access logs, rotate API keys)[1]
- [ ] Cost-benefit analysis (free tier vs. paid alternatives)[3]
- [ ] User satisfaction survey (Google Form, 10 questions)

***

## **11. RISK MANAGEMENT**

### **11.1 Technical Risks (Updated with Network Latency)**

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Contingency Plan |
|---------|-------------|-------------|--------|---------------------|------------------|
| **R-001** | RTL cursor bugs make Arabic input unusable [4] | Medium | **Critical** | 48-hour spike test (50 cases) Week 1 | Abort → Obsidian + Sync ($8/month) |
| **R-002** | Koyeb RAM insufficient (512MB → OOM errors) [3] | High | High | Monitor memory usage, load test Week 2 | Upgrade to Koyeb Starter ($7.20/month) |
| **R-003** | Aiven storage exhaustion (>5GB) [1] | Medium | Medium | Archive PNGs to Cloudflare R2 at 4.5GB [2] | Upgrade to Aiven Startup ($20/month) |
| **R-004** | **NEW: Network latency >1s (Koyeb ↔ Aiven)** [1] | Medium | High | PgBouncer pooling, co-locate regions [1] | Deploy PostgreSQL on Koyeb volume |
| **R-005** | Koyeb/Aiven discontinues free tier | Low | Critical | Monitor vendor announcements, 30-day notice | Migrate to Railway Hobby ($5/month) [20] |
| **R-006** | Backup corruption (undetected until needed) [13] | Low | Critical | Weekly restore tests [13] | Maintain 3 backup copies (daily/weekly/monthly) |
| **R-007** | **NEW: PgBouncer misconfiguration causes connection drops** [1] | Medium | High | Test pool settings Week 2, monitor error logs [3] | Temporarily disable PgBouncer, direct connect |

### **11.2 Operational Risks**

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Contingency Plan |
|---------|-------------|-------------|--------|---------------------|------------------|
| **R-008** | Low user adoption (<5 active students) | Medium | High | Mandatory usage first month, incentivize contributions | Survey non-users, address pain points |
| **R-009** | Admin burnout (Ahmed quits) | Medium | High | Train backup admin Week 3, 3-tier escalation | PM assumes admin duties temporarily |
| **R-010** | Data loss during migration (50 hadiths lost) | Low | Critical | Dual-run with AFFiNE Cloud for 2 weeks [7] | Restore from GitHub backup [13] |
| **R-011** | Graduation/turnover (group dissolves) | High (long-term) | Low | Knowledge transfer docs, admin rotation | Archive to GitHub, sunset service gracefully |
| **R-012** | **NEW: Complex debugging across 3 services** | High | Medium | Maintain architecture diagram, runbook [1][3] | Hire external consultant ($50/hour, max 4 hours) |

### **11.3 Business/Budget Risks**

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Contingency Plan |
|---------|-------------|-------------|--------|---------------------|------------------|
| **R-013** | Free tier limits exceeded (bandwidth >100GB) [3] | Low | Medium | Block file uploads at 90GB | Upgrade to Koyeb Starter ($7.20/month) |
| **R-014** | Unexpected costs (e.g., R2 overage charges) [2] | Low | Low | Set billing alerts at $5, monitor monthly | Cap R2 at 9GB (stay under free tier) |
| **R-015** | Opportunity cost (DevOps time vs. paid SaaS) | Medium | Medium | Track time spent (target: <5 hrs/week) | If >10 hrs/week, switch to AFFiNE Pro ($6.75/month) [6] |

***

## **12. SUCCESS METRICS & KPIs**

### **12.1 Pilot Phase Objectives & Key Results (OKRs)**

#### **Objective 1: Achieve Production Stability**

| Key Result | Target | Measurement | Current Status | Owner |
|------------|--------|-------------|----------------|-------|
| **KR1.1**: Uptime SLA | 99.5% monthly [3] | UptimeRobot dashboard | TBD Week 4 | Admin 1 |
| **KR1.2**: Page load time | <2s (95th percentile) [3] | Chrome DevTools Network | TBD Week 2 | Engineering |
| **KR1.3**: Zero data loss events | 0 incidents | GitHub backup logs [13] | TBD Week 4 | Admin 1 |
| **KR1.4**: Mean Time to Recovery | <4 hours | Incident postmortems | TBD (if incidents occur) | PM |

#### **Objective 2: Drive User Adoption**

| Key Result | Target | Measurement | Current Status | Owner |
|------------|--------|-------------|----------------|-------|
| **KR2.1**: Active weekly users | 8/10 students (80%) | AFFiNE analytics [12] | TBD Week 4 | PM |
| **KR2.2**: Hadith entries cataloged | 500+ by Month 3 [12] | Database query | TBD Month 3 | Content Curator |
| **KR2.3**: Nahw diagrams created | 50+ by Month 3 [14] | Whiteboard count | TBD Month 3 | Training Lead |
| **KR2.4**: User satisfaction | ≥4/5 average rating | Google Form survey | TBD Month 3 | PM |

#### **Objective 3: Maintain Zero-Cost Operations**

| Key Result | Target | Measurement | Current Status | Owner |
|------------|--------|-------------|----------------|-------|
| **KR3.1**: Database storage | <4.5GB (90% of 5GB) [1] | Aiven console | TBD Week 4 | Admin 1 |
| **KR3.2**: Monthly bandwidth | <80GB (80% of 100GB) [3] | Koyeb dashboard | TBD Week 4 | PM |
| **KR3.3**: Total cost | $0 spent | Expense tracking | $0 (as of Week 1) | PM |
| **KR3.4**: DevOps time | <5 hrs/week | Time logs | TBD Week 4 | Admin 1 |

### **12.2 Go/No-Go Decision Criteria**

#### **Checkpoint 1: Week 1 (RTL Gate)**
**Date**: January 14, 2026, 5:00 PM SGT

| Criterion | Pass Threshold | Action if Failed |
|-----------|----------------|------------------|
| RTL test pass rate | ≥90% (45/50 tests) [4] | Abort → Pivot to Obsidian + Sync |
| Cursor positioning | Zero jumps in mixed text [4] | Evaluate workarounds OR abort |
| Mobile RTL support | Works on iOS Safari + Android Chrome [14] | Desktop-only deployment (risky) |

**Decision**: PM makes final call within 24 hours of test completion.

***

#### **Checkpoint 2: Month 1 (Performance Gate)**
**Date**: February 11, 2026

| Criterion | Pass Threshold | Action if Failed |
|-----------|----------------|------------------|
| Uptime | ≥99% (7.2 hrs downtime acceptable) [3] | Extend evaluation to Month 2 |
| Active users | ≥6/10 students (60%) | User interviews to diagnose adoption barriers |
| Page load time | <3s (95th percentile) [3] | Upgrade to Koyeb Starter OR optimize queries |
| Critical incidents | ≤1 Tier 3 escalation | Root cause analysis + runbook update |

**Decision**: 
- ✅ **GO**: All criteria met → Lock in for exam prep
- ⚠️ **CAUTION**: 1-2 criteria missed → Extend to Month 2
- ❌ **NO-GO**: 3+ criteria missed → Migrate to Notion Plus ($30/month)

***

#### **Checkpoint 3: Month 3 (Commitment Gate)**
**Date**: April 11, 2026

| Criterion | Pass Threshold | Action if Failed |
|-----------|----------------|------------------|
| Hadith entries | ≥500 cataloged [12] | Acceptable if ≥400 (80% of target) |
| Uptime SLA | 99.5% average (Months 1-3) [3] | Switch to paid plan for reliability |
| User satisfaction | ≥4/5 average [12] | Survey: "What would make this a 5/5?" |
| Cost | $0 OR <$30/month if upgrades needed [3] | Compare to Notion Plus ($30/month) ROI |

**Decision**:
- ✅ **GO**: Extend to 6-month pilot
- 🔄 **PIVOT**: Upgrade to AFFiNE Pro if features needed ($6.75/month)[6]
- ❌ **NO-GO**: Deprecate, export to Notion, conduct retrospective

***

## **13. DEPENDENCIES & INTEGRATIONS**

### **13.1 External Services**

| Service | Purpose | API/Protocol | SLA | Contingency |
|---------|---------|--------------|-----|-------------|
| **GitHub** | Version control, backups [13] | Git
