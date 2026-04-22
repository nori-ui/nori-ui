import unbogifyPreset from '@unbogify/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
    presets: [unbogifyPreset, require('nativewind/preset')],
    content: ['./App.tsx', './index.ts', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
