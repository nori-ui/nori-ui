import noriPreset from '@nori-ui/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
    presets: [noriPreset, require('nativewind/preset')],
    content: ['./App.tsx', './index.ts', '../../packages/core/src/**/*.{ts,tsx}'],
};

export default config;
