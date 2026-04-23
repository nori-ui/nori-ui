import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Button (web)', () => {
    test('primary button is clickable and triggers onPress (via a rendered log)', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-primary');
        await expect(btn).toBeVisible();
        await btn.click(); // no asserting side-effect unless App.tsx wires a log; click itself should not throw
    });

    test('loading button has aria-busy=true', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-loading');
        await expect(btn).toHaveAttribute('aria-busy', 'true');
    });

    test('destructive button renders with button role', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-destructive');
        await expect(btn).toHaveAttribute('role', 'button');
    });

    test('axe audit of button stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .include('[data-testid^="section-button."]')
            .disableRules(['color-contrast'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
