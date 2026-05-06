---
name: nori-ui Theming
description: This skill should be used when the user asks to "theme nori-ui", "change the nori-ui primary color", "use a custom theme", "switch nori-ui to dark mode", "add a brand color to nori-ui", "use tealTheme/blueTheme/roseTheme/violetTheme/orangeTheme/slateTheme", "build a custom NoriTheme", "force light/dark mode in nori-ui", "set up the nori-ui Tailwind preset", or asks "how do I customize nori-ui colors". Covers the three-layer theming model (tokens → presets → NoriTheme), dark mode mechanics on web vs native, the Tailwind preset wiring, and reading the active theme inside custom components.
version: 0.0.1
---

# nori-ui — Theming

`@nori-ui/core` ships a token-driven theming system with three layers consumers can reach into, in order of cost:

1. **Bundled preset** — swap one of six brand-color presets via `<NoriProvider theme={...}>`. One line of code, no token plumbing.
2. **Custom `NoriTheme`** — build a `{ light, dark }` pair by spreading `defaultTheme` and overriding individual color paths.
3. **Custom token build** — fork the Figma → Style Dictionary pipeline that generates `@nori-ui/tokens` and emit a different ramp set entirely. Out of scope for most apps.

Most projects only need layer 1. Reach for layer 2 only when a brand color isn't covered by the presets or the design system needs a non-primary axis (warning, success, destructive) re-skinned.

For component-specific theming questions ("can I theme just the Button?"), prefer the `nori-ui` MCP server's `get_component_props` and `get_component_docs` — many components expose `tone` / `variant` props that select pre-themed surfaces without needing a custom theme.

## Three layers, one mental model

A `NoriTheme` is a paired light/dark palette:

```ts
type NoriTheme = {
    light: Theme;
    dark: Theme;
};
```

The active half is selected automatically by `useColorScheme()` based on the OS Appearance signal (native) or the `<html>.dark` class (web). Components do not call `useColorScheme` directly — they call `useThemeColors()` (aliased as `useTheme()`) which returns the resolved active half. Application code can call either.

`Theme` itself is a deeply-typed object with token paths like `color.primary['500']`, `color.interactive.primary`, `color.background.surface`, etc. The full type is generated from Figma tokens and exported from `@nori-ui/tokens`. Tab-complete it in the IDE rather than memorizing paths.

## Layer 1 — Bundled presets

Six presets ship from `@nori-ui/core` (and `@nori-ui/core/client`):

- `tealTheme` (default)
- `blueTheme`
- `roseTheme`
- `violetTheme`
- `orangeTheme`
- `slateTheme`

Each preset overrides the **primary** color ramp and the derived `interactive.primary` / `primaryHover` / `primaryPressed` semantic tones. Backgrounds, borders, neutrals, and the destructive/warning/success scales stay identical to the default — presets are about brand identity, not full re-skins.

```tsx
'use client';
import { NoriProvider, blueTheme } from '@nori-ui/core/client';

export function Providers({ children }: { children: React.ReactNode }) {
    return <NoriProvider theme={blueTheme}>{children}</NoriProvider>;
}
```

A `presetThemes` map and `PresetThemeName` union are also exported for cases where the theme is selected dynamically (e.g. from a setting):

```tsx
import { NoriProvider, presetThemes, type PresetThemeName } from '@nori-ui/core/client';

export function ThemedShell({ name, children }: { name: PresetThemeName; children: React.ReactNode }) {
    return <NoriProvider theme={presetThemes[name]}>{children}</NoriProvider>;
}
```

Omitting the `theme` prop falls back to `tealTheme`, so a project that's happy with the default never needs to touch this layer.

## Layer 2 — Custom NoriTheme

When the brand needs a primary color outside the six presets — or when a different semantic axis (e.g. destructive) needs re-skinning — build a `NoriTheme` manually by spreading `defaultTheme` and overriding the paths that change.

```tsx
'use client';
import { defaultTheme, type NoriTheme, NoriProvider } from '@nori-ui/core/client';

const myTheme: NoriTheme = {
    light: {
        ...defaultTheme.light,
        color: {
            ...defaultTheme.light.color,
            primary: {
                '50': '#fdf4ff',
                '100': '#fae8ff',
                '200': '#f5d0fe',
                '300': '#f0abfc',
                '400': '#e879f9',
                '500': '#d946ef',
                '600': '#c026d3',
                '700': '#a21caf',
                '800': '#86198f',
                '900': '#701a75',
            },
            interactive: {
                ...defaultTheme.light.color.interactive,
                primary: '#c026d3', // matches primary.600
                primaryHover: '#a21caf', // matches primary.700
                primaryPressed: '#86198f', // matches primary.800
            },
        },
    },
    dark: {
        ...defaultTheme.dark,
        color: {
            ...defaultTheme.dark.color,
            primary: {
                /* same shape, dark-mode-friendly values */
            },
            interactive: {
                ...defaultTheme.dark.color.interactive,
                primary: '#e879f9', // primary.400 reads better against dark surfaces
                primaryHover: '#d946ef',
                primaryPressed: '#c026d3',
            },
        },
    },
};

<NoriProvider theme={myTheme}>{children}</NoriProvider>;
```

**Always keep both `light` and `dark` halves in sync** — the same ramp shape, but pick a _brighter_ shade (typically `primary.400`) for dark-mode resting state because the saturated `primary.600` reads too dark against the `#18181b` dark surface. The presets follow this convention; copy it when building custom themes.

A single `Theme` (not paired) can also be passed and is used for both schemes, but this is rare and almost always a bug — prefer building a real pair.

## Dark mode mechanics

`useColorScheme` returns `'light' | 'dark'`. The library tracks the OS signal differently per platform:

- **Web** — reads the `dark` class **or** `data-theme="dark"` attribute on `<html>`. The library deliberately does **not** read `prefers-color-scheme` because the app usually owns that decision (e.g. via `next-themes`, manual toggle, persisted preference) and writes the result onto `<html>`. Reading the OS preference too would fight the app's value.
- **Native** — subscribes to React Native's `Appearance.addChangeListener` and re-renders on OS scheme changes.

Apps using `next-themes` or any equivalent that toggles `<html class="dark">` get nori-ui dark mode for free. Manual toggle:

```tsx
'use client';
function toggleDark() {
    document.documentElement.classList.toggle('dark');
}
```

### Forcing a scheme

Use `colorScheme` on `NoriProvider` to override the OS signal for descendants — useful for forced-dark editorial chrome or a settings preview that shouldn't track the host:

```tsx
<NoriProvider theme={blueTheme} colorScheme="dark">
    {/* Always renders against the dark half, regardless of OS / <html>.dark */}
</NoriProvider>
```

`colorScheme` is _only_ about which half of the theme is active. It does not pick the palette — `theme` does that. Setting `colorScheme="dark"` does not toggle Tailwind's `dark:` classes either; that's still controlled by `<html>.dark` for web consumers.

## Tailwind preset

For utility classes to match the token values (so `bg-primary-600` actually equals the active theme's `color.primary.600`), wire the bundled Tailwind preset into the host project:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import noriPreset from '@nori-ui/tokens/tailwind-preset';

export default {
    presets: [noriPreset],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './node_modules/@nori-ui/core/dist/**/*.{js,mjs,cjs}',
    ],
} satisfies Config;
```

The `content` glob must include `node_modules/@nori-ui/core/dist/**` so Tailwind's JIT compiler finds the utility classes that nori-ui components emit; otherwise the styles ship missing.

For Expo / NativeWind v4, the same preset path works — NativeWind reads Tailwind config like the web does.

## Reading the active theme in custom components

Application components and custom primitives read the resolved theme via `useTheme()` (alias of `useThemeColors()`) and `useColorScheme()`:

```tsx
'use client';
import { useColorScheme, useTheme } from '@nori-ui/core/client';

export function HeroCard() {
    const theme = useTheme();
    const scheme = useColorScheme();

    return (
        <div
            style={{
                background: theme.color.background.surface,
                color: theme.color.text.default,
                border: `1px solid ${theme.color.border.subtle}`,
            }}
        >
            Currently in {scheme} mode.
        </div>
    );
}
```

Both hooks are client-only — they require `@nori-ui/core/client` and a `'use client'` directive. For RSC-rendered surfaces, accept the resolved tokens as props from a client parent rather than calling the hooks directly.

## Common pitfalls

- **Setting `colorScheme` to control palette.** `colorScheme` only forces light or dark. Use `theme` to swap palettes.
- **Skipping the dark half of a custom theme.** Both halves must be defined. Reusing the light half for dark causes contrast failures.
- **Forgetting the Tailwind `content` glob for `node_modules/@nori-ui/core`.** Components render but utility classes ship missing. Symptoms: unstyled buttons in production builds.
- **Reading `prefers-color-scheme` to drive `<html>.dark`.** Pick a single source of truth (e.g. `next-themes`) and let it write the class. Don't have multiple systems racing.
- **Re-spreading `defaultTheme` partially.** Always `...defaultTheme.light.color` (and same for `dark`) before overriding nested keys. Skipping the spread silently drops every other token branch.
- **Wrapping nested `NoriProvider`s for theming.** A nested provider replaces the theme for its subtree; this is supported but rarely intended. Prefer composing `ThemeProvider` directly when only the theme should change.

## Beyond the basics

For component-specific theming options (variant, tone, disabled-state behavior), query the MCP server:

- `get_component_props` — see if the component already exposes a tone/variant prop.
- `get_component_docs` — read the doc page including theming notes.
- `list_examples` — runnable examples often show theming usage.

When stuck, prefer asking what `Theme` paths exist via tab-completion (the type is fully literal) over guessing.
