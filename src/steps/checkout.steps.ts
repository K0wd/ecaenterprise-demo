import { When, Then } from './fixtures.js';
import { CHECKOUT_CUSTOMER } from '../helpers/test-data.js';

When('I proceed to checkout', async ({ cartPage }) => {
  await cartPage.checkout();
});

When('I enter my checkout information', async ({ checkoutPage }) => {
  await checkoutPage.enterInformation(
    CHECKOUT_CUSTOMER.firstName,
    CHECKOUT_CUSTOMER.lastName,
    CHECKOUT_CUSTOMER.postalCode,
  );
});

Then('the Checkout Overview page is displayed', async ({ checkoutPage }) => {
  await checkoutPage.expectOverviewLoaded();
});
