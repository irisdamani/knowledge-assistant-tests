import { defineConfig, devices } from '@playwright/test';

const BASE_URL =
  process.env.BASE_URL || 'https://main-knowledge-assistant.newpage.workers.dev';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],

  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },

    // Failure diagnostics
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testMatch: 'src/tests/api/**/*.spec.ts',
    },
    {
      name: 'ui',
      testMatch: 'src/tests/ui/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
