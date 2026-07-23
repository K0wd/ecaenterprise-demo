import { Given, When, Then } from './fixtures.js';
import { productByName } from '../helpers/test-data.js';

When('I add the {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addProduct(productName);
});

// Convenience precondition so cart/checkout scenarios don't repeat the add-item steps.
Given(
  'I have added the {string} and {string} to the cart',
  async ({ inventoryPage }, first: string, second: string) => {
    await inventoryPage.addProduct(first);
    await inventoryPage.addProduct(second);
  },
);

When('I open the shopping cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.expectLoaded();
});

When('I remove the {string} from the cart', async ({ cartPage }, productName: string) => {
  await cartPage.removeProduct(productName);
});

Then('the cart badge shows {int} items', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartBadge(count);
});

// Singular form so "1 item" reads naturally in the report.
Then('the cart badge shows {int} item', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartBadge(count);
});

Then('the cart contains the {string}', async ({ cartPage }, productName: string) => {
  await cartPage.expectProduct(productByName(productName));
});

Then('the cart has {int} items', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});

Then('the cart has {int} item', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});
