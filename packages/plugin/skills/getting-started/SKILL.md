---
name: nori-ui Getting Started
description: This skill should be used when the user asks to "set up nori-ui", "install @nori-ui/core", "add nori-ui to my Next.js app", "add nori-ui to my Expo app", "use NoriProvider", "wrap my app in NoriProvider", "add a theme to nori-ui", "set the locale for nori-ui", or asks "how do I start with nori-ui". Covers the install, RSC-safe vs client entry points, peer dependencies, and the optional NoriProvider for theming, i18n, locale, and semantic icons.
version: 0.0.1
---

# nori-ui — Getting Started

`@nori-ui/core` is a cross-platform component library that ships the same components for the web (React + React DOM) and native (React Native + Expo). It targets React 19, NativeWind v4, and ships ESM, CJS, and TypeScript declarations. The default entry is RSC-safe; stateful providers and hooks live behind a `./client` subpath import.

This skill covers the minimum needed to render the first component correctly. For per-component prop tables and runnable examples, prefer the `nori-ui` MCP server's `get_component_props`, `get_component_docs`, `list_examples`, and `search_components` tools — they read the live docs corpus rather than relying on what Claude remembers.

## Install

Pick the package manager the project already uses. Do not mix.

```bash
# yarn
yarn add @nori-ui/core

# npm
npm install @nori-ui/core

# pnpm
pnpm add @nori-ui/core
```

Required peer dependencies:

- `react@^19`
- `react-dom@^19` (web only — omit for pure React Native apps)
- `react-native@^0.83` (native only — omit for pure web apps)
- `nativewind@^4`
- `react-native-css-interop`

Install the peers the target platform needs. For Expo apps, ensure NativeWind v4 is set up first — `@nori-ui/core` assumes NativeWind's babel/metro plumbing is already in place. Do not silently add `nativewind` without configuring its babel preset and CSS entry; the components will render but Tailwind classes will be ignored.

## Pick the right entry point

The package has two public entry points, and choosing wrong is the most common cause of "Server Components don't support hooks" errors in Next.js and similar bugs in other RSC frameworks.

### Default entry — RSC-safe

```tsx
import { Button, Text, Card, Icon, cn } from '@nori-ui/core';
```

The default entry exports only RSC-safe primitives: visual components, the `Icon` wrapper, `cn` (className merge), `Slot` / `composeRefs`, theme tokens, and i18n type/resolver utilities. These can render inside React Server Components without adding `'use client'`.

Use this entry from any component file unless the file needs a hook or provider from nori-ui.

### Client entry — providers and hooks

```tsx
'use client';
import { NoriProvider, useTheme, useTranslation, useColorScheme } from '@nori-ui/core/client';
```

The `/client` subpath is the only place hooks and providers (`NoriProvider`, `ThemeProvider`, `I18nProvider`, `SemanticIconsProvider`, `useTheme`, `useTranslation`, `useColorScheme`, `useThemeColors`) are exported. Importing from `/client` requires the file to be a client component — add `'use client'` at the top of the file (or be inside a parent that already declared it).

The `/client` entry also re-exports everything from the default entry, so a single client file can import all components plus a provider from one path.

**Rule of thumb:** if the file already needs `'use client'` for any reason, it is fine to import from `@nori-ui/core/client`. Otherwise, import from `@nori-ui/core` and keep the file RSC-friendly.

## NoriProvider is optional

`NoriProvider` is **not required** to use the library. Components render with sensible defaults (teal preset theme, English dictionary, default semantic icons) when no provider is present. Reach for `NoriProvider` only to override one of those defaults.

```tsx
'use client';
import { NoriProvider, blueTheme } from '@nori-ui/core/client';

export function AppShell({ children }: { children: React.ReactNode }) {
    return <NoriProvider theme={blueTheme}>{children}</NoriProvider>;
}
```

`NoriProvider` props (all optional):

- `theme` — one of the bundled presets (`tealTheme`, `blueTheme`, `roseTheme`, `violetTheme`, `orangeTheme`, `slateTheme`), a custom `NoriTheme` (`{ light, dark }`), or a single `Theme` (rarely useful).
- `colorScheme` — force `'light'` or `'dark'`, overriding the OS signal. Omit to track the OS Appearance (native) or the `<html>` `dark` class (web).
- `i18n` — a `Dictionary` object **or** an i18next-compatible translate function. Used by components that render text (errors, aria-labels, weekday names).
- `icons` — partial override of the default semantic icon set, for swapping in a different icon family.
- `locale` — a BCP 47 locale tag (e.g. `'en-US'`, `'de-DE'`) or an `Intl.Locale`. Drives locale-aware components (Calendar, number/currency formatting, relative time). Defaults to the runtime's resolved locale (`new Intl.DateTimeFormat().resolvedOptions().locale`), which mirrors what other `Intl` calls in the consumer's code already use — so most apps never need to set this explicitly.

Mount `NoriProvider` once near the root of the app — typically the root layout in Next.js or the root component in Expo. Nesting another `NoriProvider` inside is supported but uncommon; prefer composing individual providers (`ThemeProvider`, `I18nProvider`) when only one layer needs to change.

## Web — Next.js App Router

Add the provider to the root layout's client boundary. Keep the layout itself a Server Component; introduce a thin client wrapper:

```tsx
// app/providers.tsx
'use client';
import { NoriProvider, blueTheme } from '@nori-ui/core/client';

export function Providers({ children }: { children: React.ReactNode }) {
    return <NoriProvider theme={blueTheme}>{children}</NoriProvider>;
}
```

```tsx
// app/layout.tsx (Server Component — no 'use client')
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
```

Pages and components that only need RSC-safe primitives can import directly from `@nori-ui/core` and stay server-rendered.

## Native — Expo

Mount `NoriProvider` in the root component. Expo apps run on the React reconciler that already treats every component as a client component, so the `'use client'` directive is unnecessary on native — but importing from `@nori-ui/core/client` is still correct and harmless.

```tsx
// app/_layout.tsx (Expo Router)
import { NoriProvider, tealTheme } from '@nori-ui/core/client';
import { Slot } from 'expo-router';

export default function RootLayout() {
    return (
        <NoriProvider theme={tealTheme}>
            <Slot />
        </NoriProvider>
    );
}
```

NativeWind v4 must be configured first (`babel.config.js`, `metro.config.js`, and a CSS entry imported from the root). The library assumes those are wired; do not invent shims if they are missing — fix the NativeWind setup at its source.

## Common pitfalls

- **Importing a hook from the default entry.** `useTheme`, `useTranslation`, etc. are not exported from `@nori-ui/core`. Switch to `@nori-ui/core/client` and ensure the file is a client component.
- **Missing peer deps.** Install only the peers for the target platform; do not add `react-native` to a pure web project.
- **NativeWind not configured.** Components render but utility classes do not apply. Configure NativeWind v4 before debugging individual components.
- **Wrapping every component in NoriProvider.** One provider near the app root is enough. Re-wrapping at every screen wastes context churn.
- **Forcing `colorScheme` for theming.** `colorScheme` only forces light or dark; it does not pick a palette. Use `theme` for palette selection and let `colorScheme` track the OS by default.

## Beyond the basics

For component-specific guidance — props, examples, accessibility notes, cross-platform differences — query the bundled MCP server:

- `search_components` — find a component by description.
- `get_component_docs` — pull the full doc page for a named component.
- `get_component_props` — get the canonical prop table.
- `list_examples` — list runnable examples for a component.

Always prefer MCP results over recalling component APIs from memory; they reflect the version installed in the user's project.
