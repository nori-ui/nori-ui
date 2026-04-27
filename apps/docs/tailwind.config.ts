import { createRequire } from 'node:module';
import noriPreset from '@nori-ui/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);
const nativewindPreset = require('nativewind/preset');
// Fumadocs-ui 14 ships an ESM tailwind-plugin that imports `tailwindcss/plugin`
// bare (no `.js`). Tailwind 3.4 has no exports map, so strict ESM resolution
// rejects it. Applied a yarn patch (.yarn/patches/fumadocs-ui-*.patch) that
// rewrites the import to `tailwindcss/plugin.js`. The patch is referenced from
// apps/docs/package.json via the `patch:` protocol.
const { createPreset } = require('fumadocs-ui/tailwind-plugin');

const config: Config = {
    presets: [createPreset(), noriPreset, nativewindPreset],
    // Override the semantic.interactive.* colors so they resolve to CSS
    // variables instead of compile-time hex literals. The variables are
    // seeded in global.css with the default teal palette, and the docs
    // theme switcher (apps/docs/components/docs-theme-provider.tsx) writes
    // them onto <html> when the user picks a preset — flipping every
    // .bg-semantic-interactive-primary class on the page in one move.
    //
    // Local-only override: this lives in the docs Tailwind config rather
    // than in @nori-ui/tokens because library consumers should still get
    // baked-in colors by default. Theming via CSS variables is opt-in:
    // add the same color overrides + variable seeds to your own Tailwind
    // setup if you want the same runtime swap behavior.
    theme: {
        extend: {
            colors: {
                semantic: {
                    interactive: {
                        primary: 'var(--nori-primary)',
                        primaryHover: 'var(--nori-primary-hover)',
                        primaryPressed: 'var(--nori-primary-pressed)',
                    },
                },
            },
        },
    },
    // Toggle dark mode via either `.dark` on <html> (next-themes / Fumadocs
    // convention) or `[data-theme="dark"]` (some legacy theme switchers).
    // The Fumadocs preset defaults to `'media'`; we explicitly switch to a
    // combined selector so the in-page theme toggle, our token CSS variables
    // in global.css, and Tailwind's `dark:` variant all key off the same
    // signal. The `.dark, .dark *` part is what makes inline elements
    // (and react-native-web mounted Text) inherit dark variants.
    darkMode: ['selector', ':is(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)'],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './components/**/*.{ts,tsx}',
        './content/**/*.{md,mdx}',
        '../../packages/core/src/**/*.{ts,tsx}',
        // Fumadocs ships pre-compiled components with Tailwind classes inside;
        // Tailwind only generates utilities it sees used, so scan the dist.
        '../../node_modules/fumadocs-ui/dist/**/*.{js,mjs}',
    ],
};
export default config;
