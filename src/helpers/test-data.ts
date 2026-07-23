/**
 * Static test data — product catalogue facts and the checkout customer.
 *
 * Kept in one place so specs read in plain English ("the Backpack") while the
 * concrete name/price live here and can be reused across steps and assertions.
 */

export interface Product {
  name: string;
  price: string;
}

export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: '$29.99' },
  bikeLight: { name: 'Sauce Labs Bike Light', price: '$9.99' },
} as const satisfies Record<string, Product>;

/** Resolve a product (name + price) from its display name, used by Gherkin steps. */
export function productByName(name: string): Product {
  const match = Object.values(PRODUCTS).find((p) => p.name === name);
  if (!match) {
    throw new Error(`Unknown product "${name}". Add it to PRODUCTS in test-data.ts.`);
  }
  return match;
}

// The customer used at checkout. No real personal data — synthetic values only.
export const CHECKOUT_CUSTOMER = {
  firstName: 'Kim',
  lastName: 'Tester',
  postalCode: '4000',
} as const;
