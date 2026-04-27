'use client';

import type { Theme } from '@nori-ui/tokens';
import { useContext } from 'react';
import { ThemeContext } from './context';
import { useColorScheme } from './use-color-scheme';

/**
 * Returns the active token palette — `theme.light` in light mode,
 * `theme.dark` in dark mode. Resolves the theme via `ThemeContext` so
 * any ancestor `<ThemeProvider theme={...}>` flows through. With no
 * provider in the tree, the default Nori palette (teal) is used.
 *
 * Use this **inside a component** when you need a hex value for a React
 * Native `style` prop (`backgroundColor`, `borderColor`, etc.).
 *
 * Note: className-based styles (e.g. `bg-semantic-interactive-primary`)
 * compile against the @nori-ui/tokens palette at build time and don't
 * follow `<ThemeProvider>` overrides today. Inline styles via this hook
 * always do — and inline beats class on CSS specificity, so the visible
 * color you see is whatever the hook resolves to. CSS-variable theming
 * for the className path is a planned follow-up.
 */
export function useThemeColors(): Theme {
    const scheme = useColorScheme();
    const themePair = useContext(ThemeContext);
    return scheme === 'dark' ? themePair.dark : themePair.light;
}
