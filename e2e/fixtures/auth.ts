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
  authenticatedPage: async ({ page, baseURL }, use, testInfo) => {
    // Build a unique email for this test run so parallel tests don't collide.
    // Uses both timestamp and random suffix to guard against millisecond-level
    // collisions when many workers spin up simultaneously.
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}-${testInfo.workerIndex}`;
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

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Ensure the authenticated user has at least one child profile so desktop
    // routes that require child context don't redirect to onboarding/create-child.
    let childId: string | undefined;
    const listChildrenResponse = await page.request.get(`${API_BASE}/children`, {
      headers: authHeaders,
    });
    if (listChildrenResponse.ok()) {
      const listBody = await listChildrenResponse.json() as { children?: Array<{ _id?: string }> };
      childId = listBody.children?.[0]?._id;
    }

    if (!childId) {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      const dateOnly = date.toISOString().split('T')[0];
      const childResponse = await page.request.post(`${API_BASE}/children`, {
        data: {
          name: 'E2E Baby',
          dateOfBirth: dateOnly,
          gender: 'male',
          weight: 7.2,
          height: 66.0,
          region: 'searo',
        },
        headers: authHeaders,
      });
      const childBody = childResponse.ok()
        ? await childResponse.json() as { child?: { _id?: string } }
        : null;
      childId = childBody?.child?._id;
    }

    // Navigate to the app's origin so we can write to its localStorage
    await page.goto(baseURL!);

    // Inject JWT token into localStorage for both frontend variants.
    await page.evaluate(({ t, c }: { t: string; c: string | null }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('tinysteps_token', t);
      if (c) localStorage.setItem('activeChild', c);
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('auth_token', t);
    }, { t: token, c: childId ?? null });

    // Reload so the app re-checks auth state with the injected token.
    // Without this, the app has already rendered and checked auth state
    // before we injected the token, so it would remain on the login page.
    await page.reload();
    try {
      await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 });
    } catch {
      const currentUrl = page.url();
      console.warn(`Auth fixture: still on login page after token injection. URL: ${currentUrl}`);
      // Fallback: perform UI login for apps that don't fully rehydrate auth
      // state from injected storage in time.
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).first().fill(password);
      await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();
      await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 });
    }

    // Final guard: if app still routes to create-child, create one through UI
    // and proceed so authenticated-route tests remain deterministic.
    if (page.url().includes('/create-child')) {
      const uiChildName = `E2E Child ${testInfo.workerIndex}`;
      await page.getByLabel(/name/i).fill(uiChildName);
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        await dateInput.fill(date.toISOString().split('T')[0]);
      }
      await page.getByLabel(/weight/i).first().fill('7.2');
      await page.getByLabel(/length|height/i).first().fill('66');
      await page.getByRole('button', { name: /create child profile|create|save|submit/i }).first().click();
      await page.waitForURL(url => !url.pathname.includes('create-child'), { timeout: 10000 });
    }

    // Provide the authenticated page to the test
    await use(page);
  },
});

export { expect };
