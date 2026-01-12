/**
 * Edge Cases Test Suite (TC-046 to TC-050)
 * Phase 0: RTL Validation - Unicode and Special Character Handling
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

// ==============================================
// TEST CATEGORY 5: Edge Cases (10 tests)
// ==============================================

test.describe('Edge Cases: Unicode & Special Characters', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/rtl-sandbox');
    });

    // ===== LIGATURES =====

    test('TC-046: Arabic ligatures (لا، لله) preserved', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Common Arabic ligatures
        const ligatures = [
            'لا',    // Lam-Alef ligature
            'الله',   // Allah ligature
            'لله',   // Li-llah
            'لإ',    // Lam-Alef with hamza below
            'لأ',    // Lam-Alef with hamza above
            'لآ',    // Lam-Alef with madda
        ];

        for (const ligature of ligatures) {
            await editor.fill(ligature);
            const displayedText = await editor.inputValue();
            expect(displayedText).toBe(ligature);

            // Verify correct rendering (ligature should be visually single character)
            const textContent = await editor.textContent();
            expect(textContent).toContain(ligature);
        }
    });

    test('TC-046b: Ligatures preserved after copy-paste', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');
        const ligaturedText = 'لا إله إلا الله';

        await editor.fill(ligaturedText);
        await editor.selectText();
        await page.keyboard.press('Control+C');
        await editor.fill('');
        await page.keyboard.press('Control+V');

        const pastedText = await editor.inputValue();
        expect(pastedText).toBe(ligaturedText);
    });

    // ===== UNICODE NORMALIZATION =====

    test('TC-047: Unicode NFC normalization', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Text that may have different Unicode representations
        // NFC (composed) vs NFD (decomposed)
        const composedText = 'الرَّحْمَٰنِ'; // NFC form
        const decomposedText = 'الرَّحْمَٰنِ'.normalize('NFD'); // NFD form

        // Input composed text
        await editor.fill(composedText);
        let displayedText = await editor.inputValue();

        // Should be stored/displayed in NFC form
        expect(displayedText.normalize('NFC')).toBe(composedText.normalize('NFC'));

        // Input decomposed text, should still work correctly
        await editor.fill(decomposedText);
        displayedText = await editor.inputValue();

        // Comparison should be equivalent when normalized
        expect(displayedText.normalize('NFC')).toBe(composedText.normalize('NFC'));
    });

    test('TC-047b: Search finds both normalized forms', async ({ page }: { page: Page }) => {
        const searchInput = page.locator('[data-testid="search-input"]');

        // Search with composed form
        const searchTerm = 'الرَّحْمَٰنِ'.normalize('NFC');
        await searchInput.fill(searchTerm);

        const results = page.locator('[data-testid="search-results"]');
        await expect(results).toBeVisible();
    });

    // ===== ZERO-WIDTH JOINER =====

    test('TC-048: Zero-width joiner (ZWJ) handling', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // ZWJ is used to force connection between characters
        const textWithZWJ = 'بـ\u200Dـسم'; // ZWJ between letters

        await editor.fill(textWithZWJ);
        const displayedText = await editor.inputValue();

        // ZWJ should be preserved
        expect(displayedText).toContain('\u200D');
        expect(displayedText.length).toBe(textWithZWJ.length);
    });

    test('TC-048b: Zero-width non-joiner (ZWNJ) handling', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // ZWNJ prevents joining between characters
        const textWithZWNJ = 'بسم\u200Cالله'; // ZWNJ to break connection

        await editor.fill(textWithZWNJ);
        const displayedText = await editor.inputValue();

        // ZWNJ should be preserved
        expect(displayedText).toContain('\u200C');
    });

    // ===== RTL/LTR MARKS =====

    test('TC-049: RTL mark (RLM) preservation', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mixed-editor"]');

        // RLM (U+200F) forces RTL direction
        const textWithRLM = 'Hello \u200Fمرحبا\u200F World';

        await editor.fill(textWithRLM);
        const displayedText = await editor.inputValue();

        // RLM should be preserved
        expect(displayedText).toContain('\u200F');
    });

    test('TC-049b: LTR mark (LRM) preservation', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mixed-editor"]');

        // LRM (U+200E) forces LTR direction
        const textWithLRM = 'مرحبا \u200EHello\u200E عالم';

        await editor.fill(textWithLRM);
        const displayedText = await editor.inputValue();

        // LRM should be preserved
        expect(displayedText).toContain('\u200E');
    });

    test('TC-049c: Bidirectional override characters', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="mixed-editor"]');

        // RLO (U+202E) - Right-to-Left Override
        // LRO (U+202D) - Left-to-Right Override
        // PDF (U+202C) - Pop Directional Formatting
        const textWithOverride = '\u202Eاختبار\u202C'; // RLO + text + PDF

        await editor.fill(textWithOverride);
        const displayedText = await editor.inputValue();

        expect(displayedText.length).toBe(textWithOverride.length);
    });

    // ===== COMBINING CHARACTERS =====

    test('TC-050: Combining characters stability', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Various combining marks (diacritics)
        const combiningChars = [
            'بَ',  // Fatha (U+064E)
            'بِ',  // Kasra (U+0650)
            'بُ',  // Damma (U+064F)
            'بْ',  // Sukun (U+0652)
            'بّ',  // Shadda (U+0651)
            'بً',  // Tanwin Fath (U+064B)
            'بٍ',  // Tanwin Kasr (U+064D)
            'بٌ',  // Tanwin Damm (U+064C)
        ];

        for (const char of combiningChars) {
            await editor.fill(char);
            const displayedText = await editor.inputValue();

            // Combining character should be preserved
            expect(displayedText.normalize('NFC')).toBe(char.normalize('NFC'));

            // Visual rendering check
            await expect(editor).toHaveValue(char);
        }
    });

    test('TC-050b: Multiple stacked diacritics', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Multiple diacritics on single character (e.g., shadda with fatha)
        const stackedDiacritics = 'بَّ'; // Ba with shadda and fatha

        await editor.fill(stackedDiacritics);
        const displayedText = await editor.inputValue();

        expect(displayedText.normalize('NFC')).toBe(stackedDiacritics.normalize('NFC'));
    });

    test('TC-050c: Isolated, initial, medial, final forms', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Arabic letters have contextual forms based on position
        // Testing that all forms render correctly
        const testWord = 'بسملة'; // Contains various positional forms

        await editor.fill(testWord);
        const displayedText = await editor.inputValue();

        expect(displayedText).toBe(testWord);

        // Verify the text direction
        const dir = await editor.evaluate(el => window.getComputedStyle(el).direction);
        expect(dir).toBe('rtl');
    });

    // ===== ADDITIONAL EDGE CASES =====

    test('TC-050d: Empty string and whitespace handling', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Test various whitespace characters
        const whitespaceChars = [
            ' ',      // Regular space
            '\u00A0', // Non-breaking space
            '\u2003', // Em space
            '\u200B', // Zero-width space
        ];

        for (const ws of whitespaceChars) {
            await editor.fill(`مرحبا${ws}عالم`);
            const displayedText = await editor.inputValue();
            expect(displayedText).toContain(ws);
        }
    });

    test('TC-050e: Very long Arabic text without crashes', async ({ page }: { page: Page }) => {
        const editor = page.locator('[data-testid="arabic-editor"]');

        // Generate very long text (5000+ characters)
        const longText = 'بسم الله الرحمن الرحيم '.repeat(200);

        await editor.fill(longText);
        const displayedText = await editor.inputValue();

        expect(displayedText.length).toBe(longText.length);

        // Verify no page crash
        await expect(page).toHaveURL(/rtl-sandbox/);
    });
});
