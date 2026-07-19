import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('smartQuoteLanguage', 'en');
    });
  });

  test('displays password login form by default', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in$/i })).toBeVisible();
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in$/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('can toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    const pwInput = page.locator('#login-password');
    await expect(pwInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(pwInput).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: /hide password/i }).click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('can switch to magic link mode', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with email link/i }).click();
    await expect(page.locator('#magic-email')).toBeVisible();
    await expect(page.locator('#login-password')).toHaveCount(0);
  });

  test('shows magic link validation on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with email link/i }).click();
    await page.getByRole('button', { name: /email me a sign-in link/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('has link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/signup"]').last().click();
    await expect(page).toHaveURL('/signup');
  });
});
