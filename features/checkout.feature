Feature: Checkout
  As a logged-in shopper
  I want to complete the checkout information step
  So that I can review my order before buying

  Background:
    Given I am logged in as the standard user

  # Task 5 — Proceed through checkout and verify the Overview page loads.
  Scenario: Complete checkout information and reach the overview
    Given I have added the "Sauce Labs Backpack" and "Sauce Labs Bike Light" to the cart
    When I open the shopping cart
    And I proceed to checkout
    And I enter my checkout information
    Then the Checkout Overview page is displayed
