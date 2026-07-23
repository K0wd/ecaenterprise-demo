import { Page, expect } from '@playwright/test';
import { cartSelectors } from '../properties/cart.properties.js';
import type { Product } from '../helpers/test-data.js';

/** Page Object for the Cart page. */
export class CartPage {
  constructor(private readonly page: Page) {}

  /** Assert the cart page has loaded. */
  async expectLoaded(): Promise<void> {
    await this.page.waitForURL('**/cart.html');
  }

  /** Assert the number of line items in the cart. */
  async expectItemCount(count: number): Promise<void> {
    await expect(this.page.locator(cartSelectors.item)).toHaveCount(count);
  }

  /** Assert a product is present with its correct name and a visible price. */
  async expectProduct(product: Product): Promise<void> {
    const row = this.page
      .locator(cartSelectors.item)
      .filter({ hasText: product.name });
    await expect(row).toHaveCount(1);
    await expect(row.locator(cartSelectors.itemName)).toHaveText(product.name);
    await expect(row.locator(cartSelectors.itemPrice)).toHaveText(product.price);
  }

  /** Remove a product from the cart by its display name. */
  async removeProduct(productName: string): Promise<void> {
    await this.page.locator(cartSelectors.removeButton(productName)).click();
  }

  /** Proceed to the checkout information page. */
  async checkout(): Promise<void> {
    await this.page.locator(cartSelectors.checkoutButton).click();
  }
}
