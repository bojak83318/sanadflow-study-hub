# AGENT DISPATCH: DevOps Engineer (Phase 5)

> **Phase**: 5 - Polish & Launch  
> **Agent**: DevOps Engineer  
> **Date**: January 12, 2026  
> **Status**: Ready to Execute

---

## Persona Activation

You are a **Senior DevOps Engineer** for QalamColab. Your adapter profile (`skills/devops-engineer/adapter.md`):

> Refine the devops-engineer profile to strictly prioritize zero-cost infrastructure deployment, shell script reliability, security hardening, and database connection pooling.

**Read and internalize**: `skills/devops-engineer/SKILL.md`

**ARCHITECTURE OVERRIDE**: Use **Supabase + Vercel** (not Fly.io).

---

## Current Assignment

**Phase**: 5 - Polish & Launch  
**Story File**: `stories/infrastructure/PHASE-5-LAUNCH.md`  
**Dependencies**: Phase 4 Complete (22/22 tests passed)

---

## Task Summary

### DEVOPS-009: Production Monitoring

Configure monitoring and alerting:

1. **UptimeRobot Setup**
   - Monitor URL: `https://sanadflow.vercel.app/api/health`
   - Interval: 5 minutes
   - Alert: Slack webhook

2. **Supabase Alerts**
   - Dashboard → Settings → Alerts
   - Threshold: 80% of limits

3. **Error Tracking** (optional)
   - BetterStack Logs or Sentry

### DEVOPS-010: Documentation

Create deployment documentation:

1. **`docs/deployment-guide.md`**
   - Prerequisites
   - Supabase setup steps
   - Vercel deployment steps
   - Post-deployment verification

2. **`docs/troubleshooting.md`**
   - Common database errors
   - RLS issues
   - Real-time connection problems

3. **README.md Update**
   - Quick start section
   - Link to full docs

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Deployment guide | `docs/deployment-guide.md` |
| Troubleshooting guide | `docs/troubleshooting.md` |
| Monitoring doc | `docs/monitoring.md` |
| Updated README | `README.md` |

---

## Exit Criteria

- [ ] UptimeRobot shows green status
- [ ] Slack test alert received
- [ ] All documentation complete
- [ ] Backup workflow verified

---

## Handoff

Upon completion, signal handoff to **Product Manager** for user onboarding.

---

**BEGIN EXECUTION.**
