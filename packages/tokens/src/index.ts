// @nori-ui/tokens — public entry.
// Re-exports generated artifacts so consumers import from the package root,
// never from subpaths, keeping internal layout refactorable.

export { type Theme, theme, themeDark } from '../build/theme';

// Consumers load the Tailwind preset via CommonJS require in their tailwind.config.ts:
//
//   import { noriPreset } from '@nori-ui/tokens';
//   export default { presets: [noriPreset], content: [...] };
//
// We re-export the preset path here as a string so the require can be lazy.
export const tailwindPresetPath = '@nori-ui/tokens/tailwind-preset';
