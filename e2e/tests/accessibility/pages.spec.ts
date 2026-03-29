import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/api';

test.describe('Accessibility (WCAG 2.1 AA) @a11y', () => {
  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.warn(
        '[a11y] login page violations:\n',
        results.violations
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n')
      );
    }

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('signup page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/signup');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.warn(
        '[a11y] signup page violations:\n',
        results.violations
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n')
      );
    }

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('authenticated dashboard has no critical accessibility violations', async ({ page }) => {
    // Register a fresh user via API, then inject token
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `e2e-a11y-${uniqueSuffix}@tinysteps.test`;
    const password = 'E2eTestPass1!';

    const registerResponse = await page.request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'A11y Test User' },
      headers: { 'Content-Type': 'application/json' },
    });

    if (registerResponse.ok()) {
      const body = await registerResponse.json() as { token: string };
      await page.goto('/');
      await page.evaluate((t: string) => localStorage.setItem('token', t), body.token);
      await page.reload();
      await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 }).catch(() => {});
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.warn(
        '[a11y] dashboard violations:\n',
        results.violations
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n')
      );
    }

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('stories page has no critical accessibility violations', async ({ page }) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `e2e-a11y-stories-${uniqueSuffix}@tinysteps.test`;
    const password = 'E2eTestPass1!';

    const registerResponse = await page.request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'A11y Stories User' },
      headers: { 'Content-Type': 'application/json' },
    });

    if (registerResponse.ok()) {
      const body = await registerResponse.json() as { token: string };
      await page.goto('/');
      await page.evaluate((t: string) => localStorage.setItem('token', t), body.token);
      await page.reload();
      await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 }).catch(() => {});
    }

    await page.goto('/stories');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.warn(
        '[a11y] stories page violations:\n',
        results.violations
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          .join('\n')
      );
    }

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});
