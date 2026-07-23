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
    // Machine-readable results — consumed by scripts/build-history.mjs to build the
    // per-test flakiness history published alongside the HTML report.
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: env.baseUrl,

    // Evidence for a reviewable "test journey" report — captured on every run so the
    // published HTML report always shows what the tests did, not just green ticks:
    //   - per-step screenshots are attached by src/steps/hooks.ts (AfterStep)
    //   - video: full recording of each scenario
    //   - trace: interactive step-by-step timeline with DOM snapshots (open from the report)
    // A dedicated failure screenshot is still captured on top for fast triage.
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
