/* biome-ignore-all lint/suspicious/noConsole: probe */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[pe]', e.message.slice(0, 200)));
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const comp = (el, ...keys) => (el ? Object.fromEntries(keys.map((k) => [k, getComputedStyle(el)[k]])) : null);
    return {
        body: comp(document.body, 'backgroundColor', 'fontFamily', 'color'),
        main: comp(q('main'), 'maxWidth', 'padding', 'margin'),
        h1: { text: q('h1')?.textContent, ...comp(q('h1'), 'fontSize', 'fontWeight', 'color') },
        first_section: comp(
            q('[data-testid^="section-"]'),
            'borderColor',
            'borderRadius',
            'backgroundColor',
            'padding',
            'boxShadow'
        ),
        button_primary: {
            class: q('[data-testid="story-button-primary"]')?.className,
            ...comp(q('[data-testid="story-button-primary"]'), 'backgroundColor', 'padding', 'borderRadius'),
        },
        rules: Array.from(document.styleSheets).reduce((n, s) => {
            try {
                return n + s.cssRules.length;
            } catch {
                return n;
            }
        }, 0),
    };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
