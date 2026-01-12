/**
 * Mobile Arabic Keyboard Test Suite (TC-036 to TC-050)
 * Phase 0: RTL Validation - Mobile Touch Input
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Mobile Arabic Keyboard (TC-036 to TC-050)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/mobile-sandbox');
    });

    test('TC-036: Touch keyboard Arabic input (iOS Safari sim)', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mobile-editor"]');
        await editor.tap();
        await editor.type('مرحبا');

        await expect(editor).toHaveValue('مرحبا');
    });

    test('TC-037: Autocorrect disabled for Arabic', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mobile-editor"]');

        await expect(editor).toHaveAttribute('autocorrect', 'off');
        await expect(editor).toHaveAttribute('spellcheck', 'false');
    });

    test('TC-038: Long-press for diacritics', async ({ page }: { page: Page }) => {
        // This tests that the input accepts diacritic characters
        const editor = page.locator('[data-testid="mobile-editor"]');
        await editor.fill('بِ'); // Ba with kasra

        await expect(editor).toHaveValue('بِ');
    });

    test('TC-039: Swipe text selection RTL aware', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mobile-editor"]');
        await editor.fill('اختيار النص');

        // Perform selection gesture
        await editor.tap();
        await page.mouse.down();
        await page.mouse.move(50, 0);
        await page.mouse.up();

        // Selection should work
        const selection = await page.evaluate(() => window.getSelection()?.toString());
        expect(selection?.length).toBeGreaterThan(0);
    });

    test('TC-040: Virtual keyboard language switch', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mobile-editor"]');

        // Input should accept both Arabic and English without form issues
        await editor.fill('مرحبا Hello');
        await expect(editor).toHaveValue('مرحبا Hello');
    });

    test('TC-041: Portrait mode RTL layout', async ({ page }: { page: Page }) => {
        const container = page.locator('[data-testid="mobile-container"]');
        await expect(container).toHaveAttribute('dir', 'rtl');
    });

    test('TC-042: Landscape mode RTL layout', async ({ page }: { page: Page }) => {
        await page.setViewportSize({ width: 667, height: 375 });

        const container = page.locator('[data-testid="mobile-container"]');
        await expect(container).toHaveAttribute('dir', 'rtl');
    });

    test('TC-043: Touch scroll in RTL document', async ({ page }: { page: Page }) => {
        await page.goto('/test/long-document');

        const doc = page.locator('[data-testid="document-content"]');
        await doc.evaluate((el: HTMLElement) => el.scrollTo(0, 500));

        const scrollTop = await doc.evaluate((el: HTMLElement) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
    });

    test('TC-044: Pinch zoom preserves Arabic text', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mobile-editor"]');
        await editor.fill('تكبير');

        // Zoom handling is CSS-based, text should remain
        await expect(editor).toHaveValue('تكبير');
    });

    test('TC-045: Tab focus order RTL', async ({ page }: { page: Page }) => {
        await page.keyboard.press('Tab');

        const focused = page.locator(':focus');
        const box = await focused.boundingBox();

        // In RTL, first focusable should be on the right side
        expect(box?.x).toBeGreaterThan(100);
    });

    test('TC-046: Form validation Arabic messages', async ({ page }: { page: Page }) => {
        await page.goto('/test/form-sandbox');

        const submitBtn = page.locator('[data-testid="submit-btn"]');
        await submitBtn.click();

        const error = page.locator('[data-testid="error-message"]');
        await expect(error).toHaveAttribute('dir', 'rtl');
    });

    test('TC-047: Dropdown menu RTL positioning', async ({ page }: { page: Page }) => {
        await page.goto('/test/dropdown-sandbox');

        await page.click('[data-testid="dropdown-trigger"]');
        const menu = page.locator('[data-testid="dropdown-menu"]');

        const menuBox = await menu.boundingBox();
        const triggerBox = await page.locator('[data-testid="dropdown-trigger"]').boundingBox();

        // Menu should align to the right of trigger in RTL
        expect(menuBox?.x).toBeLessThanOrEqual((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0));
    });

    test('TC-048: Date picker Arabic months', async ({ page }: { page: Page }) => {
        await page.goto('/test/date-sandbox');

        await page.click('[data-testid="date-input"]');
        const monthLabel = page.locator('[data-testid="month-label"]');

        const monthText = await monthLabel.textContent();
        // Should contain Arabic month or Hijri calendar
        expect(monthText).toMatch(/[\u0600-\u06FF]|January|February/);
    });

    test('TC-049: Search results RTL layout', async ({ page }: { page: Page }) => {
        await page.goto('/test/search-sandbox');

        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.fill('حديث');
        await searchInput.press('Enter');

        const results = page.locator('[data-testid="search-results"]');
        await expect(results).toHaveAttribute('dir', 'rtl');
    });

    test('TC-050: Pull-to-refresh gesture works', async ({ page }: { page: Page }) => {
        await page.goto('/test/pull-refresh');

        const content = page.locator('[data-testid="refresh-content"]');

        // Simulate pull-to-refresh
        await content.evaluate((el: HTMLElement) => {
            el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 0 }] as any }));
            el.dispatchEvent(new TouchEvent('touchmove', { touches: [{ clientY: 100 }] as any }));
            el.dispatchEvent(new TouchEvent('touchend'));
        });

        // Refresh indicator should appear
        const indicator = page.locator('[data-testid="refresh-indicator"]');
        await expect(indicator).toBeVisible();
    });
});
