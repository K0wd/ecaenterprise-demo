/**
 * Selectors for the Checkout pages (Your Information + Overview). Selectors only.
 */
export const checkoutSelectors = {
  firstName: '[data-test="firstName"]',
  lastName: '[data-test="lastName"]',
  postalCode: '[data-test="postalCode"]',
  continueButton: '[data-test="continue"]',
  title: '[data-test="title"]',
} as const;
