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
