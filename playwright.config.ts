import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env } from './src/config/env.js';

// Compile the Gherkin feature files + step definitions into runnable Playwright specs.
// `bddgen` writes the generated specs into `.features-gen/` (git-ignored).
const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'src/steps/**/*.ts',
});

export default defineConfig({
  testDir,

  // Fail the build if someone accidentally commits a test.only.
  forbidOnly: !!process.env.CI,

  // Retry once in CI to smooth over transient network flakiness against the public demo site.
  retries: process.env.CI ? 1 : 0,

  // Reporting mechanism: rich HTML report for humans, concise list output for the terminal / CI logs.
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: env.baseUrl,

    // Evidence capture — automatic and only when it matters (on failure), to keep artifacts small.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
