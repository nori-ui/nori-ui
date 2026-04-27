'use client';

import { useThemeColors } from './use-theme-colors';

/**
 * Returns the active token palette — equivalent to `useThemeColors()`.
 * Kept as a separate name for clarity in user code; both hooks return
 * the same `Theme` object resolved from the current `<ThemeProvider>`
 * and color scheme.
 */
export const useTheme = useThemeColors;
