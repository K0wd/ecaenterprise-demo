import { Given, When, Then } from './fixtures.js';
import { env } from '../config/env.js';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

// Shared across features — logging in is a precondition for the cart and checkout flows.
Given('I am logged in as the standard user', async ({ loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(env.standardUser, env.standardPassword);
  await inventoryPage.expectLoaded();
});

When('I log in as the standard user', async ({ loginPage }) => {
  await loginPage.login(env.standardUser, env.standardPassword);
});

Then('the Products page is displayed', async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});
