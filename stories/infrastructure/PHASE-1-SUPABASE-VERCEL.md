# Phase 1: Infrastructure Setup - DevOps Engineer Stories

> **Agent**: DevOps Engineer  
> **Phase**: 1 (Infrastructure Setup)  
> **Timeline**: Days 1-3 (Jan 13-15, 2026)  
> **Dependencies**: None (starts immediately)

---

## Configuration Files Status

> ✅ **All configuration files created** (Jan 12, 2026)
> 
> | File | Status |
> |------|--------|
> | `supabase/config.toml` | ✅ Created |
> | `vercel.json` | ✅ Created |
> | `src/app/api/health/route.ts` | ✅ Created |
> | `.github/workflows/keep-alive.yml` | ✅ Created |
> | `.github/workflows/backup.yml` | ✅ Created |
> | `docs/environment-variables.md` | ✅ Created |
>
> **⚠️ Manual steps required**: Supabase project creation, Vercel deployment, and GitHub secrets configuration require interactive web UI access.

---

## Story: INFRA-001 - Supabase Project Setup

**As a** DevOps Engineer  
**I want to** provision the Supabase project and configure all services  
**So that** the backend team can start development

### Acceptance Criteria

- [ ] Supabase project created in Singapore region (`ap-southeast-1`)
- [ ] Project ID: `sanadflow-prod`
- [ ] PostgreSQL extensions enabled:
  - [ ] `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  - [ ] `CREATE EXTENSION IF NOT EXISTS unaccent;`
- [ ] Auth provider configured:
  - [ ] Email/password enabled
  - [ ] Email confirmations DISABLED (for pilot)
  - [ ] Site URL: `https://sanadflow.vercel.app`
  - [ ] Additional redirect URLs: `http://localhost:3000`
- [ ] Storage bucket created:
  - [ ] Bucket name: `diagrams`
  - [ ] Public: false
- [ ] Environment variables documented and saved securely

### Technical Details

```yaml
# Supabase Project Configuration
project_id: sanadflow-prod
region: ap-southeast-1  # Singapore
database_version: 16.1

auth:
  email_provider: enabled
  confirm_email: false  # Auto-confirm for pilot
  jwt_expiry: 3600  # 1 hour

storage:
  buckets:
    - name: diagrams
      public: false
      file_size_limit: 50MB
```

### Commands to Execute

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Initialize project
supabase init

# 4. Link to remote project
supabase link --project-ref <project-ref>

# 5. Enable extensions (run in SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Supabase config | `supabase/config.toml` |
| Project URL | `https://<project-ref>.supabase.co` |
| Anon Key | Stored in Vercel env vars |
| Service Role Key | Stored in Vercel env vars (NEVER expose) |

---

## Story: INFRA-002 - Vercel Deployment

**As a** DevOps Engineer  
**I want to** configure Vercel for serverless deployment  
**So that** the application is publicly accessible

### Acceptance Criteria

- [ ] Vercel project created and linked to GitHub
- [ ] Environment variables set (10 secrets):
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_JWT_SECRET`
  - [ ] `DATABASE_URL` (port 6543, pooler)
  - [ ] `DIRECT_URL` (port 5432, direct)
  - [ ] `R2_ACCOUNT_ID`
  - [ ] `R2_ACCESS_KEY_ID`
  - [ ] `R2_SECRET_ACCESS_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Domain configured: `sanadflow.vercel.app`
- [ ] Singapore region (sin1) configured
- [ ] Health endpoint returns HTTP 200

### Technical Details

```json
// vercel.json
{
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/graphql", "destination": "/api/graphql" }
  ]
}
```

### Commands to Execute

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link to project
vercel link

# 4. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... (repeat for all 10 secrets)

# 5. Deploy to production
vercel --prod

# 6. Verify deployment
curl https://sanadflow.vercel.app/api/health
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Vercel config | `vercel.json` |
| Deployment URL | `https://sanadflow.vercel.app` |
| Health check | `/api/health` returns `{"status":"healthy"}` |

---

## Story: INFRA-003 - GitHub Actions Workflows

**As a** DevOps Engineer  
**I want to** configure automated workflows for backups and keep-alive  
**So that** the database stays active and data is protected

### Acceptance Criteria

- [ ] Keep-alive workflow runs every 6 days
- [ ] Backup workflow runs daily at 2 AM SGT
- [ ] Backups stored in GitHub artifacts (30-day retention)
- [ ] Optional: Backups also stored in Cloudflare R2

### Files to Create

**Keep-Alive Workflow** (`.github/workflows/keep-alive.yml`):

```yaml
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
          psql "$DATABASE_URL" -c "SELECT 1"
      
      - name: Ping Supabase REST API
        run: |
          curl -X GET "${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/health" \
            -H "apikey: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}"
      
      - name: Log activity
        run: |
          echo "✅ Supabase keep-alive ping successful at $(date)"
```

**Backup Workflow** (`.github/workflows/backup.yml`):

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 18 * * *'  # 2 AM SGT (18:00 UTC)
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DIRECT_URL }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="sanadflow_backup_${TIMESTAMP}.sql.gz"
          pg_dump "$DATABASE_URL" | gzip > $BACKUP_FILE
          echo "BACKUP_FILE=$BACKUP_FILE" >> $GITHUB_ENV
      
      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ env.BACKUP_FILE }}
          path: ${{ env.BACKUP_FILE }}
          retention-days: 30
```

---

## Exit Criteria

Before handing off to Backend Engineer:

- [ ] Supabase project accessible at `https://<project>.supabase.co`
- [ ] PostgreSQL extensions verified: `SELECT * FROM pg_extension;`
- [ ] Auth flow tested: Can sign up via Supabase Dashboard
- [ ] Storage bucket visible in Supabase Dashboard
- [ ] Vercel deployment accessible at `https://sanadflow.vercel.app`
- [ ] All 10 environment variables set in Vercel
- [ ] GitHub secrets configured for workflows

---

## Handoff to Backend Engineer

Once all criteria are met, signal handoff:

```markdown
## HANDOFF: INFRA → BACKEND

**Status**: ✅ Infrastructure Ready
**Date**: [DATE]

### Credentials Provided:
- NEXT_PUBLIC_SUPABASE_URL: [Set in Vercel]
- DATABASE_URL: [Set in Vercel] (port 6543)
- DIRECT_URL: [Set in Vercel] (port 5432)

### Next Steps for Backend:
1. Clone repository
2. Run `npm install`
3. Create `prisma/schema.prisma`
4. Run `npx prisma migrate deploy`
5. Apply RLS policies
```
