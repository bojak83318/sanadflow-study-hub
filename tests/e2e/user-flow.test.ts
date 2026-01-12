import { test, expect } from '../fixtures/auth';

test.describe('E2E User Flow', () => {
    test('User can complete full workflow', async ({ authenticatedPage }) => {
        const page = authenticatedPage as any;

        // 1. Dashboard Landing (already logged in via fixture)
        // Expect to be on a page starting with /workspace (dashboard)
        await expect(page).toHaveURL(/\/workspace/);

        // 2. Workspace Navigation/Creation
        // Try to find an existing workspace or create one
        const workspaceLink = page.locator('a[href^="/workspace/"]').first();

        if (await workspaceLink.count() > 0) {
            // Workspace exists, click the first one
            await workspaceLink.click();
        } else {
            // Need to create one
            const createBtn = page.locator('button:has-text("Create Workspace"), button:has-text("Start")');
            if (await createBtn.isVisible()) {
                await createBtn.click();
                await page.fill('input[name="name"]', 'E2E Test Workspace');
                await page.click('button[type="submit"]');
            }
        }

        // Wait for workspace load
        // Assuming we are redirected to /workspace/[slug]
        await expect(page).toHaveURL(/\/workspace\/[^\/]+$/);

        // 3. Create Hadith
        // Check for 'New Hadith' button
        const newHadithBtn = page.locator('a[href$="/hadith/new"], button:has-text("New Hadith")');

        // If not visible, maybe we need to navigate or it's in a menu
        // For now, try navigating directly to verify the page loads
        const url = page.url();
        if (!url.endsWith('/hadith/new')) {
            if (await newHadithBtn.isVisible()) {
                await newHadithBtn.click();
            } else {
                await page.goto(`${url}/hadith/new`);
            }
        }

        await expect(page).toHaveURL(/.*\/hadith\/new/);

        // Fill Form (RTL)
        const arabicText = 'إنما الأعمال بالنيات';
        await page.fill('textarea[dir="rtl"]', arabicText);

        // Save using data-testid from HadithForm
        await page.click('[data-testid="submit-btn"]');

        // Verify redirection and existence of text
        // HadithFormWrapper redirects to workspace root
        await expect(page).toHaveURL(/\/workspace\/[^\/]+$/);

        // Verify text presence (might need reload or wait)
        await expect(page.locator(`text=${arabicText}`)).toBeVisible();

        // 4. Logout
        const userMenu = page.locator('[data-testid="user-menu"]');
        if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.click('text=Sign out');
            await expect(page).toHaveURL('/auth/login');
        }
    });
});
