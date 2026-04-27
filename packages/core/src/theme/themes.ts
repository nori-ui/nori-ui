import { themeDark as defaultDark, theme as defaultLight, type Theme } from '@nori-ui/tokens';
import type { NoriTheme } from './context';

/**
 * Built-in theme presets. Pass any of these to `<NoriProvider theme={...}>`
 * (or `<ThemeProvider theme={...}>` directly) to swap the brand color
 * across the whole component library.
 *
 * Each preset overrides the `primary` color ramp AND the semantic
 * `interactive.primary` / `primaryHover` / `primaryPressed` derivations.
 * Backgrounds, borders, neutrals, and the destructive/warning/success
 * tones stay identical to the default — themes are about brand identity,
 * not full re-skins. (For a full re-skin, build your own NoriTheme by
 * spreading `defaultTheme` and overriding whatever you need.)
 *
 * Custom theme example:
 *
 *   import { defaultTheme } from '@nori-ui/core/theme';
 *   const myTheme: NoriTheme = {
 *       light: { ...defaultTheme.light, color: { ...defaultTheme.light.color, primary: { ... } } },
 *       dark:  { ...defaultTheme.dark,  color: { ...defaultTheme.dark.color,  primary: { ... } } },
 *   };
 */

// Each ramp follows the same 50-900 step pattern as the default teal —
// values picked from the Tailwind palette so they sit in a familiar
// brightness scale. The "primary 600" step is the canonical resting
// brand color for buttons; "primary 700" is the hover; "primary 400"
// is the dark-mode brand color (brighter to read against #18181b).
type PrimaryRamp = {
    '50': string;
    '100': string;
    '200': string;
    '300': string;
    '400': string;
    '500': string;
    '600': string;
    '700': string;
    '800': string;
    '900': string;
};

const RAMPS = {
    teal: {
        '50': '#f0fdfa',
        '100': '#ccfbf1',
        '200': '#99f6e4',
        '300': '#5eead4',
        '400': '#2dd4bf',
        '500': '#14b8a6',
        '600': '#0d9488',
        '700': '#0f766e',
        '800': '#115e59',
        '900': '#134e4a',
    },
    blue: {
        '50': '#eff6ff',
        '100': '#dbeafe',
        '200': '#bfdbfe',
        '300': '#93c5fd',
        '400': '#60a5fa',
        '500': '#3b82f6',
        '600': '#2563eb',
        '700': '#1d4ed8',
        '800': '#1e40af',
        '900': '#1e3a8a',
    },
    rose: {
        '50': '#fff1f2',
        '100': '#ffe4e6',
        '200': '#fecdd3',
        '300': '#fda4af',
        '400': '#fb7185',
        '500': '#f43f5e',
        '600': '#e11d48',
        '700': '#be123c',
        '800': '#9f1239',
        '900': '#881337',
    },
    violet: {
        '50': '#f5f3ff',
        '100': '#ede9fe',
        '200': '#ddd6fe',
        '300': '#c4b5fd',
        '400': '#a78bfa',
        '500': '#8b5cf6',
        '600': '#7c3aed',
        '700': '#6d28d9',
        '800': '#5b21b6',
        '900': '#4c1d95',
    },
    orange: {
        '50': '#fff7ed',
        '100': '#ffedd5',
        '200': '#fed7aa',
        '300': '#fdba74',
        '400': '#fb923c',
        '500': '#f97316',
        '600': '#ea580c',
        '700': '#c2410c',
        '800': '#9a3412',
        '900': '#7c2d12',
    },
    slate: {
        '50': '#f8fafc',
        '100': '#f1f5f9',
        '200': '#e2e8f0',
        '300': '#cbd5e1',
        '400': '#94a3b8',
        '500': '#64748b',
        '600': '#475569',
        '700': '#334155',
        '800': '#1e293b',
        '900': '#0f172a',
    },
} as const satisfies Record<string, PrimaryRamp>;

/**
 * Build a NoriTheme by swapping the primary ramp into the default.
 *
 * The unknown-cast is unavoidable: the generated `Theme` type narrows
 * each color hex to its specific string literal (e.g. `'#0d9488'` for
 * `primary.600`), so a generic `PrimaryRamp` ramp can't be assigned
 * structurally. The runtime shape is identical — we just convince TS.
 */
function buildPreset(ramp: PrimaryRamp): NoriTheme {
    const dark = defaultDark as unknown as Theme;
    return {
        light: {
            ...defaultLight,
            color: { ...defaultLight.color, primary: ramp },
            semantic: {
                ...defaultLight.semantic,
                interactive: {
                    ...defaultLight.semantic.interactive,
                    primary: ramp['600'],
                    primaryHover: ramp['700'],
                    primaryPressed: ramp['800'],
                },
            },
        } as unknown as Theme,
        dark: {
            ...dark,
            color: { ...dark.color, primary: ramp },
            semantic: {
                ...dark.semantic,
                interactive: {
                    ...dark.semantic.interactive,
                    // Brighter step on dark so the brand reads against the
                    // deep-zinc background — matches the default teal recipe
                    // (teal-400 on dark vs teal-600 on light).
                    primary: ramp['400'],
                    primaryHover: ramp['300'],
                    primaryPressed: ramp['200'],
                },
            },
        } as unknown as Theme,
    };
}

/** The default Nori palette — teal primary. */
export const tealTheme: NoriTheme = buildPreset(RAMPS.teal);
/** Tailwind blue primary. Calm, technical. */
export const blueTheme: NoriTheme = buildPreset(RAMPS.blue);
/** Tailwind rose primary. Warm, energetic. */
export const roseTheme: NoriTheme = buildPreset(RAMPS.rose);
/** Tailwind violet primary. Modern, software. */
export const violetTheme: NoriTheme = buildPreset(RAMPS.violet);
/** Tailwind orange primary. Lively, social. */
export const orangeTheme: NoriTheme = buildPreset(RAMPS.orange);
/** Tailwind slate primary. Neutral, low-saturation — for tools that should fade into the work. */
export const slateTheme: NoriTheme = buildPreset(RAMPS.slate);

/** All bundled presets, keyed by name. Useful for theme pickers and tests. */
export const presetThemes = {
    teal: tealTheme,
    blue: blueTheme,
    rose: roseTheme,
    violet: violetTheme,
    orange: orangeTheme,
    slate: slateTheme,
} as const;

export type PresetThemeName = keyof typeof presetThemes;
