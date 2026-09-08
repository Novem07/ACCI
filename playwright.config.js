const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3100', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev --workspace client -- --host localhost --port 3100',
    port: 3100,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop-chromium', testIgnore: /accessibility\.spec\.js/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'mobile-chromium', testIgnore: /accessibility\.spec\.js/, use: { ...devices['Pixel 5'] } },
    { name: 'accessibility', testMatch: /accessibility\.spec\.js/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
  ],
});
