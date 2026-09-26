import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: process.env.CI ? 90000 : 45000,
  expect: { timeout: process.env.CI ? 30000 : 12000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.TEST_BASE_URL ? undefined : { command: `npm run ${process.env.CI ? 'start' : 'dev'} -- --hostname 127.0.0.1 --port 3100`, url: 'http://127.0.0.1:3100', reuseExistingServer: !process.env.CI, timeout: 120000 },
});
