import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('TextInput + TextArea (web)', () => {
    test('TextInput accepts typed input and reflects the value', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('section-text-input.default').getByRole('textbox');
        await input.fill('user@example.com');
        await expect(input).toHaveValue('user@example.com');
    });

    test('TextInput error state carries aria-invalid=true', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('section-text-input.with-error').getByRole('textbox');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('TextArea renders as a real <textarea> with a rows attribute', async ({ page }) => {
        await page.goto('/');
        const textarea = page.getByTestId('section-text-area.default').locator('textarea');
        await expect(textarea).toBeVisible();
        await expect(textarea).toHaveAttribute('rows', /^\d+$/);
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
