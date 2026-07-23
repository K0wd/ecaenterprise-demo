import { test as base } from 'playwright-bdd';
import { createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page.js';
import { InventoryPage } from '../pages/inventory.page.js';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';

/**
 * Custom fixtures — one Page Object per page, lazily built per test.
 * This keeps step definitions to a single line (`await loginPage.login(...)`)
 * and gives every step the same, ready-to-use objects.
 */
type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export const { Given, When, Then, AfterStep } = createBdd(test);
