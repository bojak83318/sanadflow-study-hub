import { test, expect } from '../fixtures/auth';

/**
 * Security: Row Level Security (RLS) Validation
 * QA-011
 */
test.describe('Security: RLS & Access Control', () => {
    let workspaceUrl: string;

    test('User A cannot access User B workspace', async ({ browser }) => {
        // 1. User A (Arabic User) creates a workspace
        const contextA = await browser.newContext();
        const pageA = await contextA.newPage();

        // Login User A
        await pageA.goto('/auth/login');
        await pageA.fill('[name="email"]', 'test.arabic@sanadflow.dev');
        await pageA.fill('[name="password"]', 'Test@Arabic123');
        await pageA.click('button[type="submit"]');
        await pageA.waitForURL(/\/workspace/);

        // Create Workspace
        if (await pageA.getByRole('button', { name: /create workspace/i }).isVisible()) {
            await pageA.getByRole('button', { name: /create workspace/i }).click();
            await pageA.fill('[name="name"]', 'Private Workspace A');
            await pageA.click('button[type="submit"]');
            // Wait for navigation
            await pageA.waitForURL(/\/workspace\/.+/);
        } else {
            // Assume existing one
            await pageA.click('a[href^="/workspace/"] >> nth=0');
        }

        workspaceUrl = pageA.url();
        console.log('User A Workspace:', workspaceUrl);

        await contextA.close();

        // 2. User B (English User) tries to access User A's workspace
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();

        // Login User B
        await pageB.goto('/auth/login');
        await pageB.fill('[name="email"]', 'test.english@sanadflow.dev');
        await pageB.fill('[name="password"]', 'Test@English123');
        await pageB.click('button[type="submit"]');
        await pageB.waitForURL(/\/workspace/);

        // Attempt to visit User A's workspace URL
        await pageB.goto(workspaceUrl);

        // Expect 404 Not Found or Redirect to Dashboard (Access Denied)
        // Adjust expectation based on app behavior
        // Typically, RLS filters the query, so it looks like it doesn't exist (404)
        // Or middleware redirects if not found.
        const urlRequest = pageB.url();
        const isAccessDenied = urlRequest !== workspaceUrl || (await pageB.getByText('404').isVisible()) || (await pageB.getByText('Not Found').isVisible());

        expect(isAccessDenied).toBeTruthy();

        await contextB.close();
    });
});
