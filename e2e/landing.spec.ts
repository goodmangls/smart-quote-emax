import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText(/WCA.*MPL.*EAN.*JCtrans/).first()).toBeVisible();
  });

  test('has login and signup links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /sign in|login/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|signup|register/i }).first()).toBeVisible();
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in|login/i }).first().click();
    await expect(page).toHaveURL('/login');
  });
});
