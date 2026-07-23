import { Page, expect } from '@playwright/test';
import { checkoutSelectors } from '../properties/checkout.properties.js';

/** Page Object for the Checkout flow (Your Information + Overview). */
export class CheckoutPage {
  constructor(private readonly page: Page) {}

  /** Fill the customer information and continue to the overview. */
  async enterInformation(
    firstName: string,
    lastName: string,
    postalCode: string,
  ): Promise<void> {
    await this.page.locator(checkoutSelectors.firstName).fill(firstName);
    await this.page.locator(checkoutSelectors.lastName).fill(lastName);
    await this.page.locator(checkoutSelectors.postalCode).fill(postalCode);
    await this.page.locator(checkoutSelectors.continueButton).click();
  }

  /** Assert the Checkout Overview page has loaded (URL + heading). */
  async expectOverviewLoaded(): Promise<void> {
    await this.page.waitForURL('**/checkout-step-two.html');
    await expect(this.page.locator(checkoutSelectors.title)).toHaveText('Checkout: Overview');
  }
}
