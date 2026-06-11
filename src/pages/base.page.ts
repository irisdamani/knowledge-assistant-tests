import { type Page } from '@playwright/test';

/**
 * Abstract base for all page objects.
 *
 * Provides:
 *  - A protected reference to the Playwright `Page` instance so subclasses
 *    can define locators in their constructors without re-declaring the field.
 *  - A `navigate(url)` helper so each page object controls its own URL
 *    rather than spreading `page.goto(...)` across test files.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }
}
