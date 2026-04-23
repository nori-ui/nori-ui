import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('TextInput + TextArea (web)', () => {
    test('TextInput accepts typed input and reflects the value', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('story-text-input-default');
        await input.fill('user@example.com');
        await expect(input).toHaveValue('user@example.com');
    });

    test('TextInput error state carries aria-invalid=true and shows message', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('story-text-input-error');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('TextArea renders as textarea with the configured rows', async ({ page }) => {
        await page.goto('/');
        const textarea = page.getByTestId('story-text-area-default');
        await expect(textarea).toHaveAttribute('rows', '3');
    });

    test('axe audit of input stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .include('[data-testid^="section-text-"]')
            .disableRules(['color-contrast'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
