import { test as base } from '@playwright/test';
import { AssistantPage } from '../../pages/assistantPage';

type UiFixtures = {
  app: AssistantPage;
};

/**
 * Extended test object with pre-built page objects.
 *
 * Usage in a spec file:
 *
 *   import { test, expect } from './fixtures';
 *
 *   test('example', async ({ app }) => {
 *     await app.goto();
 *     await app.setUser('Americas', 'Employee');
 *   });
 *
 * The `app` fixture instantiates AssistantPage and navigates to the root
 * URL before each test, so individual tests never repeat boilerplate setup.
 */
export const test = base.extend<UiFixtures>({
  app: async ({ page }, use) => {
    const app = new AssistantPage(page);
    await app.goto();
    await use(app);
  },
});

export { expect } from '@playwright/test';
