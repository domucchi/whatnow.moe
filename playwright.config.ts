import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3012);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `E2E_MSW=1 PORT=${port} bun run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
