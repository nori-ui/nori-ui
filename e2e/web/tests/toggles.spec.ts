import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Checkbox + Switch (web)', () => {
    test('Checkbox toggles aria-checked on click', async ({ page }) => {
        await page.goto('/');
        const cb = page.getByTestId('section-checkbox.default').getByRole('checkbox');
        await expect(cb).toHaveAttribute('aria-checked', 'false');
        await cb.click();
        await expect(cb).toHaveAttribute('aria-checked', 'true');
    });

    test('Switch has role=switch', async ({ page }) => {
        await page.goto('/');
        const sw = page.getByTestId('section-switch.default').getByRole('switch');
        await expect(sw).toBeVisible();
    });

    test('axe audit of toggle stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .include('[data-testid^="section-checkbox."], [data-testid^="section-switch."]')
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
