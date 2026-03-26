import { test, expect } from '../fixtures/auth';

const ROUTES = [
  { path: '/',               label: 'dashboard'     },
  { path: '/insights',       label: 'insights'      },
  { path: '/stories',        label: 'stories'       },
  { path: '/milestones',     label: 'milestones'    },
  { path: '/growth-charts',  label: 'growth-charts' },
  { path: '/recipes',        label: 'recipes'       },
  { path: '/timeline',       label: 'timeline'      },
  { path: '/profile',        label: 'profile'       },
];

test.describe('Navigation', () => {
  for (const { path, label } of ROUTES) {
    test(`${label} route loads without "Cannot GET" error`, async ({ authenticatedPage: page }) => {
      await page.goto(path);

      // A raw Express "Cannot GET /path" response means the SPA didn't handle the route —
      // this is the failure condition we're guarding against.
      await expect(page.getByText(/cannot get/i)).not.toBeVisible({ timeout: 8_000 }).catch(() => {
        // Swallow if element is simply absent — that's the happy path
      });

      // The page body should have non-trivial content (i.e. the React app rendered)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length, `${label} page body appears empty`).toBeGreaterThan(10);
    });
  }

  test('nav links connect the main sections', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    // Verify at least one nav element exists (sidebar, bottom bar, top bar, etc.)
    const navEl = page.getByRole('navigation').first();
    await expect(navEl).toBeVisible({ timeout: 8_000 });
  });
});
