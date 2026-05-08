import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('layout primitives', () => {
    test('renders every layout story section', async ({ page }) => {
        await page.goto('/');
        for (const id of ['text.body-md', 'text.heading1', 'box.default', 'hstack.with-gap', 'vstack.with-gap']) {
            await expect(page.getByTestId(`section-${id}`)).toBeVisible();
        }
    });

    test('Text Heading1 uses heading role for a11y', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByTestId('section-text.heading1').getByRole('heading', { level: 1 });
        await expect(heading).toBeVisible();
    });

    test('passes axe-core audit across the full stories page', async ({ page }) => {
        await page.goto('/');
        // See smoke.spec.ts for why these specific rules are disabled at the
        // full-page level; per-component specs run the unrelaxed rule set.
        const results = await new AxeBuilder({ page })
            .disableRules([
                'color-contrast',
                'aria-allowed-attr',
                'aria-hidden-focus',
                'aria-required-children',
                'landmark-unique',
            ])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
