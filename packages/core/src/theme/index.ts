// packages/core/src/theme/index.ts
// Re-exports the generated theme types + constants from @nori-ui/tokens under
// the library's own public namespace.
//
// Consumers should import `Theme` from '@nori-ui/core', not from '@nori-ui/tokens'.

export { type Theme, theme, themeDark } from '@nori-ui/tokens';
export { defaultTheme, type NoriTheme, ThemeProvider, type ThemeProviderProps } from './context';
export { px } from './px';
export {
    blueTheme,
    orangeTheme,
    type PresetThemeName,
    presetThemes,
    roseTheme,
    slateTheme,
    tealTheme,
    violetTheme,
} from './themes';
export { type ColorScheme, useColorScheme } from './use-color-scheme';
export { useTheme } from './use-theme';
export { useThemeColors } from './use-theme-colors';
