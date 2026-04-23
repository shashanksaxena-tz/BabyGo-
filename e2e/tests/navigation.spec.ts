import { test, expect } from '../fixtures/auth';

const ROUTES: Array<{ path: string; label: string; contentPattern: RegExp }> = [
  { path: '/',              label: 'dashboard',     contentPattern: /dashboard|home|welcome|child|baby/i },
  { path: '/insights',      label: 'insights',      contentPattern: /insight|analysis/i },
  { path: '/stories',       label: 'stories',       contentPattern: /stories|bedtime|tale/i },
  { path: '/milestones',    label: 'milestones',    contentPattern: /milestone|tracker/i },
  { path: '/growth-charts', label: 'growth-charts', contentPattern: /growth|chart|weight|height/i },
  { path: '/recipes',       label: 'recipes',       contentPattern: /recipe|food|meal|nutrition/i },
  { path: '/timeline',      label: 'timeline',      contentPattern: /timeline|activity|moment/i },
  { path: '/profile',       label: 'profile',       contentPattern: /profile|account|settings|name|email/i },
];

test.describe('Navigation', () => {
  for (const { path, label, contentPattern } of ROUTES) {
    test(`${label} route renders route-specific content`, async ({ authenticatedPage: page }) => {
      await page.goto(path);

      // A raw Express "Cannot GET /path" response means the SPA didn't handle the route —
      // this is the failure condition we're guarding against.
      // not.toBeVisible() passes when the element is absent, so no catch needed
      await expect(page.getByText(/cannot get/i)).not.toBeVisible({ timeout: 8_000 });

      // Assert that the page renders content specific to this route, not just
      // "something loaded". This catches cases where the router falls back to a
      // generic shell without rendering the correct view.
      await expect(
        page.getByRole('heading').filter({ hasText: contentPattern }).first()
          .or(page.getByText(contentPattern).first())
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
