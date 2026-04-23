import { createRequire } from 'node:module';
import unbogifyPreset from '@unbogify/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);
const nativewindPreset = require('nativewind/preset');

// NOTE: Fumadocs UI ships an ESM tailwind-plugin that imports
// `tailwindcss/plugin` bare (no `.js`). Tailwind 3.4 has no `exports` map, so
// Node strict-ESM resolution fails when Jiti loads this config. We hand-roll
// just the minimum CSS variables Fumadocs layouts reference, instead of
// loading createPreset(). This is a temporary shim — revisit when either
// Fumadocs adds .js extensions or tailwindcss ships an exports map.
const fumadocsShim = {
    theme: {
        extend: {
            colors: {
                'fd-background': 'hsl(var(--fd-background, 0 0% 100%))',
                'fd-foreground': 'hsl(var(--fd-foreground, 240 10% 3.9%))',
                'fd-muted': 'hsl(var(--fd-muted, 240 4.8% 95.9%))',
                'fd-muted-foreground': 'hsl(var(--fd-muted-foreground, 240 3.8% 45%))',
                'fd-popover': 'hsl(var(--fd-popover, 0 0% 100%))',
                'fd-popover-foreground': 'hsl(var(--fd-popover-foreground, 240 10% 3.9%))',
                'fd-card': 'hsl(var(--fd-card, 0 0% 100%))',
                'fd-card-foreground': 'hsl(var(--fd-card-foreground, 240 10% 3.9%))',
                'fd-border': 'hsl(var(--fd-border, 240 5.9% 90%))',
                'fd-primary': 'hsl(var(--fd-primary, 240 5.9% 10%))',
                'fd-primary-foreground': 'hsl(var(--fd-primary-foreground, 0 0% 98%))',
                'fd-secondary': 'hsl(var(--fd-secondary, 240 4.8% 95.9%))',
                'fd-secondary-foreground': 'hsl(var(--fd-secondary-foreground, 240 5.9% 10%))',
                'fd-accent': 'hsl(var(--fd-accent, 240 4.8% 95.9%))',
                'fd-accent-foreground': 'hsl(var(--fd-accent-foreground, 240 5.9% 10%))',
                'fd-ring': 'hsl(var(--fd-ring, 240 5% 64.9%))',
            },
        },
    },
} satisfies Partial<Config>;

const config: Config = {
    presets: [unbogifyPreset, nativewindPreset, fumadocsShim],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './components/**/*.{ts,tsx}',
        './content/**/*.{md,mdx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
        // Fumadocs ships pre-compiled components with Tailwind classes inside;
        // Tailwind only generates utilities it sees used, so scan the dist.
        '../../node_modules/fumadocs-ui/dist/**/*.{js,mjs}',
    ],
};
export default config;
