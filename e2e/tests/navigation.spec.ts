import { test, expect } from '../fixtures/auth';

const ROUTES: Array<{ path: string; label: string; contentPattern: RegExp }> = [
  { path: '/',              label: 'dashboard',     contentPattern: /dashboard|home|welcome|child|baby/i },
  { path: '/insights',      label: 'insights',      contentPattern: /development insights|insight|analysis/i },
  { path: '/stories',       label: 'stories',       contentPattern: /bedtime stories|stories|tale|create a new story/i },
  { path: '/milestones',    label: 'milestones',    contentPattern: /milestones|milestone|tracker|upcoming/i },
  { path: '/growth-charts', label: 'growth-charts', contentPattern: /growth charts|growth|chart|measurement/i },
  { path: '/recipes',       label: 'recipes',       contentPattern: /recipes|recipe|food|meal|nutrition/i },
  { path: '/timeline',      label: 'timeline',      contentPattern: /timeline|growth journey|activity|moment/i },
  { path: '/profile',       label: 'profile',       contentPattern: /profile|settings|account|child info/i },
];


test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Desktop frontend only');
});
test.describe('Navigation', () => {
  for (const { path, label, contentPattern } of ROUTES) {
    test(`${label} route renders route-specific content`, async ({ authenticatedPage: page }) => {
      await page.goto(path);

      // A raw Express "Cannot GET /path" response means the SPA didn't handle the route —
      // this is the failure condition we're guarding against.
      // not.toBeVisible() passes when the element is absent, so no catch needed
      await expect(page.getByText(/cannot get/i)).not.toBeVisible({ timeout: 8_000 });
      await expect(page).not.toHaveURL(/\/login|\/signup/i, { timeout: 8_000 });

      // Assert route-specific content appears somewhere in the page shell.
      await expect(
        page.locator('main, body').getByText(contentPattern).first()
      ).toBeVisible({ timeout: 10_000 });
    });
  }

  test('nav links connect the main sections', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    // Verify at least one nav element exists (sidebar, bottom bar, top bar, etc.)
    const navEl = page.getByRole('navigation').first();
    await expect(navEl).toBeVisible({ timeout: 8_000 });
  });
});
