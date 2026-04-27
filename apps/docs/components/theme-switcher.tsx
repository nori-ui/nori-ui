'use client';

import { type PresetThemeName, presetThemes } from '@nori-ui/core/client';
import { useDocsTheme } from './docs-theme-provider';

// One swatch per preset — color is the `interactive.primary` of the light
// half so the swatch reads at a glance as "this is the brand color you're
// previewing".
const SWATCHES: { name: PresetThemeName; label: string; color: string }[] = [
    { name: 'teal', label: 'Teal (default)', color: presetThemes.teal.light.semantic.interactive.primary },
    { name: 'blue', label: 'Blue', color: presetThemes.blue.light.semantic.interactive.primary },
    { name: 'rose', label: 'Rose', color: presetThemes.rose.light.semantic.interactive.primary },
    { name: 'violet', label: 'Violet', color: presetThemes.violet.light.semantic.interactive.primary },
    { name: 'orange', label: 'Orange', color: presetThemes.orange.light.semantic.interactive.primary },
    { name: 'slate', label: 'Slate', color: presetThemes.slate.light.semantic.interactive.primary },
];

/**
 * Floating theme switcher. Sits bottom-right of the docs viewport and
 * never moves. Picking a preset updates the docs-wide theme context so
 * every `<Preview>` re-renders its inner components against the new
 * palette.
 *
 * Doesn't touch the docs CHROME (sidebar, headings) — those are
 * Fumadocs-styled and live outside the Nori provider tree.
 */
export function ThemeSwitcher() {
    const { presetName, setPresetName } = useDocsTheme();
    return (
        // <fieldset> + <legend> is the semantic HTML for a radiogroup, so
        // the a11y tree picks it up without needing role="radiogroup". The
        // <legend> is visually hidden — the floating widget is its own
        // visible affordance.
        // position: fixed so the switcher stays put as the doc page
        // scrolls. z-index above 60 so dialogs/toasts can still float
        // above it (those use 50/60 ranges).
        <fieldset className="fixed bottom-4 right-4 z-[70] flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card px-2 py-1.5 shadow-md backdrop-blur">
            <legend className="sr-only">Preview theme</legend>
            {SWATCHES.map((s) => {
                const selected = s.name === presetName;
                return (
                    // biome-ignore lint/a11y/useSemanticElements: <input type=radio> can't be styled as a colored circle without losing semantics
                    <button
                        key={s.name}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={s.label}
                        title={s.label}
                        onClick={() => setPresetName(s.name)}
                        className={`relative inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                            selected ? 'ring-2 ring-fd-foreground ring-offset-2 ring-offset-fd-card' : ''
                        }`}
                        style={{ backgroundColor: s.color }}
                    >
                        {/* Visually-hidden label for screen readers */}
                        <span className="sr-only">{s.label}</span>
                    </button>
                );
            })}
        </fieldset>
    );
}
