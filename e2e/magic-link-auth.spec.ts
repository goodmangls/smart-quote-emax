import { test, expect } from '@playwright/test';

test.use({
  storageState: undefined,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('smartQuoteLanguage', 'en');
  });
});

test.describe('Magic Link Authentication', () => {
  test.describe('Login Page — Magic Link UI', () => {
    test('shows magic link button on login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('button', { name: /Sign in with email link/i })).toBeVisible();
    });

    test('switches to magic link mode when button is clicked', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      await expect(page.locator('#magic-email')).toBeVisible();
      await expect(page.getByRole('button', { name: /Send login link/i })).toBeVisible();
    });

    test('shows back-to-password button in magic link mode', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      await expect(page.getByRole('button', { name: /Sign in with password/i })).toBeVisible();
    });

    test('returns to password mode when back button is clicked', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();
      await page.getByRole('button', { name: /Sign in with password/i }).click();

      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with email link/i })).toBeVisible();
    });

    test('does not submit with empty email', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      // email field should be required — clicking send should not proceed
      const emailInput = page.locator('#magic-email');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('send button shows sending state while request is in flight', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      // Intercept the API call to delay it
      await page.route('**/api/v1/auth/magic_link', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({ status: 200, body: JSON.stringify({ message: 'sent' }) });
      });

      await page.locator('#magic-email').fill('test@example.com');
      await page.getByRole('button', { name: /Send login link/i }).click();

      await expect(page.getByRole('button', { name: /Sending/i })).toBeVisible();
    });

    test('shows success state after email is sent', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      await page.route('**/api/v1/auth/magic_link', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ message: 'If that email exists, we sent a link.' }),
        }),
      );

      await page.locator('#magic-email').fill('test@example.com');
      await page.getByRole('button', { name: /Send login link/i }).click();

      await expect(page.getByText(/Check your email/i)).toBeVisible();
      await expect(page.getByText(/login link to your email/i)).toBeVisible();
    });

    test('shows resend button after email is sent', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      await page.route('**/api/v1/auth/magic_link', (route) =>
        route.fulfill({ status: 200, body: JSON.stringify({ message: 'sent' }) }),
      );

      await page.locator('#magic-email').fill('user@example.com');
      await page.getByRole('button', { name: /Send login link/i }).click();

      await expect(page.getByRole('button', { name: /Send again/i })).toBeVisible();
    });
  });

  test.describe('Magic Link Verify Page', () => {
    test('shows verifying spinner when token is present', async ({ page }) => {
      // Intercept verify API to stay pending
      await page.route('**/api/v1/auth/magic_link/verify', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({ status: 401, body: JSON.stringify({ error: 'expired' }) });
      });

      await page.goto('/auth/verify?token=sometoken');
      await expect(page.locator('.animate-spin')).toBeVisible();
      await expect(page.getByText(/Verifying login link/i)).toBeVisible();
    });

    test('shows error when no token in URL', async ({ page }) => {
      await page.goto('/auth/verify');

      await expect(page.getByText(/Invalid or expired login link/i)).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to login/i })).toBeVisible();
    });

    test('shows error for invalid token', async ({ page }) => {
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, body: '{}' }),
      );
      await page.route('**/api/v1/auth/magic_link/verify', (route) =>
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Token is invalid or has expired' }),
        }),
      );

      await page.goto('/auth/verify?token=invalid-token-xyz');

      await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to login/i })).toBeVisible();
    });

    test('back to login link navigates to /login', async ({ page }) => {
      await page.goto('/auth/verify');

      await page.getByRole('link', { name: /Back to login/i }).click();
      await expect(page).toHaveURL('/login');
    });

    test('redirects to dashboard on valid token', async ({ page }) => {
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, body: '{}' }),
      );
      await page.route('**/api/v1/auth/magic_link/verify', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            token: 'jwt-token-abc',
            refresh_token: 'refresh-token-abc',
            user: { id: 1, email: 'test@example.com', role: 'member', name: 'Test User' },
          }),
        }),
      );

      await page.goto('/auth/verify?token=valid-token-abc');

      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    });
  });

  test.describe('Email enumeration prevention', () => {
    test('shows same success message for unknown email', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign in with email link/i }).click();

      // Backend always returns 200 regardless of whether email exists
      await page.route('**/api/v1/auth/magic_link', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ message: 'If that email exists, we sent a link.' }),
        }),
      );

      await page.locator('#magic-email').fill('nonexistent@nowhere.com');
      await page.getByRole('button', { name: /Send login link/i }).click();

      await expect(page.getByText(/Check your email/i)).toBeVisible();
    });
  });
});
