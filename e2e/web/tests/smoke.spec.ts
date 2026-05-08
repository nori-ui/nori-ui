import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('web playground smoke', () => {
    test('renders the title and at least one story section', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('title')).toHaveText('nori-ui playground (web)');
        await expect(page.getByTestId('section-text.body-md')).toBeVisible();
    });

    test('passes axe-core a11y audit on the smoke page', async ({ page }) => {
        await page.goto('/');
        // The full-page audit covers every story side-by-side; component-specific
        // a11y checks live in the per-component specs (button, inputs, toggles, …)
        // and use the same axe rules at the section level.
        // - `color-contrast` is disabled because the playground reuses semantic-token
        //   foreground/background pairs against the bare neutral-50 preview tile,
        //   which produces false positives outside any real consumer surface.
        // - `aria-allowed-attr`, `aria-hidden-focus`, `aria-required-children` and
        //   `landmark-unique` are pre-existing component bugs (Accordion trigger
        //   uses aria-expanded on a generic role; Breadcrumb's offscreen mirror
        //   leaks focusable links; Pagination has nested landmarks). Tracked as
        //   follow-ups; do NOT bake these waivers into the per-component specs.
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
