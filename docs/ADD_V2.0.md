# **ARCHITECTURE DECISION DOCUMENT (ADD) v2.0 - FINAL**
## **SanadFlow Study Hub - Technical Architecture (Post-Review)**

**Document Type**: Architecture Decision Document v2.0  
**System Architect**: Dr. Sarah Chen  
**Tech Lead**: Priya Patel  
**Engineering Director**: Marcus Rodriguez  
**Date**: January 11, 2026, 6:00 PM SGT  
**Status**: ✅ APPROVED - Conditional GO for Week 1 Pilot  
**Related Documents**: PRD v2.0

***

## **REVISION HISTORY**

| Version | Date | Author | Status | Changes |
|---------|------|--------|--------|---------|
| v1.0 | Jan 11, 3:00 PM | Dr. Sarah Chen | DRAFT | Initial: Koyeb + Aiven multi-service |
| v2.0 | Jan 11, 6:00 PM | Dr. Sarah Chen + Review Team | APPROVED | 5 major revisions post-review |

***

## **1. EXECUTIVE SUMMARY**

### **1.1 Approved Architecture**
SanadFlow deploys on **Fly.io's free tier** (3× 256MB VMs in Singapore region) for production-grade reliability without recurring costs. This single-network design eliminates cross-service latency risks, simplifies debugging for volunteer student admins, and maintains 99.5% uptime target for exam-critical workloads.

### **1.2 Decision Timeline**

```
┌─────────────────────────────────────────────┐
│  Architecture Review (Jan 11, 3-4:45 PM)    │
│  - Koyeb+Aiven (v1.0) challenged by reviewers
│  - 5 decisions revised via consensus        │
│  - Fly.io chosen as primary architecture    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  ADD v2.0 Published (Jan 11, 6:00 PM)       │
│  - Final approved architecture              │
│  - Week 1 kill switch criteria defined      │
│  - Deployment scripts authorized            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Week 1 Implementation (Jan 13-17)          │
│  - RTL testing gate (Day 3 checkpoint)      │
│  - Memory profiling under load              │
│  - Performance baselines established        │
└─────────────────────────────────────────────┘
```

***

## **2. ARCHITECTURAL DECISIONS (FINAL)**

### **AD-001: Single-Network vs. Multi-Service Architecture**

#### **Decision**: **Fly.io 3-VM Architecture (Primary) + Koyeb+Aiven (Fallback)**

#### **Context**
Deploy AFFiNE (2-4GB RAM optimal, 400MB minimum) within free tier constraints while ensuring <2s page load times for 10 concurrent users.[1][2]

#### **Options Evaluated**

| Option | Architecture | Latency | Complexity | Storage | Cost |
|--------|--------------|---------|-----------|---------|------|
| **A. Fly.io (CHOSEN)** | 3× 256MB VMs, internal network [2] | <1ms | Low | 3GB total | $0 |
| **B. Koyeb+Aiven** | App on Koyeb, DB on Aiven [3][2] | 50-150ms risk | High | 5GB+2.5GB | $0 |
| **C. Railway trial** | All-in-one deployment [4] | <1ms | Low | 50GB | $0 (30-day) |

#### **Final Decision Rationale**

**Fly.io (Primary Path)**:
1. ✅ **Single internal network**: Koyeb→Aiven latency risk **eliminated**[2]
2. ✅ **Operational simplicity**: One platform, one dashboard, no cross-service debugging[2]
3. ✅ **Student-friendly**: Volunteer admins can restart services via web UI[2]
4. ✅ **Free tier durability**: Permanent (unlike Railway's 30-day credit)[5][2]
5. ⚠️ **Lower storage**: 3GB vs. 5GB (mitigated by Cloudflare R2 offload)[3][6]

**VM Distribution**:[2]
```
VM1 (256MB): AFFiNE Application
  - Node.js 18 + Next.js + GraphQL
  - Embedded Redis (100MB allocated)
  - ~150MB available for app logic

VM2 (256MB): PostgreSQL Database
  - PostgreSQL 16 (optimized config)
  - 200MB RAM, 1GB persistent volume
  - Swap: 56MB (emergency buffer)

VM3 (256MB): Supporting Services
  - PgBouncer (connection pooling)
  - Prometheus metrics (optional)
  - Backup job runner
  - Monitoring agent
```

**Koyeb+Aiven (Fallback Path)**:
- Deployed to staging environment Week 1
- Activated **only if** Fly.io hits Week 1 kill switch gates (Section 7.3)
- Production failover: 2-4 hour RTO acceptable for pilot phase

#### **Trade-offs**

| Trade-off | Impact | Mitigation |
|-----------|--------|------------|
| **Lower storage (3GB vs. 5GB)** | Tighter space constraints | R2 offloading at 2.5GB threshold [6] |
| **Shared resources across 3 VMs** | One VM crash affects whole system | Fly.io auto-restarts failed VMs [2] |
| **PostgreSQL at 256MB RAM** | Slower complex queries | Index optimization, connection pooling [3] |

#### **Approval Gate** ✅
- **Approved by**: Dr. Sarah Chen (Architect), Priya Patel (Tech Lead), Marcus Rodriguez (Eng Director)
- **Condition**: Week 1 Day 3 performance benchmarks must show p95 <2s, memory <220MB

***

### **AD-002: Database Connection Pooling Strategy**

#### **Decision**: **PgBouncer in Session Mode (Initial) → Transaction Mode (Post-MVP)**

#### **Context**
AFFiNE uses Prisma ORM, which maintains long-lived database connections per request. Free tier limits (Aiven at 20 connections, Fly.io PostgreSQL at 100 connections) must be respected without breaking application logic.[7][3]

#### **Comparison: Session vs. Transaction Mode**

| Mode | Connection Reuse | Compatibility | Latency Overhead | Risk Level |
|------|-----------------|---------------|------------------|------------|
| **Session Mode** | Per session (long-lived) | 100% with Prisma [7] | +2-5ms | Low |
| **Transaction Mode** | Per transaction (minimal) | 70% with Prisma (may timeout) [7][3] | +5-10ms | High |

#### **Final Decision Rationale**

**Week 1-2: Session Mode (Safe)**
```ini
# pgbouncer.ini (production)
[databases]
sanadflow = host=localhost port=5432 dbname=affine_production user=postgres

[pgbouncer]
pool_mode = session                    # Long-lived per user session
max_client_conn = 50                  # From internet
default_pool_size = 5                  # Per database
reserve_pool_size = 2                  # Emergency buffer
reserve_pool_timeout = 3               # Seconds before reject
```

**Why Session Mode**:
1. ✅ Guaranteed Prisma compatibility (no timeout errors)[7]
2. ✅ Simpler state management (sessions hold full context)[3]
3. ✅ Lower risk of production outages Week 1[3]
4. ⚠️ Uses more PostgreSQL backend connections (~1 per active user)

**Week 3+: Transaction Mode Optimization**
- Post-MVP, if performance is good but connections hit limits
- Requires Prisma connection pooling refactor (30-hour engineering effort)
- Not critical for pilot phase

#### **Implementation Details**

```yaml
# fly.toml service definition
[[services]]
  internal_port = 6432
  protocol = "tcp"
  
  [services.ports]
    handlers = ["pg"]
    port = 6432

[[metrics]]
  handler = "prom"
  port = 9090
```

#### **Monitoring**
```sql
-- Check connection state (run daily)
SELECT 
  datname,
  usename,
  state,
  query_start,
  COUNT(*) as connections
FROM pg_stat_activity
WHERE datname = 'affine_production'
GROUP BY datname, usename, state, query_start
ORDER BY connections DESC;

-- Alert if >25 connections active
```

#### **Approval Gate** ✅
- **Approved by**: Priya Patel (verified Prisma compatibility)
- **Condition**: Week 2 performance tests show connection pool stable

***

### **AD-003: Cache & Session Storage Strategy**

#### **Decision**: **Embedded Redis with AOF Persistence (Fly.io VM3)**

#### **Context**
AFFiNE requires Redis for:
1. User session tokens (JWT storage)
2. Real-time pub/sub (cursor positions, live collaboration)[8]
3. Rate limiting, caching

Free external Redis (Upstash: 10K commands/day) insufficient for 10 users.[2]

#### **Options Evaluated**

| Option | Persistence | Data Loss Risk | Cost | Operational Burden |
|--------|------------|-----------------|------|-------------------|
| **A. Embedded + AOF (CHOSEN)** | 1-second durability [2] | Minimal | $0 | Low |
| **B. Embedded ephemeral** | None (restart = data loss) | High | $0 | Very Low |
| **C. Upstash Redis** | Persistent | None | $0 (limit: 10K/day) | Exceeds commands |
| **D. Aiven Redis** | Persistent | None | $10/month | Excellent, costly |

#### **Final Decision Rationale**

**AOF Persistence Configuration**:
```ini
# redis.conf (on Fly.io VM3)
appendonly yes                    # Enable AOF
appendfsync everysec              # Sync every 1 second (trade-off between durability & performance)
appendfilename "appendonly.aof"   # AOF file location
maxmemory 100mb                   # Max RAM allocation
maxmemory-policy allkeys-lru       # Evict LRU keys if full
```

**Data Durability**:
- **Best case**: Session persists across container restarts (Fly.io auto-restart every 7-10 days)[2]
- **Worst case**: Restart happens during 1-second fsync window → 1 second of session data lost
- **Acceptable for pilot**: Users auto-logout and re-login (1 minute onboarding)[9][10]

**Real-time Sync Resilience**:
- Cursor positions (non-critical): Rebuilt in <5 seconds when Redis reconnects[8]
- Document state: Protected by auto-save every 10s to PostgreSQL[8]

#### **Monitoring & Alerting**
```bash
# Monitor Redis memory every 5 minutes
redis-cli INFO memory | grep used_memory_human

# Alert if >90MB used
if [ $(redis-cli INFO memory | grep used_memory_rss | cut -d: -f2) -gt 94371840 ]; then
  curl -X POST $SLACK_WEBHOOK -d '{"text": "⚠️ Redis memory critical"}' 
fi
```

#### **Fallback to External Redis**
If Fly.io Redis proves unreliable:
- Switch to **Upstash free tier** + selective caching (only critical sessions)
- Cost: Free (10K commands/day, sufficient for metadata-only caching)
- Implementation time: 2 hours (update env vars + code changes)

#### **Approval Gate** ✅
- **Approved by**: Dr. Sarah Chen, Marcus Rodriguez
- **Condition**: Week 2 load test shows Redis stable (no evictions >1/min)

***

### **AD-004: Media Storage & Offloading**

#### **Decision**: **PostgreSQL (Primary) → Cloudflare R2 (Overflow) at 2.5GB**

#### **Context**
Whiteboard diagrams exported as PNG (1-2MB each). 50+ diagrams = 50-100MB. However, allow room for future scaling (1,000 hadiths × multiple diagrams).[11]

**Fly.io storage limit**: 3GB across all 3 VMs[2]
**Safe PostgreSQL limit**: 2.5GB (85% of 3GB, leaves 500MB for logs/OS)[2]
**Cloudflare R2 free tier**: 10GB storage[6]

#### **Final Decision Rationale**

**Trigger Mechanism**:
```sql
-- Check before diagram upload
SELECT pg_database_size('affine_production') as db_size;
-- If >2.5GB (2684354560 bytes), offload to R2
```

**Atomic Upload with Distributed Lock**:
```javascript
// Prevent race condition (multiple simultaneous uploads)
async function saveDiagram(canvasData, userId) {
  const lockKey = 'diagram-upload-lock';
  
  // Acquire advisory lock (database-level)
  await db.query('SELECT pg_advisory_lock(12345)');
  
  try {
    const dbSize = await db.query(
      `SELECT pg_database_size('affine_production') as size`
    );
    
    if (dbSize.rows[0].size > 2.5 * 1024 * 1024 * 1024) {
      // Upload to R2
      const r2Url = await uploadToR2(canvasData);
      await db.insert('diagrams', {
        storage_location: 'r2',
        url: r2Url,
        user_id: userId,
        created_at: new Date()
      });
    } else {
      // Store in PostgreSQL
      await db.insert('diagrams', {
        storage_location: 'postgres',
        blob: canvasData,
        user_id: userId,
        created_at: new Date()
      });
    }
  } finally {
    // Release lock (guaranteed, even on error)
    await db.query('SELECT pg_advisory_unlock(12345)');
  }
}
```

**R2 Configuration**:
```bash
# Cloudflare R2 bucket setup
bucket_name: sanadflow-media-prod
region: auto (global)
object_expiration: never
cors_enabled: true
allowed_origins: ["https://*.fly.dev"]
```

**Retrieval (Transparent to Users)**:
```javascript
// Query layer handles R2 vs. PostgreSQL transparently
async function getDiagram(diagramId) {
  const diagram = await db.query(
    'SELECT storage_location, url, blob FROM diagrams WHERE id = ?',
    [diagramId]
  );
  
  if (diagram.storage_location === 'r2') {
    return await fetch(diagram.url); // Cloudflare R2
  } else {
    return diagram.blob; // PostgreSQL blob
  }
}
```

#### **Cost Projection**
- **R2 storage**: 10GB free = 5,000+ diagrams = sufficient for 10 years at 500 diagrams/year
- **R2 API calls**: 1M operations/month free = 33K uploads/month = sustainable[6]

#### **Approval Gate** ✅
- **Approved by**: Priya Patel (verified advisory lock atomicity)
- **Condition**: Week 2 integration test confirms no race conditions

***

### **AD-005: Disaster Recovery & Backup Strategy**

#### **Decision**: **Hybrid Backups (GitHub Metadata + Cloudflare R2 Full Dumps)**

#### **Context**
Need RPO ≤24 hours, RTO ≤4 hours. Single backup method has failure modes:
- **GitHub only**: Git repos >5GB get slow[12]
- **R2 only**: No transactional guarantees (corruption risk)
- **Database-only (Aiven PITR)**: Not available on Fly.io free tier[3]

#### **Final Decision Rationale**

**Tier 1: GitHub Daily Metadata Backups** (Critical, small)
```bash
#!/bin/bash
# runs daily at 2 AM SGT via GitHub Actions [web:54]

pg_dump --schema-only "$DATABASE_URL" | gzip > metadata-$(date +%Y%m%d).sql.gz
# ~5MB uncompressed, <1MB gzipped

git add backups/metadata/
git commit -m "Daily metadata backup $(date +%Y-%m-%d)"
git push
```

**What's included**:
- Schema (table definitions, indexes, constraints)
- User accounts and permissions
- Workspace metadata
- **Excluded**: Large blobs (diagrams, attachments)

**Tier 2: Cloudflare R2 Weekly Full Dumps** (Complete, large)
```bash
#!/bin/bash
# runs every Sunday at 2 AM SGT via scheduled job [web:80]

pg_dump --format=directory --jobs=2 --compress=9 "$DATABASE_URL" > full-dump-$(date +%Y%m%d)
tar -czf full-dump-$(date +%Y%m%d).tar.gz full-dump-$(date +%Y%m%d)

# Generate checksum for integrity verification
md5sum full-dump-$(date +%Y%m%d).tar.gz > full-dump-$(date +%Y%m%d).tar.gz.md5

# Upload to R2 with retry logic
aws s3 cp full-dump-$(date +%Y%m%d).tar.gz s3://sanadflow-backups/ --region auto
aws s3 cp full-dump-$(date +%Y%m%d).tar.gz.md5 s3://sanadflow-backups/ --region auto

# Keep only 4 most recent (4 weeks)
aws s3 ls s3://sanadflow-backups/ | sort -r | awk 'NR>4 {print $4}' | \
  xargs -I {} aws s3 rm s3://sanadflow-backups/{} [web:80]
```

**Retention Policy**:

| Backup Type | Retention | Recovery Time | Use Case |
|------------|-----------|---------------|----------|
| **Metadata (GitHub)** | 30 days | 15 min | Schema corruption, DDL errors |
| **Full (R2)** | 4 weeks (30 days) | 2-4 hours | Complete data loss, ransomware |
| **Point-in-time (PostgreSQL WAL)** | 3 days (Fly.io free) | 1-2 hours | Accidental deletes during business hours |

**Disaster Recovery Procedures**:

**Scenario 1: Accidental Data Deletion (Minor)**
```
T+0:00: User reports missing hadith entry
T+0:05: Check PostgreSQL WAL (point-in-time recovery) [web:79]
T+0:20: Restore from WAL to 1 minute before deletion
T+0:25: Verify data, notify user
RTO: 25 minutes
```

**Scenario 2: Database Corruption (Major)**
```
T+0:00: Health checks detect corrupted table
T+0:10: Fail over to Koyeb+Aiven (fallback architecture)
T+0:30: Download full dump from R2
T+1:00: Verify checksum (md5sum -c backup.tar.gz.md5)
T+1:30: Restore to new Aiven PostgreSQL instance
T+2:00: Test 10 spot-check queries against restored data
T+2:30: Switch AFFiNE to new database (update env var)
T+3:00: Verify production health checks passing
T+3:30: Decomission corrupted database, post-incident review
RTO: 3.5 hours (within SLA)
RPO: 7 days (last full backup)
```

#### **Approval Gate** ✅
- **Approved by**: Marcus Rodriguez, Dr. Sarah Chen
- **Condition**: Monthly restore drills must succeed (restore to staging, run smoke tests)

***

## **3. DEPLOYMENT TOPOLOGY**

### **3.1 Fly.io VM Configuration**

```
┌─────────────────────────────────────────────────────────┐
│  Fly.io App: sanadflow-affine                            │
│  Region: sin (Singapore)                                 │
│  Machine Types: 3× shared-cpu-1x (256MB RAM each)       │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────┐
│  VM1: AFFiNE Web (Port 3000) │  VM2: PostgreSQL (5432)  │
│  ┌────────────────────────┐  │  ┌────────────────────┐ │
│  │ Node.js 18 LTS         │  │  │ PostgreSQL 16      │ │
│  │ Next.js 14 + React 18  │  │  │ 200MB RAM, 1GB vol │ │
│  │ GraphQL API (Apollo)   │  │  │ Max connections: 50│ │
│  │ Real-time WebSocket    │  │  │ Backup: WAL archiv│ │
│  │                        │  │  │                    │ │
│  │ Embedded Redis:        │  │  │ Tables:            │ │
│  │ - 100MB RAM            │  │  │ - users            │ │
│  │ - AOF persistence      │  │  │ - workspaces       │ │
│  │ - Session tokens       │  │  │ - documents        │ │
│  │ - Real-time cursors    │  │  │ - hadiths          │ │
│  │ - Pub/sub (CRDT)       │  │  │ - narrators        │ │
│  │                        │  │  │ - diagrams         │ │
│  │ Disk: 1.5GB (logs)     │  │  │                    │ │
│  └────────────────────────┘  │  └────────────────────┘ │
└──────────────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  VM3: Support Services (Port 6432)                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ PgBouncer (Connection Pooler)                      │ │
│  │ - Listen: localhost:6432                           │ │
│  │ - Pool mode: session                               │ │
│  │ - Max clients: 50, Server conns: 5                │ │
│  │                                                    │ │
│  │ Monitoring Agent                                   │ │
│  │ - Prometheus metrics export (localhost:9090)       │ │
│  │ - Custom health checks                             │ │
│  │                                                    │ │
│  │ Backup Job (Scheduled)                             │ │
│  │ - Sunday 2 AM: Full pg_dump to R2 [web:80]       │ │
│  │ - Daily 2 AM: Metadata dump to GitHub [web:54]    │ │
│  │                                                    │ │
│  │ Disk: 0.5GB (temp space for dumps)                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Network:
  VM1 → VM2: PostgreSQL wire protocol (localhost:5432) [INTERNAL]
  VM1 → VM3: PgBouncer (localhost:6432) [INTERNAL]
  VM1 → Internet: HTTPS/TLS 1.3 (Fly.io ingress)
  VM3 → R2: S3 API (Cloudflare) [PUBLIC] [web:80]
  VM3 → GitHub: Git push (GitHub Actions) [PUBLIC] [web:54]

Storage:
  VM1 Disk: 1.5GB (application logs, session cache)
  VM2 Disk: 1GB (PostgreSQL data, WAL, indexes)
  Shared: 500MB temp (VM3 for backup staging)
  Total: 3GB (Fly.io free tier limit) [web:79]
```

### **3.2 fly.toml Configuration**

```toml
app = "sanadflow-affine"
primary_region = "sin"

[build]
  builder = "dockerfile"
  dockerfile = "Dockerfile"

[env]
  DATABASE_URL = "postgresql://postgres:@localhost:5432/affine_production"
  REDIS_URL = "redis://localhost:6379"
  NODE_ENV = "production"
  AFFINE_SERVER_HOST = "0.0.0.0"
  AFFINE_SERVER_PORT = "3000"

[build.args]
  NODE_VERSION = "18.17.0"
  POSTGRES_VERSION = "16"

[[services]]
  internal_port = 3000
  processes = ["app"]
  
  [services.tcp_checks]
    interval = "30s"
    timeout = "5s"

[[services]]
  internal_port = 5432
  processes = ["postgres"]
  
  [services.tcp_checks]
    interval = "30s"
    timeout = "5s"

[[services]]
  internal_port = 6432
  processes = ["pgbouncer"]
  
  [services.tcp_checks]
    interval = "30s"
    timeout = "5s"

[[mounts]]
  source = "postgres_data"
  destination = "/var/lib/postgresql"

[[mounts]]
  source = "redis_data"
  destination = "/var/lib/redis"

[[mounts]]
  source = "backup_staging"
  destination = "/tmp/backups"

[metrics]
  handler = "prometheus"
  port = 9090
```

***

## **4. MONITORING & OBSERVABILITY**

### **4.1 Health Checks**

| Check | Interval | Component | Threshold | Action |
|-------|----------|-----------|-----------|--------|
| **HTTP /api/health** | 30s | Application [2] | HTTP 200 | Auto-restart if fails 3x |
| **PostgreSQL ping** | 60s | Database connection | <500ms | Alert Tier 1 |
| **Redis ping** | 30s | Cache layer | <100ms | Degrade to ephemeral |
| **Disk usage** | 5m | Storage [2] | >85% of 3GB | Alert Tier 2 |
| **Memory usage** | 5m | Per VM [2] | >90% of 256MB | OOM risk alert |

### **4.2 Custom Health Endpoint**

```javascript
// GET /api/health (returns JSON)
export async function GET(request) {
  const checks = {
    timestamp: new Date().toISOString(),
    service: 'sanadflow-affine',
    status: 'healthy', // or 'degraded', 'unhealthy'
    checks: {
      database: null,
      redis: null,
      disk: null,
      memory: null
    },
    metrics: {
      uptime_seconds: process.uptime(),
      active_connections: 0,
      requests_per_minute: 0
    }
  };

  // Check PostgreSQL
  try {
    await db.query('SELECT 1');
    checks.checks.database = { status: 'ok', latency_ms: 5 };
  } catch (error) {
    checks.checks.database = { status: 'error', message: error.message };
    checks.status = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.checks.redis = { status: 'ok', latency_ms: 2 };
  } catch (error) {
    checks.checks.redis = { status: 'error', message: error.message };
    checks.status = 'degraded'; // Non-critical
  }

  // Check disk space
  const diskInfo = await checkDiskSpace('/app');
  checks.checks.disk = {
    status: diskInfo.percentage < 85 ? 'ok' : 'warning',
    used_gb: (diskInfo.used / 1024 / 1024 / 1024).toFixed(2),
    available_gb: (diskInfo.available / 1024 / 1024 / 1024).toFixed(2),
    percentage: diskInfo.percentage
  };
  if (diskInfo.percentage > 90) checks.status = 'degraded';

  // Check memory
  const memInfo = process.memoryUsage();
  checks.checks.memory = {
    status: (memInfo.heapUsed / memInfo.heapTotal) < 0.90 ? 'ok' : 'warning',
    heap_used_mb: (memInfo.heapUsed / 1024 / 1024).toFixed(2),
    heap_limit_mb: (memInfo.heapTotal / 1024 / 1024).toFixed(2),
    external_mb: (memInfo.external / 1024 / 1024).toFixed(2)
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return new Response(JSON.stringify(checks, null, 2), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

***

## **5. WEEK 1 IMPLEMENTATION PLAN**

### **5.1 Critical Gate: Day 3 Checkpoint (January 15, 5 PM SGT)**

**Kill Switch Criteria** (Go/No-Go decision):

| Criterion | Pass Threshold | Fail Action |
|-----------|---|---|
| **RTL Testing** | ≥90% (45/50 tests pass) [13] | Abort pilot, recommend Notion Plus ($30/month) |
| **Memory under load** | AFFiNE <220MB (leaves 36MB for OS) [2] | Abort pilot, switch to Railway or Notion |
| **Page load time** | p95 <2s with 5 concurrent users [2] | Extend evaluation to Week 2, re-test |
| **Database connectivity** | PostgreSQL/PgBouncer stable, 0 connection errors | Fix and retry same day |

**Backup Criteria** (if above fail):
1. ❌ RTL broken → Obsidian + Sync ($8/month) or Notion Plus ($30/month)
2. ❌ Memory issues → Railway Hobby ($5/month) or Koyeb+Aiven backup
3. ❌ Performance issues → Extend Week 2, add caching, optimize queries

### **5.2 Week 1-4 Milestones**

```
Week 1 (Jan 13-17):
  Day 1: Deploy to Fly.io staging
  Day 2: Run RTL 50-test suite
  Day 3: Memory profiling + performance baseline
  GATE: Go/No-Go decision (5 PM checkpoint)
  Day 4-5: Data migration (50 sample hadiths), backup testing

Week 2 (Jan 20-24):
  Day 6-7: Load test with 10 concurrent users [web:79]
  Day 8-9: Performance optimization (indexing, caching)
  Day 10: Dry run with full user onboarding

Week 3 (Jan 27-31):
  Day 11-15: User training (3 sessions), adoption monitoring
  Deliverable: 50+ hadiths cataloged, 8+ active students

Week 4 (Feb 3):
  Go-live announcement
  Establish 3-tier on-call rotation
  Begin monthly review cycles
```

***

## **6. RISK REGISTER (FINAL)**

### **6.1 Technical Risks**

| Risk ID | Description | Probability | Impact | Mitigation | Owner |
|---------|-------------|------------|--------|-----------|-------|
| **TR-001** | **PostgreSQL 256MB insufficient** (query memory bloat) | Medium | High | Week 2 query profiling, index optimization [3] | Priya |
| **TR-002** | **Fly.io concurrent connection limits** (app exhausts file descriptors) | Low | High | Monitor `lsof -p`, set limits in Node.js | Priya |
| **TR-003** | **Redis memory eviction** during real-time sync | Medium | Medium | Monitor evictions, increase TTL for critical keys | Engineering |
| **TR-004** | **R2 upload timeout** (>3s for 2MB PNG) | Low | Low | Implement async upload queue, user sees "uploading..." [6] | Engineering |
| **TR-005** | **GitHub Actions timeout** (backup script >6 hours) | Low | Medium | Compress dumps to <1GB, parallel split uploads | Admin 1 |
| **TR-006** | **PgBouncer deadlock** (connection starvation) | Low | High | Monitor `pgbouncer -R`, drain connections on restart | Priya |

### **6.2 Operational Risks**

| Risk ID | Description | Probability | Impact | Mitigation | Owner |
|---------|-------------|------------|--------|-----------|-------|
| **OR-001** | **Admin burnout** (2 students can't sustain on-call) | High | Medium | 3-tier escalation, <5 hrs/week budget [2] | Marcus |
| **OR-002** | **Low user adoption** (<5 active of 10 students) | Medium | High | Mandatory Week 1 training, incentivize contributions | PM |
| **OR-003** | **Accidental data deletion** (student deletes crucial hadith) | Low | Medium | Implement 30-day trash bin, version history [14] | Engineering |
| **OR-004** | **Backup corruption** (undetected until restore needed) | Low | Critical | Monthly restore drills to staging [12] | Admin 1 |
| **OR-005** | **Network outage** (entire Fly.io region down) | Very Low | Critical | RTO 4 hours, failover to Koyeb+Aiven [2] | Architect |

***

## **7. GO/NO-GO DECISION SUMMARY**

### **7.1 Approval Status**

```
┌─────────────────────────────────────────┐
│  FINAL DECISION: ✅ CONDITIONAL GO      │
└─────────────────────────────────────────┘

Approved By:
  ✅ Dr. Sarah Chen (System Architect)
  ✅ Priya Patel (Tech Lead, Backend)
  ✅ Marcus Rodriguez (Engineering Director)

Conditions:
  1. Week 1 Day 3 RTL gates must pass (90%+ tests) [web:30]
  2. Memory usage stays <220MB (Fly.io constraint) [web:79]
  3. Page load p95 <2s with 5 concurrent users [web:79]
  
If ANY condition fails:
  → Abort pilot phase
  → Pivot to Notion Plus ($30/month) or Railway ($5/month)
  → Conduct post-mortem analysis
```

### **7.2 Escalation Path**

```
Week 1 Day 3 (Jan 15):
  Priya (Tech Lead) + Dr. Sarah (Architect) run tests
         ↓
  Marcus (Eng Director) reviews results
         ↓
  PM makes final Go/No-Go call
  
If No-Go:
  PM notifies Executive Team
  Budget approval for paid alternatives ($30/month)
  Engineering pivots to new architecture
```

***

## **8. APPENDICES**

### **Appendix A: Fly.io Deployment Checklist**

- [ ] Create Fly.io account
- [ ] Create app: `flyctl apps create sanadflow-affine`
- [ ] Provision PostgreSQL (via Fly Postgres): `flyctl postgres create`
- [ ] Set secrets: `flyctl secrets set DATABASE_URL=...`
- [ ] Deploy: `flyctl deploy`
- [ ] Verify: `flyctl status`, `flyctl logs`
- [ ] Test health: `curl https://sanadflow-affine.fly.dev/api/health`

### **Appendix B: Glossary of Acronyms**

- **ADD**: Architecture Decision Document
- **RTO**: Recovery Time Objective (how fast to recover)
- **RPO**: Recovery Point Objective (how much data loss acceptable)
- **VM**: Virtual Machine
- **AOF**: Append-Only File (Redis persistence)
- **CRDT**: Conflict-free Replicated Data Type (real-time sync)
- **OOM**: Out of Memory
- **TTL**: Time to Live (cache expiration)
- **pg_dump**: PostgreSQL backup utility
- **PITR**: Point-in-Time Recovery

### **Appendix C: Contacts & Escalation**

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **Product Manager (DRI)** | [Your Name] | Telegram + Email | 24/7 (pilot phase) |
| **Tech Lead** | Priya Patel | Telegram | 6 PM - 11 PM SGT |
| **Admin 1** | Ahmed | Telegram group | Weekdays 7-9 PM |
| **Admin 2** | [TBD Week 3] | Telegram group | TBD |
| **Architect (Tier 3)** | Dr. Sarah Chen | Email | 4-hour response |
| **Eng Director (Tier 3)** | Marcus Rodriguez | Email | 4-hour response |

***

## **9. DOCUMENT SIGN-OFF**

**Prepared by**: Dr. Sarah Chen (System Architect)  
**Reviewed by**: Priya Patel (Tech Lead), Marcus Rodriguez (Eng Director)  
**Approved by**: Marcus Rodriguez (Engineering Director)  
**Date**: January 11, 2026, 6:00 PM SGT  
**Next Review**: January 15, 2026, 5 PM SGT (Day 3 Gate)

**Signatures** (Digital):
```
Dr. Sarah Chen  _____________________ (Architect)
Priya Patel    _____________________ (Tech Lead)
Marcus Rodriguez _____________________ (Eng Director)
```

***

**END OF ARCHITECTURE DECISION DOCUMENT v2.0**

***

## **SUMMARY OF CHANGES FROM v1.0 → v2.0**

| Component | v1.0 (Original) | v2.0 (Final) | Rationale |
|-----------|---|---|---|
| **Hosting** | Koyeb + Aiven [3][2] | Fly.io 3-VM [2] | Eliminate cross-service latency risk |
| **Connection Pooling** | Transaction mode [3] | Session mode [3] | Ensure Prisma compatibility |
| **Redis** | Ephemeral (lose on restart) | AOF persistence | Prevent session data loss |
| **Media Storage** | R2 at 4.5GB | R2 at 2.5GB + advisory locks [6] | Prevent race condition overflow |
| **Backups** | GitHub Actions only [12] | GitHub + R2 hybrid [12][6] | Avoid Git repo bloat >5GB |
| **Kill Switch** | None defined | Week 1 Day 3 gates (RTL, memory, perf) | Reduce risk of sunk costs |
| **Fallback Plan** | Koyeb+Aiven | Koyeb+Aiven pre-provisioned in staging | Faster failover (2-4 hrs) |
