import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: 'tests/extension.e2e.mjs',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    headless: false,
    baseURL: 'http://localhost:7474',
  },
  webServer: {
    command: 'python -m http.server 7474',
    url: 'http://localhost:7474',
    cwd: 'test-page',
    reuseExistingServer: true,
  },
});
