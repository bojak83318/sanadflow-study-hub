/**
 * Mixed Arabic-English Text Test Suite (TC-011 to TC-025)
 * Phase 0: RTL Validation - Bidirectional Text Handling
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Mixed Arabic-English Text (TC-011 to TC-025)', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/rtl-sandbox');
    });

    test('TC-011: Inline English in Arabic sentence', async ({ page }: { page: Page }) => {
        const mixed = 'قال الإمام (Imam Ahmad) في مسنده';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(mixed);
        await expect(editor).toHaveValue(mixed);
    });

    test('TC-012: Cursor stays correct in mixed text', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mixed-editor"]');
        await editor.fill('مرحبا Hello عالم');

        // Move cursor to middle
        await editor.click();
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');

        // Insert at cursor
        await page.keyboard.type('X');

        const value = await editor.inputValue();
        expect(value).toContain('X');
    });

    test('TC-013: English terminology inline preserves layout', async ({ page }: { page: Page }) => {
        const hadithRef = 'رواه البخاري (Sahih Bukhari) في كتاب الإيمان';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(hadithRef);
        await expect(editor).toHaveAttribute('dir', 'rtl');
    });

    test('TC-014: URLs in Arabic paragraph', async ({ page }: { page: Page }) => {
        const textWithUrl = 'رابط الموقع https://example.com للمزيد';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(textWithUrl);
        await expect(editor).toHaveValue(textWithUrl);
    });

    test('TC-015: Email addresses in Arabic', async ({ page }: { page: Page }) => {
        const textWithEmail = 'تواصل معنا على user@example.com وشكراً';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(textWithEmail);
        await expect(editor).toHaveValue(textWithEmail);
    });

    test('TC-016: Hadith grading with English code', async ({ page }: { page: Page }) => {
        const grading = 'درجة الحديث: SAHIH (صحيح)';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(grading);
        await expect(editor).toHaveValue(grading);
    });

    test('TC-017: Narrator name with transliteration', async ({ page }: { page: Page }) => {
        const narrator = 'أبو هريرة (Abu Hurayrah) رضي الله عنه';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(narrator);
        await expect(editor).toHaveValue(narrator);
    });

    test('TC-018: Technical terms in Arabic context', async ({ page }: { page: Page }) => {
        const technical = 'استخدم API لربط قاعدة البيانات PostgreSQL';
        const editor = page.locator('[data-testid="mixed-editor"]');

        await editor.fill(technical);
        await expect(editor).toHaveValue(technical);
    });

    test('TC-019: Arabic-English bullet points', async ({ page }: { page: Page }) => {
        await page.goto('/test/list-sandbox');
        const list = page.locator('[data-testid="mixed-list"]');

        await expect(list).toHaveAttribute('dir', 'rtl');
        await expect(list.locator('li').first()).toBeVisible();
    });

    test('TC-020: Table with bilingual headers', async ({ page }: { page: Page }) => {
        await page.goto('/test/table-sandbox');
        const table = page.locator('[data-testid="bilingual-table"]');

        await expect(table).toBeVisible();
        const headerAr = table.locator('th').first();
        await expect(headerAr).toHaveAttribute('dir', 'rtl');
    });

    test('TC-021: Form labels Arabic, input English', async ({ page }: { page: Page }) => {
        await page.goto('/test/form-sandbox');
        const label = page.locator('label[for="email"]');

        await expect(label).toHaveAttribute('dir', 'rtl');
    });

    test('TC-022: Dropdown with Arabic options', async ({ page }: { page: Page }) => {
        await page.goto('/test/form-sandbox');
        const select = page.locator('[data-testid="grading-select"]');

        await select.click();
        const option = page.locator('option:has-text("صحيح")');
        await expect(option).toBeVisible();
    });

    test('TC-023: Modal dialog RTL layout', async ({ page }: { page: Page }) => {
        await page.goto('/test/modal-sandbox');
        await page.click('[data-testid="open-modal"]');

        const modal = page.locator('[data-testid="rtl-modal"]');
        await expect(modal).toHaveAttribute('dir', 'rtl');
    });

    test('TC-024: Toast notification RTL', async ({ page }: { page: Page }) => {
        await page.goto('/test/toast-sandbox');
        await page.click('[data-testid="trigger-toast"]');

        const toast = page.locator('[data-testid="toast"]');
        await expect(toast).toHaveAttribute('dir', 'rtl');
    });

    test('TC-025: Breadcrumb navigation RTL', async ({ page }: { page: Page }) => {
        await page.goto('/workspace/test/documents');
        const breadcrumb = page.locator('[data-testid="breadcrumb"]');

        await expect(breadcrumb).toHaveAttribute('dir', 'rtl');
    });
});
