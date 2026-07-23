import { Page, expect } from '@playwright/test';
import { inventorySelectors } from '../properties/inventory.properties.js';

/** Page Object for the Inventory (Products) page. */
export class InventoryPage {
  constructor(private readonly page: Page) {}

  /** Assert the Products page has loaded (URL + heading). */
  async expectLoaded(): Promise<void> {
    await this.page.waitForURL('**/inventory.html');
    await expect(this.page.locator(inventorySelectors.title)).toHaveText('Products');
  }

  /** Add a product to the cart by its display name. */
  async addProduct(productName: string): Promise<void> {
    await this.page.locator(inventorySelectors.addToCartButton(productName)).click();
  }

  /** Assert the shopping cart badge shows the expected count. */
  async expectCartBadge(count: number): Promise<void> {
    await expect(this.page.locator(inventorySelectors.cartBadge)).toHaveText(String(count));
  }

  /** Open the shopping cart. */
  async openCart(): Promise<void> {
    await this.page.locator(inventorySelectors.cartLink).click();
  }
}
