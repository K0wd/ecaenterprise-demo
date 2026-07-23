Feature: Login
  As a standard user
  I want to log into the SauceDemo application
  So that I can browse and buy products

  # Task 1 — Login and verify the Products page loads.
  Scenario: Standard user logs in and lands on the Products page
    Given I am on the login page
    When I log in as the standard user
    Then the Products page is displayed
