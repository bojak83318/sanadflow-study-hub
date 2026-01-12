# Phase 0: RTL Validation - QA Engineer Stories

> **Agent**: QA Engineer  
> **Phase**: 0 (RTL Validation)  
> **Timeline**: Days 1-2 (Jan 13-14, 2026)  
> **Dependencies**: None (can start before infrastructure)  
> **Go/No-Go Gate**: Jan 14, 5 PM SGT

---

## Story: QA-001 - Playwright Test Environment Setup

**As a** QA Engineer  
**I want to** configure Playwright for RTL testing  
**So that** we can validate Arabic text handling across browsers

### Acceptance Criteria

- [x] Playwright installed with all dependencies
- [x] Browsers configured: Chromium, WebKit (iOS Safari)
- [x] Test directory structure created
- [x] Base fixtures for authenticated user

### Technical Details

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install chromium webkit

# Initialize config
npx playwright init
```

**Playwright Config** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/rtl',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/rtl-html' }],
    ['json', { outputFile: 'reports/rtl-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Playwright config | `playwright.config.ts` |
| Test fixtures | `tests/fixtures/auth.ts` |

---

## Story: QA-002 - RTL Test Suite (50 Tests)

**As a** QA Engineer  
**I want to** implement 50 RTL test cases  
**So that** we validate all Arabic text scenarios

### Test Categories

| Category | Test IDs | Count | Description |
|----------|----------|-------|-------------|
| Pure Arabic | TC-001 to TC-010 | 10 | Single language Arabic text |
| Mixed Text | TC-011 to TC-020 | 10 | Arabic + English inline |
| Whiteboard | TC-021 to TC-030 | 10 | TLDraw Arabic labels |
| Mobile Keyboard | TC-031 to TC-040 | 10 | Touch input, iOS Safari |
| Edge Cases | TC-041 to TC-050 | 10 | Diacritics, ligatures, Unicode |

### Test Implementation

**Pure Arabic Tests** (`tests/rtl/pure-arabic.test.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pure Arabic Text (TC-001 to TC-010)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/workspace/**');
  });

  test('TC-001: Type 100-word Arabic paragraph', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[contenteditable="true"]');
    const arabicText = 'بسم الله الرحمن الرحيم. الحمد لله رب العالمين. الرحمن الرحيم. مالك يوم الدين.';
    
    await editor.fill(arabicText);
    
    // Verify text is preserved
    const text = await editor.textContent();
    expect(text).toBe(arabicText);
    
    // Verify RTL direction
    const dir = await editor.evaluate(el => window.getComputedStyle(el).direction);
    expect(dir).toBe('rtl');
  });

  test('TC-002: Cursor stays at end during typing', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[contenteditable="true"]');
    
    // Type character by character
    await editor.type('الله');
    await editor.type(' الرحمن');
    
    // Cursor should be at the logical end (left side for RTL)
    await editor.press('End');
    await editor.type(' الرحيم');
    
    const text = await editor.textContent();
    expect(text).toContain('الرحيم');
  });

  test('TC-003: Arabic diacritics preserved', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[contenteditable="true"]');
    const textWithDiacritics = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
    
    await editor.fill(textWithDiacritics);
    
    // Verify diacritics preserved
    const text = await editor.textContent();
    expect(text).toBe(textWithDiacritics);
  });

  // TC-004 to TC-010...
});
```

**Mixed Text Tests** (`tests/rtl/mixed-text.test.ts`):

```typescript
test.describe('Mixed Arabic-English (TC-011 to TC-020)', () => {
  test('TC-011: Arabic with English word inline', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');
    const mixedText = 'قال الإمام (Imam Ahmad) في مسنده';
    
    await editor.fill(mixedText);
    
    // Should maintain readable order
    const text = await editor.textContent();
    expect(text).toContain('Imam Ahmad');
    expect(text).toContain('قال الإمام');
  });

  test('TC-012: Auto-detect direction change', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');
    
    // First line Arabic (should be RTL)
    await editor.fill('بسم الله الرحمن الرحيم');
    let dir = await editor.evaluate(el => window.getComputedStyle(el).direction);
    expect(dir).toBe('rtl');
    
    // Clear and type English (should be LTR)
    await editor.clear();
    await editor.fill('In the name of God');
    dir = await editor.evaluate(el => window.getComputedStyle(el).direction);
    expect(dir).toBe('ltr');
  });

  // TC-013 to TC-020...
});
```

**Whiteboard Tests** (`tests/rtl/whiteboard.test.ts`):

```typescript
test.describe('TLDraw Whiteboard (TC-021 to TC-030)', () => {
  test('TC-021: Arabic text box renders correctly', async ({ page }) => {
    await page.goto('/workspace/test/whiteboard/new');
    await page.waitForSelector('[data-testid="tldraw-canvas"]');
    
    // Select text tool
    await page.click('[data-testid="tool-text"]');
    
    // Click on canvas
    await page.click('[data-testid="tldraw-canvas"]', { position: { x: 200, y: 200 } });
    
    // Type Arabic
    await page.keyboard.type('فَاعِل');
    
    // Verify text exists
    const textBox = page.locator('text=فَاعِل');
    await expect(textBox).toBeVisible();
  });

  test('TC-022: Export PNG preserves Arabic', async ({ page }) => {
    // ... test PNG export maintains RTL
  });

  // TC-023 to TC-030...
});
```

**Mobile Tests** (`tests/rtl/mobile.test.ts`):

```typescript
test.describe('Mobile Keyboard (TC-031 to TC-040)', () => {
  test.use({ ...devices['iPhone 13'] });

  test('TC-031: iOS Safari Arabic keyboard input', async ({ page }) => {
    await page.goto('/workspace/test/doc/new');
    
    const editor = page.locator('[contenteditable="true"]');
    
    // Simulate touch input
    await editor.tap();
    await page.keyboard.type('الله');
    
    const text = await editor.textContent();
    expect(text).toBe('الله');
  });

  // TC-032 to TC-040...
});
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Pure Arabic tests | `tests/rtl/pure-arabic.test.ts` |
| Mixed text tests | `tests/rtl/mixed-text.test.ts` |
| Whiteboard tests | `tests/rtl/whiteboard.test.ts` |
| Mobile tests | `tests/rtl/mobile.test.ts` |
| Edge case tests | `tests/rtl/edge-cases.test.ts` |

---

## Story: QA-003 - RTL Validation Report

**As a** QA Engineer  
**I want to** generate a validation report with pass/fail metrics  
**So that** stakeholders can make go/no-go decision

### Acceptance Criteria

- [ ] Run all 50 tests on Chromium and WebKit
- [ ] Calculate pass rate: `(passed / 50) × 100%`
- [ ] Document all failures with screenshots
- [ ] Create GitHub Issues for failed tests

### Commands to Execute

```bash
# Run all RTL tests
npx playwright test tests/rtl/ --reporter=html

# Generate JSON report
npx playwright test tests/rtl/ --reporter=json --output=reports/rtl-results.json

# Calculate pass rate
node scripts/calculate-pass-rate.js
```

### Report Template

```markdown
# RTL Validation Report

**Date**: [DATE]
**Tester**: QA Engineer
**Environment**: Next.js 14 + TLDraw 1.29.2

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 50 |
| Passed | [X] |
| Failed | [Y] |
| Pass Rate | [X/50 × 100]% |

## Gate Decision

- [ ] ≥90% (45/50): ✅ **PROCEED**
- [ ] 80-89% (40-44): ⚠️ **CAUTION** - Document workarounds
- [ ] <80% (<40): ❌ **NO-GO** - Pivot to Obsidian

## Failed Tests

| Test ID | Description | Error | Screenshot |
|---------|-------------|-------|------------|
| TC-XXX | ... | ... | [link] |

## Recommendations

1. ...
2. ...
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| HTML Report | `reports/rtl-html/index.html` |
| JSON Results | `reports/rtl-results.json` |
| Validation Report | `reports/rtl-validation-report.md` |
| GitHub Issues | `rtl-bug` label |

---

## Exit Criteria

**Go/No-Go Gate: Jan 14, 5 PM SGT**

| Threshold | Decision |
|-----------|----------|
| ≥90% (45/50) | ✅ PROCEED to Phase 1 infrastructure |
| 80-89% (40-44) | ⚠️ PM reviews workarounds, decides |
| <80% (<40) | ❌ ABORT - Pivot to Obsidian |

---

## Handoff to Product Manager

```markdown
## HANDOFF: QA → PM

**Status**: [PASS/FAIL]
**Pass Rate**: [X]%
**Date**: [DATE]

### Attached:
- reports/rtl-validation-report.md
- reports/rtl-results.json
- GitHub Issues with `rtl-bug` label

### Decision Required:
- [ ] Approve PROCEED to Phase 1
- [ ] Request workarounds for failures
- [ ] Approve ABORT and pivot
```
