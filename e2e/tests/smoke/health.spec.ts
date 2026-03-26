import { test, expect } from '@playwright/test';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';
const DESKTOP_FRONTEND = process.env.DESKTOP_URL ?? 'http://localhost:5173';
const WEB_FRONTEND = process.env.WEB_URL ?? 'http://localhost:3005';

test.describe('Smoke Tests @smoke', () => {
  test('backend health check responds 200', async ({ request }) => {
    const response = await request.get(`${BACKEND}/health`);
    expect(response.status()).toBe(200);
  });

  test('API docs/root endpoint responds', async ({ request }) => {
    const response = await request.get(`${BACKEND}/api`);
    // Accept 200 or 404 — any non-5xx means the server is up and routing
    expect(response.status()).toBeLessThan(500);
  });

  test('config endpoint returns valid JSON', async ({ request }) => {
    const response = await request.get(`${BACKEND}/api/config`);
    expect(response.status()).toBe(200);

    const body = await response.json() as Record<string, unknown>;
    // Config should be a non-empty object
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('register + login cycle succeeds', async ({ request }) => {
    const uniqueSuffix = Date.now();
    const email = `smoke-${uniqueSuffix}@tinysteps.test`;
    const password = 'SmokeTestPass1!';
    const name = 'Smoke Test User';

    // Register
    const registerResponse = await request.post(`${BACKEND}/api/auth/register`, {
      data: { email, password, name },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(registerResponse.status(), 'Register failed').toBe(201);

    const registerBody = await registerResponse.json() as { token: string };
    expect(registerBody.token).toBeTruthy();

    // Login with the same credentials
    const loginResponse = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginResponse.status(), 'Login failed').toBe(200);

    const loginBody = await loginResponse.json() as { token: string };
    expect(loginBody.token).toBeTruthy();
  });

  test('milestones endpoint returns data for 6-month-old', async ({ request }) => {
    // First, get a valid token via registration
    const uniqueSuffix = Date.now();
    const email = `smoke-ms-${uniqueSuffix}@tinysteps.test`;
    const password = 'SmokeTestPass1!';

    const registerResponse = await request.post(`${BACKEND}/api/auth/register`, {
      data: { email, password, name: 'Smoke Milestones User' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(registerResponse.ok(), 'Register for milestones test failed').toBeTruthy();
    const { token } = await registerResponse.json() as { token: string };

    // Fetch milestones for a 6-month-old
    const milestonesResponse = await request.get(`${BACKEND}/api/analysis/milestones/6`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(milestonesResponse.status()).toBe(200);

    const body = await milestonesResponse.json() as unknown;
    // Response should be an array or an object containing milestones
    expect(body).not.toBeNull();
  });

  test('desktop frontend serves HTML', async ({ request }) => {
    const response = await request.get(DESKTOP_FRONTEND);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<html');
  });

  test('web frontend serves HTML', async ({ request }) => {
    const response = await request.get(WEB_FRONTEND);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<html');
  });
});
