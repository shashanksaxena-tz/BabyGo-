import { defineConfig, devices } from '@playwright/test';

/**
 * TinySteps AI – Playwright E2E configuration
 *
 * Projects:
 *  - desktop-chromium  → desktop-frontend (port 5173)
 *  - desktop-firefox   → desktop-frontend (port 5173)
 *  - web-chromium      → web app (port 3005)
 *  - web-mobile        → web app (port 3005) emulated as Pixel 7
 */
export default defineConfig({
  testDir: './tests',

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Expect assertion timeout */
  expect: {
    timeout: 5_000,
  },

  /* Fail the build on CI if a test.only is accidentally left in */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Run tests in parallel */
  fullyParallel: true,

  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Backend API base URL (used in fixtures) */
    baseURL: 'http://localhost:5173',
  },

  projects: [
    /* Desktop app – Chromium */
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
    },

    /* Desktop app – Firefox */
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:5173',
      },
    },

    /* Web app – Chromium */
    {
      name: 'web-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3005',
      },
    },

    /* Web app – Mobile (Pixel 7) */
    {
      name: 'web-mobile',
      use: {
        ...devices['Pixel 7'],
        baseURL: 'http://localhost:3005',
      },
    },
  ],

  /* Start the full stack via docker-compose and wait for the backend health check */
  webServer: {
    command: 'docker-compose up -d',
    url: 'http://localhost:3001/health',
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: '../',
  },
});
