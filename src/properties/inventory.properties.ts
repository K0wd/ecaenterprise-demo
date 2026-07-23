/**
 * Selectors for the Inventory (Products) page. Selectors only.
 *
 * SauceDemo builds the add-to-cart button's `data-test` from the product name,
 * e.g. "Sauce Labs Backpack" -> "add-to-cart-sauce-labs-backpack". `slug()` mirrors that.
 */
export function slug(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-');
}

export const inventorySelectors = {
  title: '[data-test="title"]',
  cartBadge: '[data-test="shopping-cart-badge"]',
  cartLink: '[data-test="shopping-cart-link"]',
  addToCartButton: (productName: string) => `[data-test="add-to-cart-${slug(productName)}"]`,
} as const;
