import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('web playground smoke', () => {
    test('renders the title and at least one story section', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('title')).toHaveText('unbogify-ui playground (web)');
        await expect(page.getByTestId('section-text.body-md')).toBeVisible();
    });

    test('passes axe-core a11y audit on the smoke page', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
        expect(results.violations).toEqual([]);
    });
});
