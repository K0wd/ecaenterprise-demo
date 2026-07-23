Feature: Shopping cart
  As a logged-in shopper
  I want to add and remove products
  So that my cart reflects exactly what I intend to buy

  Background:
    Given I am logged in as the standard user

  # Tasks 2 & 3 — Add two products, verify the badge, then verify cart contents.
  Scenario: Add two products and review the cart
    When I add the "Sauce Labs Backpack" to the cart
    And I add the "Sauce Labs Bike Light" to the cart
    Then the cart badge shows 2 items
    When I open the shopping cart
    Then the cart has 2 items
    And the cart contains the "Sauce Labs Backpack"
    And the cart contains the "Sauce Labs Bike Light"

  # Task 4 — Remove one product and verify the cart and badge update.
  Scenario: Remove a product from the cart
    Given I have added the "Sauce Labs Backpack" and "Sauce Labs Bike Light" to the cart
    And the cart badge shows 2 items
    When I open the shopping cart
    And I remove the "Sauce Labs Backpack" from the cart
    Then the cart has 1 item
    And the cart contains the "Sauce Labs Bike Light"
    And the cart badge shows 1 item
