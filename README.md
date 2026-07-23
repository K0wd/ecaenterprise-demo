# SauceDemo — Playwright + Cucumber (BDD) E2E Tests

End-to-end tests for [saucedemo.com](https://www.saucedemo.com/) written with **Microsoft
Playwright** and **Cucumber-style BDD** (via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd)),
following the **Page Object Model**.

The scenarios cover the five assessment tasks: login, adding products, reviewing the cart,
removing an item, and completing the checkout information step.

---

## Why `playwright-bdd`?

The brief asks for **Cucumber/BDD** *and* a **Playwright HTML report** with screenshots, video,
and traces. `playwright-bdd` gives both: you write Gherkin `.feature` files and step definitions
(the Cucumber part), and it compiles them onto Playwright's own test runner — so the native
Playwright HTML report, tracing, video, and screenshot-on-failure all work out of the box, with
no separate reporting toolchain to maintain.

---

## Prerequisites

- Node.js 18+ (developed on Node 20)
- npm

## Setup

```bash
npm install
npx playwright install chromium

# Credentials are read from the environment, never hardcoded.
cp .env.example .env      # the demo values in the example file work as-is
```

## Running the tests

```bash
npm test            # generate BDD specs + run headless
npm run test:headed # watch it drive the browser
npm run report      # open the HTML report from the last run
```

`npm test` runs `bddgen` (compiles `.feature` files into Playwright specs) and then
`playwright test`.

## Reports & evidence

- **HTML report** — `playwright-report/`, open with `npm run report`.
- **Screenshots** — captured automatically on failure.
- **Video** — retained on failure.
- **Trace** — captured on first retry; open failing traces from the HTML report.

---

## Project structure

```
saucedemo-playwright-bdd/
├── features/            # Gherkin feature files — plain-English scenarios (the "what")
├── src/
│   ├── pages/           # Page Objects — actions & assertions per page (the "how")
│   ├── properties/      # Selectors only — one file per page (POM locator layer)
│   ├── steps/           # Step definitions + fixtures wiring Gherkin -> Page Objects
│   ├── helpers/         # Static test data (products, checkout customer)
│   └── config/          # Validated environment/secret access
├── .github/workflows/   # CI pipeline (GitHub Actions)
├── playwright.config.ts # Runner config: BDD wiring, reporters, evidence settings
└── .env.example         # Credential placeholders (copy to .env)
```

### Why organised this way

- **Feature files stay non-technical.** A product owner can read `features/*.feature` and confirm
  the behaviour without touching code.
- **Selectors live in one layer (`properties/`).** When SauceDemo changes its markup, only the
  properties file changes — pages, steps, and features are untouched.
- **Page Objects hold the behaviour.** Steps are thin one-liners that call page methods, so the
  same actions recombine across many scenarios.
- **Fixtures inject Page Objects** (`src/steps/fixtures.ts`), keeping steps free of setup noise.
- **Secrets come from the environment** (`src/config/env.ts`), which fails loud if a variable is
  missing — no credentials in source, no silent wrong defaults.

---

## Improvements with more time

- **Data-driven scenarios** with `Scenario Outline` / `Examples` to cover more products and the
  other SauceDemo user types (locked-out, problem, performance-glitch users).
- **Cross-browser matrix** (Firefox, WebKit) via extra Playwright projects.
- **Visual regression** and **accessibility** (axe) checks on key pages.
- **Parallel sharding** in CI and an **Allure** report for historical trends.
- Full end-to-end coverage through order completion and price-total verification.

---

## CI

`.github/workflows/playwright.yml` installs dependencies and browsers, runs the suite on every
push/PR, and uploads the HTML report as a build artifact.
