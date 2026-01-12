/**
 * Authentication Fixtures for Playwright Tests
 * Phase 0: RTL Validation
 * 
 * Agent: qa-engineer
 */

import { test as base, expect, Page } from '@playwright/test';

// Test user credentials (for development/testing only)
export interface TestUser {
    email: string;
    password: string;
    name: string;
    locale: 'ar' | 'en';
}

// Arabic-first test user
export const ARABIC_USER: TestUser = {
    email: 'test.arabic@sanadflow.dev',
    password: 'Test@Arabic123',
    name: 'أحمد الطالب',
    locale: 'ar',
};

// English test user for mixed content testing
export const ENGLISH_USER: TestUser = {
    email: 'test.english@sanadflow.dev',
    password: 'Test@English123',
    name: 'Ahmed Student',
    locale: 'en',
};

// Extended test with authenticated page
export const test = base.extend<{
    authenticatedPage: typeof base;
    arabicUser: TestUser;
}>({
    arabicUser: ARABIC_USER,

    authenticatedPage: async ({ page }, use) => {
        // Navigate to login page
        await page.goto('/login');

        // Fill login form
        await page.fill('[name="email"]', ARABIC_USER.email);
        await page.fill('[name="password"]', ARABIC_USER.password);

        // Submit
        await page.click('button[type="submit"]');

        // Wait for redirect to workspace
        await page.waitForURL('**/workspace/**', { timeout: 10000 });

        // Use the authenticated page
        await use(base);
    },
});

// Re-export expect for convenience
export { expect };

// Sample Arabic texts for testing
export const SAMPLE_TEXTS = {
    // Opening of Surah Al-Fatiha (with diacritics)
    QURAN_FATIHA: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',

    // Simple greeting
    GREETING: 'السلام عليكم ورحمة الله وبركاته',

    // Hadith example
    HADITH_SAMPLE: 'قال رسول الله صلى الله عليه وسلم: إنما الأعمال بالنيات',

    // Mixed Arabic-English
    MIXED_HADITH: 'رواه البخاري (Sahih Bukhari) في كتاب بدء الوحي',

    // Arabic numbers
    ARABIC_NUMBERS: '٠١٢٣٤٥٦٧٨٩',

    // Arabic punctuation
    WITH_PUNCTUATION: 'السلام عليكم، كيف حالك؟ أنا بخير.',

    // Ligatures
    LIGATURES: 'الله لا إله إلا الله',

    // With diacritics (harakat)
    WITH_DIACRITICS: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',

    // Long paragraph (100+ chars)
    LONG_PARAGRAPH: 'هذا نص طويل جداً يستخدم لاختبار التفاف النص في المحرر. يجب أن يظهر هذا النص بشكل صحيح من اليمين إلى اليسار. '.repeat(5),

    // Grammar terms (I'rab)
    IRAB_TERMS: 'مبتدأ خبر فاعل مفعول به حال تمييز',
};

// Whiteboard shape positions
export const CANVAS_POSITIONS = {
    CENTER: { x: 400, y: 300 },
    TOP_LEFT: { x: 100, y: 100 },
    TOP_RIGHT: { x: 700, y: 100 },
    BOTTOM_LEFT: { x: 100, y: 500 },
    BOTTOM_RIGHT: { x: 700, y: 500 },
};

// Mobile viewport configurations
export const MOBILE_VIEWPORTS = {
    IPHONE_SE: { width: 375, height: 667 },
    IPHONE_13: { width: 390, height: 844 },
    IPAD: { width: 768, height: 1024 },
    IPAD_LANDSCAPE: { width: 1024, height: 768 },
};
