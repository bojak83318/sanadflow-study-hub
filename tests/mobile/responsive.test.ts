import { test, expect, devices } from '@playwright/test';
import { ARABIC_USER } from '../fixtures/auth';

/**
 * Mobile Compatibility: Responsive Layout & Touch
 * QA-012
 */
test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        // Mobile Login (simulated)
        await page.goto('/auth/login');
        await page.fill('[name="email"]', ARABIC_USER.email);
        await page.fill('[name="password"]', ARABIC_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/workspace/);
    });

    test('Dashboard adapts to mobile viewport', async ({ page }) => {
        // Check for hamburger menu or mobile navigation presence
        // Assuming there is a mobile header
        await expect(page.locator('header')).toBeVisible();

        // Verify no horizontal scroll on body
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);

        // Allow slight tolerance/margin
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });

    test('Hadith Form is usable on mobile', async ({ page }) => {
        // Navigate to Hadith form
        // Find link or navigate directly
        const workspaceLink = page.locator('a[href^="/workspace/"]').first();
        if (await workspaceLink.count() > 0) {
            await workspaceLink.click();
            await page.waitForURL(/\/workspace\/.+/);

            // On mobile, "New Hadith" might be in a menu or FAB (Floating Action Button)
            // Or visible.
            // Let's assume URL navigation for stability in this test if button is hidden
            const url = page.url();
            await page.goto(`${url}/hadith/new`);
        } else {
            // Skip if no workspace
            test.skip();
        }

        await expect(page).toHaveURL(/.*\/hadith\/new/);

        // Check form layout
        const arabicInput = page.locator('textarea[dir="rtl"]');
        await expect(arabicInput).toBeVisible();

        // Verify input width fits screen
        const box = await arabicInput.boundingBox();
        expect(box?.width).toBeLessThan(390); // iPhone 12 width

        // Type Arabic (simulating keyboard)
        await arabicInput.fill('نص تجريبي للموبايل');
        await expect(arabicInput).toHaveValue('نص تجريبي للموبايل');
    });
});
