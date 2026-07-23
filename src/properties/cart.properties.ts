import { slug } from './inventory.properties.js';

/**
 * Selectors for the Cart page. Selectors only.
 * `itemByName` scopes to a single cart row so name/price assertions target exactly one element.
 */
export const cartSelectors = {
  item: '[data-test="inventory-item"]',
  itemName: '[data-test="inventory-item-name"]',
  itemPrice: '[data-test="inventory-item-price"]',
  checkoutButton: '[data-test="checkout"]',
  removeButton: (productName: string) => `[data-test="remove-${slug(productName)}"]`,
} as const;
