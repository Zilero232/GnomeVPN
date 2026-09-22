import { expect, test } from '@playwright/test';

import { ROUTES } from '../apps/client/shared/constants';

test.describe('public routes', () => {
  test('the landing page renders', async ({ page }) => {
    await page.goto(ROUTES.landing);

    await expect(page).toHaveTitle(/gnomevpn/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('the auth page renders a sign-in form', async ({ page }) => {
    await page.goto(ROUTES.auth);

    await expect(page.getByRole('textbox').first()).toBeVisible();
  });

  test('the privacy policy is reachable without auth', async ({ page }) => {
    const response = await page.goto(ROUTES.privacy);

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/privacy|конфиденциальност/i);
  });

  test('the password reset page is reachable without auth', async ({ page }) => {
    const response = await page.goto(ROUTES.resetPassword);

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('the telegram sign-in page is reachable without auth', async ({ page }) => {
    const response = await page.goto(ROUTES.telegramSignIn);

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('an unknown route renders the not-found page', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');

    await expect(page.locator('body')).toBeVisible();
  });

  test('the account page redirects an anonymous visitor to auth', async ({ page }) => {
    await page.goto(ROUTES.account);

    await page.waitForURL(/\/auth/, { timeout: 15_000 });

    expect(page.url()).toContain('/auth');
  });
});
