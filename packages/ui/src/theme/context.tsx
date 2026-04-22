'use client';

import { theme as defaultTheme, type Theme } from '@unbogify/tokens';
import type { ReactNode } from 'react';
import { createContext } from 'react';

export const ThemeContext = createContext<Theme>(defaultTheme);
ThemeContext.displayName = 'ThemeContext';

export type ThemeProviderProps = {
    theme?: Theme;
    children?: ReactNode;
};

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
