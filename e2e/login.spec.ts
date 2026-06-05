import { test, expect } from '@playwright/test';

// Selectors are id/type/href based (not localized text) so the suite stays robust
// across i18n — the app defaults to Korean ('로그인' / '가입하기'). The login form
// uses #email / #password inputs, a submit button, and an /signup link.
// See docs/01-plan/features/smart-quote-emax-e2e-landing-debt.plan.md
test.describe('Login Page', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('shows error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').first().click();
    // Required attribute prevents submission with empty fields
    await expect(page.locator('#email')).toHaveAttribute('required', '');
  });

  test('has link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/signup"]').last().click();
    await expect(page).toHaveURL('/signup');
  });
});
