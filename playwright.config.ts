import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
const testDir = process.env.E2E_DIR || resolve('.local', `browser-${randomUUID()}`);
process.env.E2E_DIR = testDir;
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  outputDir: 'test-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    viewport: { width: 1440, height: 950 },
    launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node apps/api/dist/main.js',
      url: 'http://127.0.0.1:4000/api/health',
      timeout: 60000,
      env: { DB_FILE: resolve(testDir, 'kapster.sqlite') },
      reuseExistingServer: false,
    },
    {
      command: 'node node_modules/vite/bin/vite.js --config apps/web/vite.config.ts',
      url: 'http://127.0.0.1:5173',
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
