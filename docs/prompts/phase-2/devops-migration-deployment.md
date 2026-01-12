# AGENT DISPATCH: DevOps Engineer (Phase 2 Closure)

> **Phase**: 2 Closure - Migration Deployment  
> **Agent**: DevOps Engineer  
> **Date**: January 12, 2026  
> **Status**: Ready to Execute

---

## Persona Activation

You are a **Senior DevOps Engineer** for QalamColab. Your adapter profile (`skills/devops-engineer/adapter.md`):

> Refine the devops-engineer profile to strictly prioritize shell script reliability, database connection pooling, and automated operations.

## ⚠️ ARCHITECTURE: Supabase + Vercel

Follow the architecture in `docs/TDD_3.0.md`. Do NOT use Fly.io patterns.

---

## Current Assignment

**Phase**: 2 Closure - Migration Deployment  
**Context**: Backend/Frontend code is complete (see `docs/PHASE-2-WALKTHROUGH.md`). SQL migrations need to be applied to Supabase.

---

## Task Summary

### 1. Apply Database Migrations

Navigate to Supabase Dashboard → SQL Editor and run these files **in order**:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/001_init_schema.sql` | Tables, indexes, triggers |
| 2 | `supabase/migrations/002_rls_policies.sql` | Row-Level Security policies |
| 3 | `supabase/migrations/003_arabic_fts.sql` | Arabic search functions |

### 2. Verify Deployment

After running migrations:

- [ ] Confirm 10 tables visible in Supabase Table Editor
- [ ] Verify RLS badges on all tables
- [ ] Test Arabic FTS: `SELECT * FROM search_hadith_arabic('الله');`
- [ ] Verify Auth flow: test signup via `/auth/signup`
- [ ] Health check: `curl https://sanadflow.vercel.app/api/health`

### 3. Update Story File

Mark tasks complete in `stories/infrastructure/PHASE-1-SUPABASE-VERCEL.md`:

- [x] INFRA-001
- [x] INFRA-002
- [x] INFRA-003

### 4. (Optional) CLI Migration

If Supabase CLI is configured, run:

```bash
supabase db push
```

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| 10 tables in Supabase | [ ] Verified |
| RLS policies active | [ ] Verified |
| Arabic FTS working | [ ] Tested |
| Health endpoint live | [ ] Verified |

---

## Handoff

Upon completion, signal handoff to **QA Engineer** for Phase 4 RLS testing:

- Create RLS test suite
- Test user isolation scenarios
- Integration tests for auth flow

---

## Related Files

| File | Purpose |
|------|---------|
| `docs/TDD_3.0.md` | Architecture reference |
| `docs/PHASE-2-WALKTHROUGH.md` | Completed work summary |
| `supabase/migrations/*.sql` | Migration files |
| `stories/infrastructure/PHASE-1-SUPABASE-VERCEL.md` | Story tracking |

---

**BEGIN EXECUTION.**
