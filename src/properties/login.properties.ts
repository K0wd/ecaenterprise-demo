/**
 * Selectors for the Login page. Selectors only — no behaviour.
 * Prefer stable `data-test` attributes exposed by SauceDemo.
 */
export const loginSelectors = {
  username: '[data-test="username"]',
  password: '[data-test="password"]',
  loginButton: '[data-test="login-button"]',
  error: '[data-test="error"]',
} as const;
