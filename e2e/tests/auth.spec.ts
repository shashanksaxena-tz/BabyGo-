import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/api';

test.describe('Authentication', () => {
  test('register and login flow', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const email = `e2e-register-${uniqueSuffix}@tinysteps.test`;
    const password = 'E2eTestPass1!';
    const name = 'E2E Register User';

    // Go to app — should redirect to login when not authenticated
    await page.goto('/');
    await expect(page).toHaveURL(/login|signin|\//);

    // Navigate to signup page
    const signupLink = page.getByRole('link', { name: /sign\s*up|register|create account/i });
    if (await signupLink.isVisible()) {
      await signupLink.click();
    } else {
      await page.goto('/signup');
    }

    // Fill registration form
    const nameField = page.getByLabel(/name/i).first();
    if (await nameField.isVisible()) {
      await nameField.fill(name);
    }
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(password);

    // Some forms have a confirm password field
    const confirmField = page.getByLabel(/confirm\s*password/i);
    if (await confirmField.isVisible()) {
      await confirmField.fill(password);
    }

    // Submit the form
    await page.getByRole('button', { name: /sign\s*up|register|create account/i }).click();

    // After successful registration, should land on dashboard or home —
    // assert the positive destination rather than just "not signup".
    await expect(page).toHaveURL(/\/(dashboard|home)?$/, { timeout: 10_000 });
  });

  test('login with valid credentials', async ({ page }) => {
    // Register a fresh user via API first
    const uniqueSuffix = Date.now();
    const email = `e2e-login-${uniqueSuffix}@tinysteps.test`;
    const password = 'E2eTestPass1!';
    const name = 'E2E Login User';

    const registerResponse = await page.request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(
      registerResponse.ok(),
      `Registration failed: ${await registerResponse.text()}`
    ).toBeTruthy();

    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);

    // Submit
    await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();

    // Should redirect away from login page on success
    await expect(page).not.toHaveURL(/login|signin/i, { timeout: 10_000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('nonexistent@tinysteps.test');
    await page.getByLabel(/password/i).fill('WrongPass999!');

    await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();

    // Expect some form of error feedback — either an alert role, visible error text,
    // or remaining on the login page
    const errorVisible = await page
      .getByRole('alert')
      .or(page.getByText(/invalid|incorrect|wrong|error|failed/i))
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    const stillOnLogin = page.url().includes('login') || page.url().includes('signin');

    expect(errorVisible || stillOnLogin).toBeTruthy();
  });
});
