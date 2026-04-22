import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('layout primitives', () => {
    test('renders every layout story section', async ({ page }) => {
        await page.goto('/');
        for (const id of ['text.body-md', 'text.heading-1', 'box.default', 'hstack.gap-4', 'vstack.gap-4']) {
            await expect(page.getByTestId(`section-${id}`)).toBeVisible();
        }
    });

    test('Text heading-1 uses heading role for a11y', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByTestId('story-text-heading-1');
        await expect(heading).toHaveAttribute('role', 'heading');
    });

    test('passes axe-core audit across the full stories page', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
});
