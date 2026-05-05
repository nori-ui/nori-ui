'use client';

import type { Theme } from '@nori-ui/tokens';
import type { ReactNode } from 'react';
import { I18nProvider } from '../i18n/context';
import { type LocaleInput, LocaleProvider } from '../i18n/locale';
import type { I18nInput } from '../i18n/types';
import type { SemanticIcons } from '../icons/default-semantic-icons';
import { SemanticIconsProvider } from '../icons/semantic-context';
import { type NoriTheme, ThemeProvider } from '../theme/context';
import { type ColorScheme, ColorSchemeProvider } from '../theme/use-color-scheme';

export type NoriProviderProps = {
    /**
     * Theme to apply to descendants. Pass:
     *   - a `NoriTheme` (`{ light, dark }`) — covers both schemes
     *   - a single `Theme` — used for both schemes (rare)
     *   - one of the bundled presets: `tealTheme`, `blueTheme`, `roseTheme`,
     *     `violetTheme`, `orangeTheme`, `slateTheme` (from `@nori-ui/core`)
     *   - omit — falls back to the default Nori palette (teal)
     */
    theme?: NoriTheme | Theme;
    /**
     * Force a color scheme for descendants, overriding the OS signal. Use
     * when an app shell is hard-coded to one scheme (e.g. forced-dark
     * editorial chrome) and wants library components inside it to render
     * against the matching half of the theme.
     *
     * Omit to track the OS Appearance (native) / `<html>` `dark` class (web).
     */
    colorScheme?: ColorScheme;
    i18n?: I18nInput;
    icons?: Partial<SemanticIcons>;
    /**
     * BCP 47 locale tag (or `Intl.Locale`) used by locale-aware components
     * (Calendar, Number/Currency formatting, RelativeTime). Defaults to
     * the runtime's resolved locale (`new Intl.DateTimeFormat().resolvedOptions().locale`),
     * which mirrors what other `Intl` calls in the consumer's code use.
     */
    locale?: LocaleInput;
    children?: ReactNode;
};

/**
 * Single root provider composing theme, i18n, and semantic-icons contexts.
 * Place near the root of your app. Only needed to override defaults — the
 * library works out of the box without any provider.
 */
export function NoriProvider({ theme, colorScheme, i18n, icons, locale, children }: NoriProviderProps) {
    // Conditionally spread each optional prop — `exactOptionalPropertyTypes: true`
    // rejects passing `undefined` to a prop typed as `T | missing`.
    const themeProps = theme === undefined ? {} : { theme };
    const i18nProps = i18n === undefined ? {} : { i18n };
    const iconsProps = icons === undefined ? {} : { icons };
    const localeProps = locale === undefined ? {} : { locale };

    const inner = (
        <LocaleProvider {...localeProps}>
            <ThemeProvider {...themeProps}>
                <I18nProvider {...i18nProps}>
                    <SemanticIconsProvider {...iconsProps}>{children}</SemanticIconsProvider>
                </I18nProvider>
            </ThemeProvider>
        </LocaleProvider>
    );

    return colorScheme === undefined ? inner : <ColorSchemeProvider value={colorScheme}>{inner}</ColorSchemeProvider>;
}
