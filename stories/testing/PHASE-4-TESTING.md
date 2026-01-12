# Phase 4: Testing & QA - QA Engineer Stories

> **Agent**: QA Engineer  
> **Phase**: 4 (Testing & QA)  
> **Timeline**: Week 3 (Jan 27-31, 2026)  
> **Dependencies**: Phase 3 Complete (Real-time collaboration ready)

---

## Story: QA-009 - Expand Test Coverage

**As a** QA Engineer  
**I want to** expand test coverage to 80%+  
**So that** the application is production-ready

### Acceptance Criteria

- [ ] Unit tests for Yjs provider and persistence
- [ ] Integration tests for Supabase client
- [ ] E2E tests for user flows
- [ ] Coverage report shows ≥80%

### Test Files to Create

**Unit Tests** (`tests/unit/`):

```typescript
// tests/unit/yjs/supabase-provider.test.ts
describe('SupabaseProvider', () => {
  it('should connect to Supabase channel', async () => {});
  it('should batch updates at 100ms intervals', async () => {});
  it('should merge multiple updates', async () => {});
  it('should track presence', async () => {});
  it('should reconnect with exponential backoff', async () => {});
  it('should emit status events', async () => {});
});

// tests/unit/yjs/persistence.test.ts
describe('YjsPersistence', () => {
  it('should load existing state', async () => {});
  it('should auto-save every 10 seconds', async () => {});
  it('should debounce rapid saves', async () => {});
  it('should handle concurrent saves', async () => {});
  it('should encode state as base64', async () => {});
});
```

**Integration Tests** (`tests/integration/`):

```typescript
// tests/integration/supabase-auth.test.ts
describe('Supabase Auth Flow', () => {
  it('should sign up new user', async () => {});
  it('should sign in existing user', async () => {});
  it('should refresh session', async () => {});
  it('should sign out and clear cookies', async () => {});
});

// tests/integration/workspace-crud.test.ts
describe('Workspace CRUD', () => {
  it('should create workspace', async () => {});
  it('should add member to workspace', async () => {});
  it('should enforce RLS on workspace access', async () => {});
});
```

**E2E Tests** (`tests/e2e/`):

```typescript
// tests/e2e/user-flow.test.ts
describe('User Flow', () => {
  it('should complete signup → create workspace → add hadith flow', async () => {});
  it('should complete whiteboard collaboration flow', async () => {});
  it('should complete document editing flow', async () => {});
});
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Yjs unit tests | `tests/unit/yjs/*.test.ts` |
| Auth integration tests | `tests/integration/supabase-auth.test.ts` |
| E2E user flow tests | `tests/e2e/user-flow.test.ts` |
| Coverage report | `coverage/lcov-report/index.html` |

---

## Story: QA-010 - Load Testing (10 Concurrent Users)

**As a** QA Engineer  
**I want to** verify the system handles 10 concurrent users  
**So that** the pilot group can use it without performance issues

### Acceptance Criteria

- [ ] k6 scripts for all endpoints
- [ ] 30-minute sustained load test
- [ ] p95 response time < 2 seconds
- [ ] Error rate < 1%
- [ ] No database connection pool exhaustion

### k6 Test Script

**File**: `tests/load/collaboration.js`

```javascript
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const realtimeLatency = new Trend('realtime_sync_latency');
const saveErrors = new Counter('save_errors');

export const options = {
  stages: [
    { duration: '2m', target: 5 },   // Ramp to 5 users
    { duration: '10m', target: 10 }, // Hold at 10 users
    { duration: '5m', target: 10 },  // Sustained load
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // p95 < 2s
    http_req_failed: ['rate<0.01'],        // < 1% errors
    realtime_sync_latency: ['p(95)<500'],  // Real-time < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  // 1. Authenticate
  const authRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    email: `loadtest-${__VU}@example.com`,
    password: 'TestPassword123!',
  }, {
    headers: { 'apikey': SUPABASE_KEY },
  });

  check(authRes, { 'auth successful': (r) => r.status === 200 });
  const token = JSON.parse(authRes.body).access_token;

  sleep(1);

  // 2. Load workspace
  const workspaceRes = http.get(`${BASE_URL}/api/workspaces`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(workspaceRes, { 'workspaces loaded': (r) => r.status === 200 });

  sleep(1);

  // 3. Create hadith
  const createHadithRes = http.post(`${BASE_URL}/api/hadiths`, JSON.stringify({
    workspace_id: 'test-workspace-id',
    arabic_text: 'إنما الأعمال بالنيات',
    grading: 'sahih',
  }), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  check(createHadithRes, { 'hadith created': (r) => r.status === 200 || r.status === 201 });

  sleep(1);

  // 4. Search hadiths (Arabic FTS)
  const searchRes = http.get(
    `${BASE_URL}/api/hadiths/search?q=${encodeURIComponent('الأعمال')}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  check(searchRes, {
    'search successful': (r) => r.status === 200,
    'search < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);

  // 5. Save Yjs document
  const startTime = Date.now();
  const saveRes = http.put(
    `${BASE_URL}/api/documents/test-doc/yjs`,
    JSON.stringify({ state: 'base64-encoded-state-here' }),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (saveRes.status !== 200) {
    saveErrors.add(1);
  }
  realtimeLatency.add(Date.now() - startTime);

  sleep(3);
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| k6 load script | `tests/load/collaboration.js` |
| Load test report | `reports/load-test-report.html` |

---

## Story: QA-011 - Security Testing

**As a** QA Engineer  
**I want to** verify RLS policies and security configuration  
**So that** user data is properly isolated

### Acceptance Criteria

- [ ] RLS policy penetration test
- [ ] JWT token validation
- [ ] Cross-workspace access denied
- [ ] CORS configuration correct

### Test Cases

**RLS Penetration Tests** (`tests/security/rls.test.ts`):

```typescript
describe('RLS Policy Security', () => {
  it('should deny access to other users workspaces', async () => {
    // User A creates workspace
    // User B tries to access → should get 403 or empty result
  });

  it('should deny access to other users hadiths', async () => {});
  
  it('should deny document access without membership', async () => {});
  
  it('should prevent member from deleting (only admin/owner)', async () => {});
  
  it('should prevent workspace creation with spoofed owner_id', async () => {});
});
```

**JWT Security Tests**:

```typescript
describe('JWT Security', () => {
  it('should reject expired tokens', async () => {});
  it('should reject malformed tokens', async () => {});
  it('should reject tokens with invalid signature', async () => {});
});
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| RLS security tests | `tests/security/rls.test.ts` |
| JWT security tests | `tests/security/jwt.test.ts` |
| Security report | `reports/security-audit.md` |

---

## Story: QA-012 - Mobile Testing

**As a** QA Engineer  
**I want to** validate mobile experience  
**So that** users on phones can use the app

### Acceptance Criteria

- [ ] iOS Safari Arabic keyboard works
- [ ] Android Chrome RTL layout correct
- [ ] 375px responsive layout passes
- [ ] Touch gestures work on whiteboard

### Mobile Test Suite

**File**: `tests/mobile/responsive.test.ts`

```typescript
describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] });

  it('should display RTL layout correctly at 375px', async ({ page }) => {
    await page.goto('/workspace/test');
    await expect(page.locator('[dir="rtl"]')).toBeVisible();
  });

  it('should accept Arabic keyboard input', async ({ page }) => {
    await page.goto('/workspace/test/hadith/new');
    await page.fill('[name="arabicText"]', 'بسم الله');
    await expect(page.locator('[name="arabicText"]')).toHaveValue('بسم الله');
  });

  it('should handle touch gestures on whiteboard', async ({ page }) => {
    await page.goto('/workspace/test/whiteboard/new');
    // Simulate touch draw
  });
});
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Mobile tests | `tests/mobile/responsive.test.ts` |
| Mobile report | `reports/mobile-compatibility.md` |

---

## Exit Criteria

**Phase 4 Complete When:**

- [ ] Test coverage ≥ 80%
- [ ] Load test passes (10 users, 30 min, p95 < 2s)
- [ ] All RLS security tests pass
- [ ] Mobile responsive tests pass
- [ ] No critical or high-severity bugs open

---

## Handoff to Product Manager / DevOps

```markdown
## HANDOFF: QA → PM/DEVOPS

**Status**: ✅ Phase 4 Testing Complete
**Date**: [DATE]

### Test Results:
- Coverage: [X]%
- Load Test: [PASS/FAIL]
- Security Audit: [PASS/FAIL]
- Mobile Tests: [PASS/FAIL]

### Ready for Phase 5:
- Documentation
- User onboarding
- Production monitoring
```
