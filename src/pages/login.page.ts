import { Page, expect } from '@playwright/test';
import { loginSelectors } from '../properties/login.properties.js';

/** Page Object for the Login page. */
export class LoginPage {
  constructor(private readonly page: Page) {}

  /** Navigate to the application's login screen. */
  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.locator(loginSelectors.loginButton)).toBeVisible();
  }

  /** Fill credentials and submit. */
  async login(username: string, password: string): Promise<void> {
    await this.page.locator(loginSelectors.username).fill(username);
    await this.page.locator(loginSelectors.password).fill(password);
    await this.page.locator(loginSelectors.loginButton).click();
  }
}
