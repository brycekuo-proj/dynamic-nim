import { defineConfig, devices } from '@playwright/test';
const port = process.env.DYNAMIC_NIM_TEST_PORT || '4317';
export default defineConfig({
  testDir: './tests/browser', timeout: 45000, fullyParallel: false, workers: 3,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1000 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  // Isolated dev server: never silently test a stale preview already listening on 4173.
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
});
