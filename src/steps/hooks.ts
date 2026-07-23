import { AfterStep } from './fixtures.js';

/**
 * Turn every run into a visual journey: attach a screenshot after each Gherkin step.
 *
 * The screenshots land in the Playwright HTML report next to their step, so anyone
 * viewing the published report can follow the whole flow — Login → Cart → Checkout —
 * without running anything. Combined with per-scenario video + trace (playwright.config),
 * the report reads as a complete, reviewable test journey.
 */
AfterStep(async ({ page, $step, $testInfo }) => {
  try {
    const screenshot = await page.screenshot();
    await $testInfo.attach(`Step: ${$step.title}`, {
      body: screenshot,
      contentType: 'image/png',
    });
  } catch (error) {
    // Evidence is best-effort — a missed screenshot must never fail the test. Log it, don't hide it.
    console.warn(`Could not capture screenshot for step "${$step.title}":`, error);
  }
});
