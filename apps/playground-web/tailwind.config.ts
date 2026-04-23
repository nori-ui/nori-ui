import { createRequire } from 'node:module';
import noriPreset from '@nori-ui/tokens/tailwind-preset';
import type { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);
// NativeWind's preset teaches Tailwind about RN-only utilities and wires the
// web runtime. Order matters: token preset first so its theme extensions apply
// on top of NativeWind's defaults.
const nativewindPreset = require('nativewind/preset');

const config: Config = {
    presets: [noriPreset, nativewindPreset],
    content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
