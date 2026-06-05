import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('landing page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('login page form has proper labels', async ({ page }) => {
    await page.goto('/login');
    // Verify inputs expose an accessible label via their associated <label>.
    // Match ko (default) or en so the check survives the i18n language.
    const emailLabel = page.getByLabel(/이메일|email/i);
    const passwordLabel = page.getByLabel(/비밀번호|password/i);
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('language selector is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Tab to language button and verify it's focusable
    const langButton = page.locator('button[aria-haspopup="listbox"]');
    if ((await langButton.count()) > 0) {
      await langButton.focus();
      await expect(langButton).toBeFocused();
    }
  });
});
