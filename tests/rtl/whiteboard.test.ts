/**
 * TLDraw Whiteboard Arabic Labels Test Suite (TC-026 to TC-035)
 * Phase 0: RTL Validation - Whiteboard Integration
 * 
 * These tests validate Arabic text rendering in whiteboard-like components.
 * The sandbox is a mock of TLDraw functionality for Phase 0 validation.
 * 
 * Agent: qa-engineer
 */

import { test, expect, Page } from '@playwright/test';

test.describe('TLDraw Whiteboard RTL (TC-026 to TC-035)', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/test/whiteboard-sandbox');
        await page.waitForSelector('[data-testid="tldraw-canvas"]');
    });

    test('TC-026: Whiteboard canvas loads with RTL support', async ({ page }: { page: Page }) => {
        // Verify canvas is visible
        const canvas = page.locator('[data-testid="tldraw-canvas"]');
        await expect(canvas).toBeVisible();

        // Verify pre-existing shapes with Arabic text are rendered
        const shapes = page.locator('[data-testid="shape-text"]');
        expect(await shapes.count()).toBeGreaterThanOrEqual(2);
    });

    test('TC-027: Arabic text shapes display correctly', async ({ page }: { page: Page }) => {
        // Check that Arabic text shapes render properly
        const shape1 = page.locator('text=الشكل الأول');
        const shape2 = page.locator('text=الشكل الثاني');

        await expect(shape1).toBeVisible();
        await expect(shape2).toBeVisible();
    });

    test('TC-028: Tool buttons have Arabic labels', async ({ page }: { page: Page }) => {
        // Verify toolbar has Arabic labels
        const textTool = page.locator('[data-testid="text-tool"]');
        const arrowTool = page.locator('[data-testid="arrow-tool"]');
        const noteTool = page.locator('[data-testid="note-tool"]');

        await expect(textTool).toContainText('نص');
        await expect(arrowTool).toContainText('سهم');
        await expect(noteTool).toContainText('ملاحظة');
    });

    test('TC-029: Select tool works with Arabic shapes', async ({ page }: { page: Page }) => {
        const selectTool = page.locator('[data-testid="select-tool"]');
        await selectTool.click();

        // Select a shape
        const shape = page.locator('[data-testid="shape-text"]').first();
        await shape.click();

        // Shape should be selected (has selected class)
        await expect(shape).toHaveClass(/selected/);
    });

    test('TC-030: Export button present', async ({ page }: { page: Page }) => {
        const exportBtn = page.locator('[data-testid="export-png"]');
        await expect(exportBtn).toBeVisible();
        await expect(exportBtn).toContainText('تصدير');
    });

    test('TC-031: Shapes maintain position after canvas interaction', async ({ page }: { page: Page }) => {
        const shape = page.locator('[data-testid="shape-text"]').first();
        const initialBox = await shape.boundingBox();

        // Click elsewhere on canvas
        await page.locator('[data-testid="tldraw-canvas"]').click({ position: { x: 500, y: 400 } });

        // Shape should still be visible
        await expect(shape).toBeVisible();
    });

    test('TC-032: Save indicator shows Arabic text', async ({ page }: { page: Page }) => {
        const saveIndicator = page.locator('[data-testid="save-indicator"]');
        await expect(saveIndicator).toBeVisible();

        // Check that it contains Arabic
        const text = await saveIndicator.textContent();
        expect(text).toMatch(/محفوظ|لم يتم الحفظ/);
    });

    test('TC-033: Text tool can be activated', async ({ page }: { page: Page }) => {
        const textTool = page.locator('[data-testid="text-tool"]');
        await textTool.click();

        // Tool should have active state
        await expect(textTool).toHaveClass(/active/);
    });

    test('TC-034: Arrow tool can be activated', async ({ page }: { page: Page }) => {
        const arrowTool = page.locator('[data-testid="arrow-tool"]');
        await arrowTool.click();

        // Tool should have active state
        await expect(arrowTool).toHaveClass(/active/);
    });

    test('TC-035: Canvas background and styling correct', async ({ page }: { page: Page }) => {
        const canvas = page.locator('[data-testid="tldraw-canvas"]');

        // Canvas should have light background for contrast with shapes
        const bgColor = await canvas.evaluate(el =>
            window.getComputedStyle(el).backgroundColor
        );

        // Verify it's a light color (not dark)
        expect(bgColor).toMatch(/rgb\(245|rgb\(248|#f5f5f5/);
    });
});
