'use client';

import { useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

const isWeb = Platform.OS === 'web';

// Web: a document is "in dark mode" when the root <html> element carries
// the `dark` class (Tailwind / Fumadocs convention) OR a `data-theme="dark"`
// attribute (matches the `darkMode` selectors in our Tailwind preset).
// We deliberately don't fall back to `prefers-color-scheme` — the app
// usually owns that decision and writes it onto <html>; tracking the system
// preference too would fight the app's chosen value.
function readWebScheme(): ColorScheme {
    if (typeof document === 'undefined') return 'light';
    const root = document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.getAttribute('data-theme') === 'dark') return 'dark';
    return 'light';
}

/**
 * Returns the current color scheme — `'light'` or `'dark'`.
 *
 * On web: observes the root `<html>` element's `class="dark"` and
 * `data-theme="dark"` attribute (the same signals our Tailwind preset
 * keys on). Updates live as those flip.
 *
 * On native: delegates to `react-native`'s `Appearance` API so the hook
 * tracks the OS preference without extra wiring.
 *
 * Components consume this indirectly via `useThemeColors()`; reach for
 * this directly when you need the raw scheme (e.g. to swap an icon).
 */
export function useColorScheme(): ColorScheme {
    const [scheme, setScheme] = useState<ColorScheme>(() => {
        if (isWeb) return readWebScheme();
        return (Appearance.getColorScheme() ?? 'light') as ColorScheme;
    });

    useEffect(() => {
        if (isWeb) {
            const root = document.documentElement;
            const update = () => setScheme(readWebScheme());
            const observer = new MutationObserver(update);
            observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            // Sync once after mount in case SSR shipped a different value.
            update();
            return () => observer.disconnect();
        }

        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setScheme((colorScheme ?? 'light') as ColorScheme);
        });
        return () => sub.remove();
    }, []);

    return scheme;
}
