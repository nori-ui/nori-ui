import { createRequire } from 'node:module';
import unbogifyPreset from '@unbogify/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);
const nativewindPreset = require('nativewind/preset');

const config: Config = {
    presets: [unbogifyPreset, nativewindPreset],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './components/**/*.{ts,tsx}',
        './content/**/*.{md,mdx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
};
export default config;
