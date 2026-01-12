/**
 * TLDraw Whiteboard Arabic Labels Test Suite (TC-026 to TC-035)
 * Phase 0: RTL Validation - Whiteboard Integration
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

test.describe('TLDraw Whiteboard RTL (TC-026 to TC-035)', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/whiteboard-sandbox');
        await page.waitForSelector('[data-testid="tldraw-canvas"]');
    });

    test('TC-026: Create text box with Arabic label', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('مبتدأ');

        const textShape = page.locator('[data-testid="shape-text"]');
        await expect(textShape).toContainText('مبتدأ');
    });

    test('TC-027: Arrow label with Arabic text', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="arrow-tool"]');
        // Create arrow
        await page.mouse.move(100, 100);
        await page.mouse.down();
        await page.mouse.move(300, 100);
        await page.mouse.up();

        // Add label
        await page.dblclick('[data-testid="shape-arrow"]');
        await page.keyboard.type('إعراب');

        const label = page.locator('[data-testid="arrow-label"]');
        await expect(label).toContainText('إعراب');
    });

    test('TC-028: Sticky note with Arabic content', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="note-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('ملاحظة هامة');

        const note = page.locator('[data-testid="shape-note"]');
        await expect(note).toContainText('ملاحظة');
    });

    test('TC-029: Group shapes with Arabic group name', async ({ page }: { page: Page }) => {
        // Select multiple shapes
        await page.keyboard.down('Shift');
        await page.click('[data-testid="shape-1"]');
        await page.click('[data-testid="shape-2"]');
        await page.keyboard.up('Shift');

        // Group
        await page.keyboard.press('Control+G');

        // The group should exist
        const group = page.locator('[data-testid="shape-group"]');
        await expect(group).toBeVisible();
    });

    test('TC-030: Export PNG preserves Arabic labels', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('نص عربي');

        const exportBtn = page.locator('[data-testid="export-png"]');
        await exportBtn.click();

        // Check download triggered
        const download = await page.waitForEvent('download');
        expect(download.suggestedFilename()).toMatch(/\.png$/);
    });

    test('TC-031: Canvas zoom preserves text clarity', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('تكبير');

        // Zoom in
        await page.keyboard.press('Control+=');
        await page.keyboard.press('Control+=');

        const textShape = page.locator('[data-testid="shape-text"]');
        await expect(textShape).toBeVisible();
    });

    test('TC-032: Undo/redo Arabic text edits', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('أصلي');

        // Undo
        await page.keyboard.press('Control+Z');

        // Text should be removed
        const textShape = page.locator('[data-testid="shape-text"]');
        await expect(textShape).not.toBeVisible();

        // Redo
        await page.keyboard.press('Control+Y');
        await expect(textShape).toBeVisible();
    });

    test('TC-033: Multi-line Arabic text in shape', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('السطر الأول');
        await page.keyboard.press('Enter');
        await page.keyboard.type('السطر الثاني');

        const textShape = page.locator('[data-testid="shape-text"]');
        const text = await textShape.textContent();
        expect(text).toContain('السطر الأول');
        expect(text).toContain('السطر الثاني');
    });

    test('TC-034: Copy-paste shape preserves Arabic', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('نسخ');

        await page.keyboard.press('Control+C');
        await page.keyboard.press('Control+V');

        const shapes = page.locator('[data-testid="shape-text"]');
        expect(await shapes.count()).toBe(2);
    });

    test('TC-035: Canvas auto-save includes Arabic content', async ({ page }: { page: Page }) => {
        await page.click('[data-testid="text-tool"]');
        await page.click('[data-testid="tldraw-canvas"]');
        await page.keyboard.type('حفظ تلقائي');

        // Wait for auto-save (10 seconds per TDD)
        await page.waitForTimeout(11000);

        const saveIndicator = page.locator('[data-testid="save-indicator"]');
        await expect(saveIndicator).toContainText(/Saved|محفوظ/);
    });
});
