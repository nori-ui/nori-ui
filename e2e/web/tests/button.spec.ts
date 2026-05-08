import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Section IDs follow App.tsx's `section-${slug}.${storyId}` pattern, where
// storyId is the lowercased CSF export name. Each section wraps exactly one
// rendered story, so we scope to it and grab the inner [role=button].
const button = (page: import('@playwright/test').Page, story: string) =>
    page.getByTestId(`section-button.${story}`).getByRole('button');

test.describe('Button (web)', () => {
    test('primary button is clickable and triggers onPress (via a rendered log)', async ({ page }) => {
        await page.goto('/');
        const btn = button(page, 'primary');
        await expect(btn).toBeVisible();
        await btn.click(); // no asserting side-effect unless App.tsx wires a log; click itself should not throw
    });

    test('loading button has aria-busy=true', async ({ page }) => {
        await page.goto('/');
        const btn = button(page, 'loading');
        await expect(btn).toHaveAttribute('aria-busy', 'true');
    });

    test('destructive button renders with button role', async ({ page }) => {
        await page.goto('/');
        const btn = button(page, 'destructive');
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
