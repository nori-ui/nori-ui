import unbogifyPreset from '@unbogify/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
    presets: [unbogifyPreset],
    content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
