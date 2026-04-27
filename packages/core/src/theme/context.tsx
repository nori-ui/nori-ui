'use client';

import { themeDark as defaultDark, theme as defaultLight, type Theme } from '@nori-ui/tokens';
import type { ReactNode } from 'react';
import { createContext } from 'react';

/**
 * A `NoriTheme` is a paired light/dark palette. The active half is picked
 * by `useColorScheme()` so the same theme object covers both schemes.
 *
 * Build one yourself by spreading the defaults and overriding the colors
 * you care about, or pick a preset from `@nori-ui/core/themes` (see the
 * Theming docs for examples).
 */
export type NoriTheme = {
    light: Theme;
    dark: Theme;
};

/**
 * Default Nori palette — teal primary on a warm-paper light surface, and
 * teal-400 primary on a deep-zinc dark surface. Mirrors the `theme` /
 * `themeDark` exports from @nori-ui/tokens.
 */
export const defaultTheme: NoriTheme = {
    light: defaultLight,
    dark: defaultDark as unknown as Theme,
};

// Context value is the FULL pair, not the active half. `useThemeColors`
// (the hook components reach for) resolves it to the right one based on
// the current color scheme. Storing the pair means a parent only has to
// declare the theme once — switching scheme is a separate concern.
export const ThemeContext = createContext<NoriTheme>(defaultTheme);
ThemeContext.displayName = 'ThemeContext';

export type ThemeProviderProps = {
    /**
     * The theme to apply to descendants. Pass either:
     *   - a full `NoriTheme` (`{ light, dark }`) — both schemes covered
     *   - a single `Theme` — used for both light and dark (rare; mostly
     *     useful when you ONLY ever render in one scheme)
     *   - omit — falls back to the Nori default (teal palette)
     */
    theme?: NoriTheme | Theme;
    children?: ReactNode;
};

const isFullTheme = (t: NoriTheme | Theme): t is NoriTheme => 'light' in t && 'dark' in t;

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
    const value: NoriTheme =
        theme === undefined ? defaultTheme : isFullTheme(theme) ? theme : { light: theme, dark: theme };
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
