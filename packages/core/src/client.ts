'use client';

// Client-only surface. This file is the ONLY one in the public API with
// 'use client' at the top. Everything it re-exports is safe to call from a
// client component; importing from here in a server component will cause the
// expected RSC boundary warning from Next.js.

// Providers + hooks (client-only)
export { I18nProvider, type I18nProviderProps } from './i18n/context';
export { useTranslation } from './i18n/use-translation';
export { SemanticIconsProvider, type SemanticIconsProviderProps } from './icons/semantic-context';
export { useSemanticIcon } from './icons/use-semantic-icon';
// Re-export everything from the default entry for convenience — consumers can
// import from a single subpath when they're already in client code.
export * from './index';
export { NoriProvider, type NoriProviderProps } from './provider';
export { ThemeProvider, type ThemeProviderProps } from './theme/context';
export { type ColorScheme, useColorScheme } from './theme/use-color-scheme';
export { useTheme } from './theme/use-theme';
export { useThemeColors } from './theme/use-theme-colors';
