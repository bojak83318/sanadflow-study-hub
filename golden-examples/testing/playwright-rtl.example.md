---
id: "qa_001_playwright_rtl"
difficulty: "medium"
tags: ["playwright", "rtl", "testing", "typescript"]
source_url: "https://www.linkedin.com/pulse/how-playwright-solves-dynamic-element-challenges-localization-nawyf"
---

# Playwright RTL Testing Patterns

## Problem
Validating Right-to-Left (RTL) layout, text directionality, and cursor behavior in Arabic web applications, which are often prone to regression.

## Solution

```typescript
// tests/arabic-rtl.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Arabic RTL Text Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/room/test-room')
  })
  
  test('should display Arabic text with correct directionality', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]')
    
    // Type Arabic text
    await editor.fill('بسم الله الرحمن الرحيم')
    
    // Verify RTL direction
    await expect(editor).toHaveAttribute('dir', 'rtl')
    await expect(editor).toHaveCSS('direction', 'rtl')
    await expect(editor).toHaveCSS('text-align', 'right')
  })
  
  test('should preserve cursor position when typing Arabic', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]')
    
    // Type Arabic text
    await editor.fill('الله')
    
    // Move cursor to middle
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    
    // Insert character
    await page.keyboard.type('ب')
    
    // Verify text is correct
    const text = await editor.textContent()
    expect(text).toBe('البله')
  })
  
  test('should handle mixed Arabic-English text', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]')
    
    // Type mixed content
    await editor.fill('القرآن (Quran) النبوة (Prophethood)')
    
    // Verify auto-detection sets RTL due to majority Arabic
    await expect(editor).toHaveAttribute('dir', /rtl|auto/)
  })
  
  test('should render Arabic text correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const editor = page.locator('[contenteditable="true"]')
    await editor.fill('سورة الفاتحة')
    
    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('arabic-mobile-rtl.png', {
      fullPage: true
    })
  })
  
  test('should validate Unicode normalization for Arabic diacritics', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]')
    
    // Type with diacritics (fatha, kasra, damma)
    await editor.fill('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')
    
    // Verify normalized form
    const savedText = await page.evaluate(() => {
      return document.querySelector('[contenteditable]')?.textContent?.normalize('NFC')
    })
    
    expect(savedText).toBe('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')
  })
})

// tests/visual-regression.spec.ts
test.describe('RTL Visual Regression', () => {
  test('should match Arabic layout snapshot', async ({ page }) => {
    await page.goto('/room/arabic-test')
    
    // Wait for Arabic font to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Compare with baseline
    await expect(page).toHaveScreenshot('arabic-layout-baseline.png', {
      maxDiffPixels: 100
    })
  })
})
```

## Key Learnings
- **CSS Assertions**: Playwright's `expect(locator).toHaveCSS()` enables precise validation of layout direction (`rtl` vs `ltr`) which is critical for Arabic apps.
- **Normalization**: Explicitly testing Unicode NFC normalization ensures that diacritics don't cause hidden data corruption or search failures.
- **Visual Regression**: Screenshot testing effectively catches layout breakages in RTL mode that are hard to assert programmatically.
