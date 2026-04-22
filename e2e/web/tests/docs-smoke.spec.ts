import { expect, test } from '@playwright/test';

// These tests assume a docs server is running at http://localhost:3000
// (yarn dev:docs). The CI `docs-build` job starts it; local runs should
// boot it manually. Tests are skipped when the server isn't reachable so
// the default Playwright run (which only boots playground-web on :5173)
// stays green.

const DOCS_URL = 'http://localhost:3000';

async function docsIsUp(): Promise<boolean> {
    try {
        const res = await fetch(`${DOCS_URL}/llms.txt`);
        return res.ok;
    } catch {
        return false;
    }
}

test.describe('docs site smoke', () => {
    test.beforeAll(async () => {
        const up = await docsIsUp();
        test.skip(!up, `docs server not running at ${DOCS_URL} — run \`yarn dev:docs\` first`);
    });

    test('home page renders', async ({ page }) => {
        await page.goto(`${DOCS_URL}/`);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/unbogify-ui/);
    });

    test('docs index renders', async ({ page }) => {
        await page.goto(`${DOCS_URL}/docs`);
        await expect(page.locator('text=Introduction')).toBeVisible();
    });

    test('llms.txt served', async ({ request }) => {
        const res = await request.get(`${DOCS_URL}/llms.txt`);
        expect(res.status()).toBe(200);
        expect(await res.text()).toContain('unbogify-ui');
    });
});
