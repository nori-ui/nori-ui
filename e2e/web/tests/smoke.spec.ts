import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('web playground smoke', () => {
    test('renders the title and primary swatch from @unbogify/tokens', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('title')).toHaveText('unbogify-ui playground (web)');
        const swatch = page.getByTestId('primary-swatch');
        await expect(swatch).toBeVisible();
        const hex = await page.getByTestId('primary-hex').textContent();
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('passes axe-core a11y audit on the smoke page', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
});
