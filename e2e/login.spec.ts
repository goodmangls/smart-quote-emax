import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Form validation prevents submission with required fields empty
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('has link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).last().click();
    await expect(page).toHaveURL('/signup');
  });
});
