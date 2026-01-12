---
id: "20260111_rtl_validation"
difficulty: "medium"
tags: ["frontend", "rtl", "arabic", "testing", "phase-0"]
tech_stack: "Next.js, React 18, TLDraw 1.29.2, Playwright"
---

# User Story: RTL Text Validation Suite

## As a
QA Engineer

## I want to
Execute a comprehensive 50-test RTL validation suite against AFFiNE

## So that
We can make a Go/No-Go decision on Phase 0 before investing in infrastructure

## Context & Constraints
**Critical Gate**: This is the first milestone - if < 40/50 tests pass, we pivot to Obsidian.

**Test Categories:**
| Category | Test Count | Description |
|----------|------------|-------------|
| Pure Arabic | 10 | Quran paragraphs, cursor stability |
| Mixed Arabic-English | 15 | Inline English terms in Arabic sentences |
| Bidirectional Lists | 10 | Arabic bullets with English sub-items |
| Whiteboard Labels | 10 | TLDraw text boxes with Arabic |
| Mobile Keyboard | 5 | iOS Safari Arabic input |

**Target Devices:**
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome

## Acceptance Criteria
- [ ] All 50 RTL test cases documented with expected behavior
- [ ] Test runner executes in < 10 minutes
- [ ] Screen recordings captured for all failures
- [ ] Pass/fail report generated in spreadsheet format
- [ ] Go/No-Go recommendation memo written

## Exit Criteria
| Outcome | Pass Rate | Decision |
|---------|-----------|----------|
| ✅ GO | ≥ 45/50 (90%) | Proceed to Phase 1 |
| ⚠️ CAUTION | 40-44/50 | Evaluate workarounds |
| ❌ NO-GO | < 40/50 | Pivot to Obsidian + Sync |

## Technical Notes
```typescript
// Sample RTL test case
test('Pure Arabic: 100-word Quran paragraph', async ({ page }) => {
  await page.goto('/editor');
  await page.type('[data-testid="content"]', QURAN_SAMPLE);
  
  // Verify no cursor jump
  const cursorPos = await page.evaluate(() => 
    document.getSelection()?.anchorOffset);
  expect(cursorPos).toBe(QURAN_SAMPLE.length);
  
  // Verify text direction
  const dir = await page.getAttribute('[data-testid="content"]', 'dir');
  expect(dir).toBe('rtl');
});
```

## Dependencies
- AFFiNE deployed locally via Docker Compose
- Playwright installed with WebKit/Chromium/Firefox engines
- Sample Arabic text corpus (Quran excerpts, hadith samples)
