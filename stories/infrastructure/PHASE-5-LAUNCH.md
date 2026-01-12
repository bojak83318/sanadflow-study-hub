# Phase 5: Polish & Launch - DevOps Engineer Stories

> **Agent**: DevOps Engineer  
> **Phase**: 5 (Polish & Launch)  
> **Timeline**: Week 4 (Feb 3-7, 2026)  
> **Dependencies**: Phase 4 Complete (Testing passed)

---

## Story: DEVOPS-009 - Production Monitoring Setup

**As a** DevOps Engineer  
**I want to** configure production monitoring and alerting  
**So that** we detect issues before users report them

### Acceptance Criteria

- [ ] UptimeRobot check every 5 minutes on `/api/health`
- [ ] Slack alert on downtime
- [ ] Supabase usage alerts at 80% threshold
- [ ] Vercel function usage dashboard reviewed
- [ ] Error tracking configured (Sentry or BetterStack Logs)

### Technical Details

**UptimeRobot Configuration**:
- Monitor Type: HTTP(s)
- URL: `https://sanadflow.vercel.app/api/health`
- Monitoring Interval: 5 minutes
- Alert Contacts: Slack webhook, Email

**Supabase Alerts** (Dashboard → Settings → Alerts):
- Database size > 400MB (80% of 500MB free tier)
- API calls > 8M/month (80% of 10M limit)
- Function executions > 800k/month (80% of 1M limit)

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Monitoring setup doc | `docs/monitoring.md` |
| UptimeRobot config | External (uptimerobot.com) |
| Slack webhook | GitHub Secret: `SLACK_WEBHOOK_URL` |

---

## Story: DEVOPS-010 - Documentation

**As a** DevOps Engineer  
**I want to** create comprehensive deployment documentation  
**So that** future maintainers can operate the system

### Acceptance Criteria

- [ ] Deployment guide with step-by-step instructions
- [ ] Troubleshooting guide for common issues
- [ ] Environment variables reference
- [ ] Backup and restore procedures

### Files to Create

**Deployment Guide** (`docs/deployment-guide.md`):

```markdown
# SanadFlow Deployment Guide

## Prerequisites
- Node.js 20.x
- Supabase account
- Vercel account
- GitHub repository

## Step 1: Supabase Setup
1. Create project at supabase.com
2. Enable extensions: `pg_trgm`, `unaccent`
3. Run migrations in SQL Editor

## Step 2: Vercel Deployment
1. Import from GitHub
2. Set environment variables
3. Deploy

## Step 3: Post-Deployment
1. Verify health endpoint
2. Configure monitoring
3. Run smoke tests
```

**Troubleshooting Guide** (`docs/troubleshooting.md`):

```markdown
# Troubleshooting Guide

## Common Issues

### Database Connection Errors
- Check `DATABASE_URL` uses port 6543 (pooler)
- Verify Supabase project is not paused (7-day inactivity)

### RLS Errors
- Check user is authenticated
- Verify workspace membership exists

### Real-time Not Working
- Check Supabase Realtime is enabled
- Verify channel subscription
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Deployment guide | `docs/deployment-guide.md` |
| Troubleshooting guide | `docs/troubleshooting.md` |
| README update | `README.md` |

---

## Exit Criteria

- [ ] UptimeRobot shows 100% uptime for 24 hours
- [ ] All documentation reviewed and complete
- [ ] Slack alerts tested and working
- [ ] Backup workflow runs successfully

---

## Handoff to Product Manager

```markdown
## HANDOFF: DEVOPS → PM

**Status**: ✅ Monitoring & Docs Ready
**Date**: [DATE]

### Available:
- UptimeRobot monitoring active
- Slack alerts configured
- Documentation complete

### Ready for User Onboarding:
- System is production-ready
- Monitoring in place
- Documentation available
```
