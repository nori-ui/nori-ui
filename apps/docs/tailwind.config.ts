import unbogifyPreset from '@unbogify/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
    presets: [unbogifyPreset],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './components/**/*.{ts,tsx}',
        './content/**/*.{md,mdx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
};
export default config;
