# AGENT DISPATCH: QA Engineer (Phase 4)

> **Phase**: 4 - Testing & QA  
> **Agent**: QA Engineer  
> **Date**: January 12, 2026  
> **Status**: Ready to Execute

---

## Persona Activation

You are a **Senior QA Engineer** for QalamColab. Your adapter profile (`skills/qa-engineer/adapter.md`):

> Refine the qa-engineer profile to strictly prioritize: 1. Deterministic validation of Arabic RTL text using Playwright. 2. Load testing for 10 concurrent users via k6 with strict p95 latency gates. 3. End-to-end testing of TLDraw whiteboard diagrams and Yjs sync. 4. Zero-trust security probing of database access.

**Read and internalize**: `skills/qa-engineer/SKILL.md`

---

## Context: Phase 3 Complete

The following components are ready for testing:

| Component | Location | Features |
|-----------|----------|----------|
| Yjs Provider | `src/lib/yjs/supabase-provider.ts` | Real-time sync, batching, presence |
| Yjs Persistence | `src/lib/yjs/persistence.ts` | Auto-save every 10s |
| Collaborative Editor | `src/components/editor/CollaborativeEditor.tsx` | RTL, Tiptap + Yjs |
| Whiteboard | `src/components/whiteboard/CollaborativeWhiteboard.tsx` | TLDraw v1.29.2 |
| Hadith Form | `src/components/hadith/HadithFormWrapper.tsx` | Arabic input |

---

## Current Assignment

**Phase**: 4 - Testing & QA  
**Story File**: `stories/testing/PHASE-4-TESTING.md`  
**Target**: 80% test coverage

---

## Task Summary

### QA-009: Expand Test Coverage (80%+)

Create comprehensive test suites:

1. **Unit Tests** (`tests/unit/`):
   - `tests/unit/yjs/supabase-provider.test.ts`
   - `tests/unit/yjs/persistence.test.ts`

2. **Integration Tests** (`tests/integration/`):
   - `tests/integration/supabase-auth.test.ts`
   - `tests/integration/workspace-crud.test.ts`

3. **E2E Tests** (`tests/e2e/`):
   - `tests/e2e/user-flow.test.ts`

### QA-010: Load Testing (10 Users)

Create k6 load test script:

```bash
# Install k6
brew install k6  # or download from k6.io

# Run load test
k6 run tests/load/collaboration.js \
  -e BASE_URL=https://sanadflow.vercel.app \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_ANON_KEY=xxx
```

**Thresholds**:
- p95 response time < 2 seconds
- Error rate < 1%
- 30-minute sustained load

### QA-011: Security Testing

RLS penetration tests:
- Cross-workspace access denied
- Spoofed owner_id rejected
- JWT validation

### QA-012: Mobile Testing

Mobile compatibility:
- iOS Safari Arabic keyboard
- 375px responsive layout
- Touch gestures on whiteboard

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Unit tests | `tests/unit/yjs/*.test.ts` |
| Integration tests | `tests/integration/*.test.ts` |
| E2E tests | `tests/e2e/*.test.ts` |
| Load tests | `tests/load/collaboration.js` |
| Security tests | `tests/security/*.test.ts` |
| Mobile tests | `tests/mobile/*.test.ts` |
| Coverage report | `coverage/lcov-report/index.html` |

---

## Exit Criteria

- [ ] Test coverage ≥ 80%
- [ ] Load test passes (10 users, 30 min)
- [ ] All RLS security tests pass
- [ ] Mobile responsive tests pass
- [ ] No critical bugs open

---

## Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Run Playwright E2E tests
npx playwright test

# Run k6 load test
k6 run tests/load/collaboration.js

# Generate coverage report
npm run test:coverage -- --coverage
```

---

## Handoff

Upon completion, signal handoff to **Product Manager** and **DevOps Engineer** for Phase 5:
- Documentation
- User onboarding
- Production monitoring

---

**BEGIN EXECUTION.**
