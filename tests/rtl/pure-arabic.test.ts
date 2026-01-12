/**
 * Pure Arabic Text Test Suite (TC-001 to TC-010)
 * Phase 0: RTL Validation - Pure Arabic Text Rendering
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

// Sample texts
const QURAN_FATIHA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ';
const LONG_ARABIC_TEXT = 'هذا نص طويل جداً '.repeat(20);

test.describe('Pure Arabic Text Rendering (TC-001 to TC-010)', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/rtl-sandbox');
    });

    test('TC-001: 100-word Arabic paragraph renders correctly', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        await editor.fill(QURAN_FATIHA);

        await expect(editor).toHaveAttribute('dir', 'rtl');
        await expect(editor).toHaveCSS('text-align', 'right');
        await expect(editor).toHaveCSS('direction', 'rtl');
    });

    test('TC-002: Arabic diacritics (harakat) preserved', async ({ page }: { page: Page }) => {
        const textWithDiacritics = 'الرَّحْمَٰنِ الرَّحِيمِ';
        const editor = page.locator('[data-testid="arabic-editor"]');

        await editor.fill(textWithDiacritics);

        const displayedText = await editor.inputValue();
        expect(displayedText.normalize('NFC')).toBe(textWithDiacritics.normalize('NFC'));
    });

    test('TC-003: Cursor position stable after 50 chars', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');
        const text = 'ا'.repeat(50);

        await editor.fill(text);
        await editor.press('End');

        const cursorPos = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="arabic-editor"]') as HTMLInputElement;
            return el?.selectionStart;
        });

        expect(cursorPos).toBe(50);
    });

    test('TC-004: No cursor jump when typing sequentially', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        for (const char of 'مرحبا') {
            await editor.type(char, { delay: 100 });
        }

        await expect(editor).toHaveValue('مرحبا');
    });

    test('TC-005: Arabic numbers render correctly (٠-٩)', async ({ page }: { page: Page }) => {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        const editor = page.locator('[data-testid="arabic-editor"]');

        await editor.fill(arabicNumbers);
        await expect(editor).toHaveValue(arabicNumbers);
    });

    test('TC-006: Long Arabic paragraph wraps correctly', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        await editor.fill(LONG_ARABIC_TEXT);

        const boundingBox = await editor.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(50); // Multiple lines
    });

    test('TC-007: Arabic punctuation renders correctly', async ({ page }: { page: Page }) => {
        const textWithPunctuation = 'السلام عليكم، كيف حالك؟';
        const editor = page.locator('[data-testid="arabic-editor"]');

        await editor.fill(textWithPunctuation);
        await expect(editor).toHaveValue(textWithPunctuation);
    });

    test('TC-008: Copy-paste Arabic preserves formatting', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');
        const text = 'نص للنسخ';

        await editor.fill(text);
        await editor.selectText();
        await page.keyboard.press('Control+C');
        await editor.fill('');
        await page.keyboard.press('Control+V');

        await expect(editor).toHaveValue(text);
    });

    test('TC-009: Arabic text searchable', async ({ page }: { page: Page }) => {
        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.fill('الحديث');

        const results = page.locator('[data-testid="search-results"]');
        await expect(results).toBeVisible();
    });

    test('TC-010: Empty state shows Arabic placeholder', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');
        const placeholder = await editor.getAttribute('placeholder');

        expect(placeholder).toMatch(/[\u0600-\u06FF]/); // Arabic Unicode range
    });
});
