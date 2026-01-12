import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for SanadFlow RTL Tests
 * Phase 0: RTL Validation Suite
 * 
 * Agent: qa-engineer
 */

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'reports/rtl-html' }],
        ['json', { outputFile: 'reports/rtl-results.json' }],
        ['list'], // Console output for CI logs
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        // Desktop browsers
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        // Mobile browsers for RTL testing (critical for Phase 0)
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],

    // Global timeout for RTL tests
    timeout: 30000,
    expect: {
        timeout: 5000,
    },

    // Start dev server before running tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
