import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'https://dudodice.com';
const browserChannel = process.env.PW_BROWSER_CHANNEL;
const browserName = process.env.PW_BROWSER || 'chromium';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        browserName,
        channel: browserChannel,
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        browserName,
        channel: browserChannel,
      },
    },
  ],
});
