import { test as base, expect, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/api';

export interface AuthFixtures {
  /** A Page that is already authenticated (JWT token set in localStorage). */
  authenticatedPage: Page;
}

/**
 * Registers a fresh test user via the backend REST API, then injects the
 * returned JWT token into localStorage so tests start fully authenticated
 * without having to navigate through the login UI.
 *
 * The user is unique per test worker + test title to avoid collisions when
 * tests run in parallel.
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use, testInfo) => {
    // Build a unique email for this test run so parallel tests don't collide
    const uniqueSuffix = `${Date.now()}-${testInfo.workerIndex}`;
    const email = `e2e-${uniqueSuffix}@tinysteps.test`;
    const password = 'E2eTestPass1!';
    const name = 'E2E Test User';

    // Register the user directly via the backend API
    const registerResponse = await page.request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name },
      headers: { 'Content-Type': 'application/json' },
    });

    let token: string;

    if (registerResponse.ok()) {
      const body = await registerResponse.json() as { token: string };
      token = body.token;
    } else if (registerResponse.status() === 400) {
      // User may already exist from a previous partial run – fall back to login
      const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
        data: { email, password },
        headers: { 'Content-Type': 'application/json' },
      });
      expect(loginResponse.ok(), `Login fallback failed: ${await loginResponse.text()}`).toBeTruthy();
      const body = await loginResponse.json() as { token: string };
      token = body.token;
    } else {
      throw new Error(
        `Registration failed with status ${registerResponse.status()}: ${await registerResponse.text()}`
      );
    }

    // Navigate to the app's origin so we can write to its localStorage
    await page.goto('/');

    // Inject JWT token into localStorage (same key used by all frontends)
    await page.evaluate((t: string) => {
      localStorage.setItem('token', t);
    }, token);

    // Provide the authenticated page to the test
    await use(page);
  },
});

export { expect };
