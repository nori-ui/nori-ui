'use client';

import {
    blueTheme,
    type NoriTheme,
    orangeTheme,
    type PresetThemeName,
    presetThemes,
    roseTheme,
    slateTheme,
    tealTheme,
    violetTheme,
} from '@nori-ui/core/client';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'nori-docs-preset-theme';

type DocsThemeContextValue = {
    presetName: PresetThemeName;
    setPresetName: (name: PresetThemeName) => void;
    theme: NoriTheme;
};

const DocsThemeContext = createContext<DocsThemeContextValue | null>(null);

const isValidPreset = (value: unknown): value is PresetThemeName => typeof value === 'string' && value in presetThemes;

const PRESET_BY_NAME: Record<PresetThemeName, NoriTheme> = {
    teal: tealTheme,
    blue: blueTheme,
    rose: roseTheme,
    violet: violetTheme,
    orange: orangeTheme,
    slate: slateTheme,
};

/**
 * Holds the currently selected docs-wide preset theme. Persisted to
 * localStorage so reloads keep your pick. Mounted at the docs root layout
 * so the entire content tree (Preview wrappers, in particular) can read
 * the active palette and pass it into NoriProvider.
 *
 * Why this lives in apps/docs (not @nori-ui/core): theme state belongs to
 * the consumer app. The library exposes the presets and the
 * <NoriProvider theme> prop; everything above that — picker UI, persistence,
 * default selection — is product-side.
 */
export function DocsThemeProvider({ children }: { children: ReactNode }) {
    const [presetName, setPresetNameState] = useState<PresetThemeName>('teal');

    // Hydrate from localStorage on mount so the SSR-default "teal" doesn't
    // win against a previously-chosen preset on subsequent visits.
    // Mount-only sync — we don't want to re-read whenever the user picks
    // a new preset (the writer below already keeps storage in sync).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (isValidPreset(stored)) {
                setPresetNameState(stored);
            }
        } catch {
            // localStorage can throw in private browsing / strict contexts.
            // The default ('teal') is already applied — nothing else to do.
        }
    }, []);

    // Push the active preset's full primary ramp + semantic interactive
    // aliases onto <html> as CSS variables. The docs Tailwind config
    // rewrites both `bg-primary-100/200/.../900` AND
    // `bg-semantic-interactive-primary` to `var(--nori-primary-*)`, so
    // this single mutation flips every brand-colored class on the page
    // — including the buttons + Boxes baked into preview demos at
    // build time. Without this, the Tailwind class wins on CSS
    // specificity and the theme switcher looks broken.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const active = PRESET_BY_NAME[presetName];
        // Light half drives the variables — dark-mode adjustments come
        // from the .dark block in global.css. Per-scheme picker swap
        // (different preset for dark) is a future refinement.
        const lightColors = active.light.color.primary;
        for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const) {
            root.style.setProperty(`--nori-primary-${step}`, lightColors[step]);
        }
        const { primary, primaryHover, primaryPressed } = active.light.semantic.interactive;
        root.style.setProperty('--nori-primary', primary);
        root.style.setProperty('--nori-primary-hover', primaryHover);
        root.style.setProperty('--nori-primary-pressed', primaryPressed);
    }, [presetName]);

    const setPresetName = useCallback((next: PresetThemeName) => {
        setPresetNameState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Ignore storage failures — UI state still updates either way.
        }
    }, []);

    const theme = PRESET_BY_NAME[presetName];

    return (
        <DocsThemeContext.Provider value={{ presetName, setPresetName, theme }}>{children}</DocsThemeContext.Provider>
    );
}

/**
 * Read the currently selected docs-wide preset. Defaults to teal when no
 * `<DocsThemeProvider>` wraps the tree (lets Preview render in isolation
 * during dev / story playback without the provider).
 */
export function useDocsTheme(): DocsThemeContextValue {
    const ctx = useContext(DocsThemeContext);
    if (ctx) return ctx;
    return { presetName: 'teal', setPresetName: () => undefined, theme: tealTheme };
}
