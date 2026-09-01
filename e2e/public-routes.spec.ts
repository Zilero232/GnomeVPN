import { expect, test } from '@playwright/test';

test.describe('public routes', () => {
  test('the landing page renders', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/gnomevpn/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('the auth page renders a sign-in form', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('textbox').first()).toBeVisible();
  });

  test('the privacy policy is reachable without auth', async ({ page }) => {
    const response = await page.goto('/privacy');

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/privacy|конфиденциальност/i);
  });

  test('the reset-password page is reachable without auth', async ({ page }) => {
    const response = await page.goto('/reset-password');

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('an unknown route renders the not-found page', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');

    await expect(page.locator('body')).toBeVisible();
  });

  test('the account page redirects an anonymous visitor to auth', async ({ page }) => {
    await page.goto('/account');

    await page.waitForURL(/\/auth/, { timeout: 15_000 });

    expect(page.url()).toContain('/auth');
  });
});
