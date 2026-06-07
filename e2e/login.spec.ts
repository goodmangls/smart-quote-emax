import { test, expect } from '@playwright/test';

// Selectors are id/type/href based (not localized text) so the suite stays robust
// across i18n. Password login has been removed; Magic Link is the primary flow.
// See docs/01-plan/features/smart-quote-emax-e2e-landing-debt.plan.md
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('smartQuoteLanguage', 'en');
    });
  });

  test('displays magic link login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#magic-email')).toBeVisible();
    await expect(page.locator('#password')).toHaveCount(0);
    await expect(page.getByText(/password-free sign-in/i)).toBeVisible();
  });

  test('shows magic link validation on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /email me a sign-in link/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('has link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/signup"]').last().click();
    await expect(page).toHaveURL('/signup');
  });
});
