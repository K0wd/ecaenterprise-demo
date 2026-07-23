// Build the rolling CI history consumed by kimbandeleon.pro's "CI Runs" section.
//
// Reads the Playwright JSON results for THIS run, appends a compact per-test record to
// the previously published history, caps the window, and writes the merged history out.
// Everything the site needs to draw the pass/fail "sticks" lives in this one file.
//
// Inputs (env):
//   RESULTS   Playwright JSON report          (default: test-results/results.json)
//   PREV      previously published history    (default: prev-history.json, optional)
//   OUT       merged history to write         (default: public/history.json)
//   MAX       runs to keep                    (default: 40)
//   RUN_NUMBER, RUN_ID, GIT_SHA, GIT_BRANCH, RUN_DATE, REPO   run metadata
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const env = process.env;
const RESULTS = env.RESULTS || 'test-results/results.json';
const PREV = env.PREV || 'prev-history.json';
const OUT = env.OUT || 'public/history.json';
const MAX = Number(env.MAX || 40);

/** Flatten Playwright's nested suites into `{ name, status }` per test. */
function collectTests(report) {
  const out = [];
  const isFile = (t) => !t || t.includes('.feature') || t.includes('/') || t.includes('\\');

  const walk = (suite, titleChain) => {
    const chain = isFile(suite.title) ? titleChain : [...titleChain, suite.title];
    for (const spec of suite.specs || []) {
      // Collapse a spec's retries into a single verdict.
      const statuses = (spec.tests || []).map((t) => t.status);
      let status = 'passed';
      if (statuses.includes('unexpected')) status = 'failed';
      else if (statuses.includes('flaky')) status = 'flaky';
      else if (statuses.length && statuses.every((s) => s === 'skipped')) status = 'skipped';
      out.push({ name: [...chain, spec.title].join(' › '), status });
    }
    for (const child of suite.suites || []) walk(child, chain);
  };

  for (const suite of report.suites || []) walk(suite, []);
  return out;
}

const report = JSON.parse(readFileSync(RESULTS, 'utf8'));
const tests = collectTests(report);
const failed = tests.filter((t) => t.status === 'failed').length;
const flaky = tests.filter((t) => t.status === 'flaky').length;

const run = {
  run: Number(env.RUN_NUMBER || 0),
  runId: env.RUN_ID || '',
  sha: env.GIT_SHA || '',
  shortSha: (env.GIT_SHA || '').slice(0, 7),
  branch: env.GIT_BRANCH || '',
  date: env.RUN_DATE || '',
  repo: env.REPO || '',
  conclusion: failed > 0 ? 'failure' : 'success',
  total: tests.length,
  failed,
  flaky,
  tests,
};

// Load prior history (absent/corrupt -> start fresh; never fail the build over history).
let history = [];
if (existsSync(PREV)) {
  try {
    const parsed = JSON.parse(readFileSync(PREV, 'utf8'));
    if (Array.isArray(parsed)) history = parsed;
  } catch {
    console.warn(`Could not parse ${PREV}; starting a fresh history.`);
  }
}

// Replace a re-run of the same run number, otherwise append; keep the most recent MAX.
history = history.filter((r) => r.run !== run.run);
history.push(run);
history.sort((a, b) => a.run - b.run);
history = history.slice(-MAX);

writeFileSync(OUT, JSON.stringify(history, null, 2));
console.log(
  `history: ${history.length} runs, latest #${run.run} ${run.conclusion} ` +
    `(${run.total} tests, ${failed} failed, ${flaky} flaky)`,
);
