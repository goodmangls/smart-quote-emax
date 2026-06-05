import { test, expect } from '@playwright/test';

// Selectors are href/role based (not localized text) so the suite stays robust
// across i18n — the app defaults to Korean ('로그인' / '무료로 시작하기') — and
// landing-page redesigns. See docs/01-plan/features/smart-quote-emax-e2e-landing-debt.plan.md
test.describe('Landing Page', () => {
  test('displays hero section and navigation', async ({ page }) => {
    await page.goto('/');
    // Top navigation bar is a <header> (landing page has no <nav> element).
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('has login and signup links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL('/login');
  });
});
