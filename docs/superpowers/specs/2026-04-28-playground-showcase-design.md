# Spec A — Playground Showcase Rebuild

**Date:** 2026-04-28
**Scope:** `apps/playground-native/`, `packages/core/src/stories/`
**Status:** Draft — pending user review
**Companion spec:** [Spec B — Docs URL flattening + Universal Links](2026-04-28-docs-url-flattening-design.md)

## Goal

Rebuild `apps/playground-native` from a single dump-everything ScrollView into a two-screen showcase that mirrors the react-native-reusables showcase pattern, with deep linking via the `nori-ui://` URL scheme so individual components can be opened from QR codes (and, later, from web Universal Links).

The playground app exists primarily to (a) let humans explore the library on a real device, and (b) act as the canonical native target for screenshots, demos, and QR-code-driven sharing. The current "all stories on one page" layout doesn't scale and has no shareable URLs per component.

## Non-goals

- Universal Link support on iOS via AASA — covered in Spec B.
- Docs URL flattening (`/docs/components/<slug>`) — covered in Spec B.
- Android deep-link intent filters — initial scheme works on Android out of the box via expo-router; explicit App Links are deferred.
- Replacing the playground UI with on-device `@storybook/react-native`. The playground keeps its bespoke branded UI; CSF is adopted as the *story format*, not the *renderer*. A future migration to `@storybook/react-native` would only swap the consumer, since stories are already CSF-compliant.
- Web Storybook config or appearance — `*.stories.tsx` files keep their current shape; web Storybook continues to consume them unchanged.

## Architecture

### Expo Router 6, file-based routing

Replace `App.tsx` + `index.ts` with an `app/` directory and `expo-router/entry` as the entry point. expo-router 6 ships with Expo SDK 55 and handles deep-linking automatically from the file structure — no manual `Linking.createURL` plumbing.

```
apps/playground-native/
  app/
    _layout.tsx              # Stack root, NoriProvider, theme detection
    index.tsx                # Showcase home: title + search + component list
    component/
      [slug].tsx             # Component detail: stacked stories
  index.ts                   # → import 'expo-router/entry'
  app.json                   # scheme: 'nori-ui', router plugin config
```

### Bundle identifiers

Update `apps/playground-native/app.json` from the placeholder `dev.noriui.playground` to brand-aligned per-platform IDs:

- `ios.bundleIdentifier`: `com.nori-ui.playground` (Apple bundle IDs allow hyphens)
- `android.package`: `com.noriui.playground` (Android `applicationId` disallows hyphens — Java-package rules)

The asymmetry is invisible to users (each platform shows only its own ID) and is the only bundle-naming change made by this spec. The iOS ID matches the App ID baked into Spec B's AASA file (`KBWBVNAUNV.com.nori-ui.playground`).

### Deep linking

`app.json` declares `"scheme": "nori-ui"`. expo-router auto-derives URL ↔ route mapping:

| URL | Route file |
|---|---|
| `nori-ui://` | `app/index.tsx` |
| `nori-ui://component/button` | `app/component/[slug].tsx` (`slug=button`) |
| `nori-ui://component/button?story=loading` | same, with `?story=` query param |

Note the path is `component/<slug>` (singular) inside the app to match the file-based route. The web/Universal-Link path will be `components/<slug>` (plural). This is a deliberate, low-cost asymmetry: the app's path is an internal implementation detail; the web URL is the public canonical form. Spec B is responsible for translating between the two when bridging from a Universal Link to an in-app route.

Optionally, expo-router supports a `linking` config that aliases `components/<slug>` → `component/<slug>` to remove the asymmetry. Default to using the linking config so both URL forms work in-app; this future-proofs Universal Link routing without complicating the file tree.

### Stories: CSF as the canonical source

The library already maintains `*.stories.tsx` files in CSF (Component Story Format) under `packages/core/src/components/<Name>/<Name>.stories.tsx` — these power the existing web Storybook. The current playground also keeps a parallel `packages/core/src/stories/story-registry.tsx` listing the same components separately, which means every new variant has to be added in two places. **Spec A deletes the parallel registry and derives the playground's component list from CSF at runtime, making `*.stories.tsx` the single source of truth for both web Storybook and the native showcase.**

This keeps the door open to migrate the playground to `@storybook/react-native` later without changing how stories are written: CSF is exactly what Storybook RN consumes, so the consumer can be swapped without touching any story.

#### CSF loader

New file: `packages/core/src/stories/csf-loader.tsx`. Uses Metro's `require.context()` to glob every `*.stories.tsx` file in the components tree, reads each CSF module, and produces the `components: ComponentEntry[]` array the playground renders.

```ts
import type { ComponentType } from 'react';
import { createElement } from 'react';

export type Story = {
    id: string;            // 'checked' (story export key, kebab-cased)
    title: string;         // 'Checked' (story export key, humanised)
    render: ComponentType<Record<string, never>>;
};

export type ComponentEntry = {
    slug: string;          // 'switch' (kebab-case; matches docs slug)
    name: string;          // 'Switch' (last segment of CSF title)
    stories: Story[];      // ordered by named-export declaration order
};

// require.context is provided by Metro; the third arg is the regexp for matched files.
const ctx = (require as any).context('../components', true, /\.stories\.tsx$/);

export const components: ComponentEntry[] = ctx
    .keys()
    .map((path: string) => {
        const mod = ctx(path);
        const meta = mod.default;                          // CSF default export
        const Component = meta.component as ComponentType<any>;
        const titleLast = String(meta.title).split('/').pop()!; // 'Controls/Switch' → 'Switch'
        const slug = pascalToKebab(titleLast);             // 'Switch' → 'switch'

        const stories: Story[] = Object.keys(mod)
            .filter((k) => k !== 'default')
            .map((key) => {
                const story = mod[key];
                const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
                const renderFn = story.render ?? meta.render;
                const Render: ComponentType<Record<string, never>> = renderFn
                    ? () => renderFn(args)
                    : () => createElement(Component, args);
                return { id: pascalToKebab(key), title: humanise(key), render: Render };
            });

        return { slug, name: titleLast, stories };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
```

`pascalToKebab` and `humanise` are tiny helpers (`'PrimaryLoading'` → `'primary-loading'`, `'PrimaryLoading'` → `'Primary Loading'`).

The loader is **runtime-only** — no codegen step, no build script, no plugin. Metro evaluates `require.context` synchronously at bundle time, so the `components` array is populated before the first render.

#### Node-friendly slug discovery for the docs parity test

Spec B's parity test runs under Jest in the docs app (Node, not Metro), so it can't `import` the Metro-coupled `csf-loader.tsx`. To keep one source of truth without forcing Jest to run Metro, this spec also exports a tiny Node helper at `packages/core/src/stories/csf-slugs.ts`:

```ts
// Node-only: enumerates *.stories.tsx files via fs and extracts CSF titles.
// Used by tooling that runs outside Metro (Jest in apps/docs).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readCsfSlugsFromDisk(componentsDir: string): string[] { /* … */ }
```

The helper reads each `*.stories.tsx` text and matches `title:\s*['"]([^'"]+)['"]` to recover the CSF title — a simple, dependency-free way for Node-side tools to know the component slug list. Both the Metro loader and the Node helper share the same `pascalToKebab` utility, so slugs are identical regardless of which path produces them.

#### CSF contract used

The loader honors the documented CSF surface that already appears in the existing stories:

- `default.title` (string) — used for slug + display name (last `/`-segment).
- `default.component` (component) — what to render when a story has no `render`.
- `default.args` (object, optional) — merged under each story's args.
- Named exports — each is a `Story` with optional `args` and optional `render`.

Any CSF feature not explicitly handled (`parameters`, `decorators`, `loaders`, `play` functions) is ignored — the playground is a renderer, not a full Storybook host. The library's existing stories don't use these features today; if a future story needs e.g. a decorator (provider wrapper), we add support to the loader as needed.

#### One-time migration of existing variants

The current `story-registry.tsx` contains some variants (e.g. `text.body-md`, `text.heading-1`, `hstack.gap-4`, `vstack.gap-4`, `spinner.lg`, `text-input.error`) that may not exist as named exports in the corresponding `*.stories.tsx`. As part of this spec's implementation, **every variant currently in `story-registry.tsx` is moved to the corresponding component's CSF file** as a named export, then `story-registry.tsx` is deleted. After migration, no variant is lost — the CSF files are the union of what existed before.

For components without a `*.stories.tsx` yet (`Box`, `HStack`, `VStack`, `Text`, `Spinner` may or may not have one — verified in implementation), a minimal CSF file is created with the same variants the registry had.

#### Slug invariants

A small assertion test in `packages/core/src/stories/__tests__/csf-loader.test.ts` enforces:

- Slug is unique across loaded components.
- Slug is kebab-case (`/^[a-z][a-z0-9-]*$/`).
- Story ids are unique within a component and kebab-case.
- Every component has at least one story.

Slugs match docs MDX filenames (after Spec B's flattening). The Spec B parity test reads from `csf-loader`'s `components` export — the import path `@nori-ui/core/stories` resolves to a barrel that re-exports `components` from `csf-loader.tsx`.

## Screen 1 — Showcase home (`app/index.tsx`)

Layout (matches reference screenshot):

```
SafeAreaView (top inset only)
└─ View (flex: 1, padding-x: 24)
   ├─ Text variant="heading-1"  → "Showcase"
   ├─ TextInput placeholder="Components"   ← from @nori-ui/core
   └─ FlatList (componentsFiltered)
        renderItem: ComponentRow
        ItemSeparator: hairline rule
        contentContainerStyle: paddingBottom 32
```

`ComponentRow` is a `Pressable` with the component name on the left, chevron-right icon on the right, comfortable padding (16 vertical, 12 horizontal), `testID={`row-${slug}`}`. Tap → `router.push(`/component/${slug}`)`.

**Search.** Local `useState` for query string. Filter is case-insensitive substring on `name`. Empty query shows all components (alphabetical by slug). No results: muted "No components match …" line in place of the list.

**Component coverage.** All entries from `components`, including layout primitives (`Box`, `HStack`, `VStack`, `Text`, `Separator`). The user can scan past those if uninteresting — including them keeps the showcase a full census of the library and matches react-native-reusables' philosophy.

**Reusing nori-ui itself.** Headline = `Text variant="heading-1"`, search = `TextInput`, row text = `Text`, separator = `Separator`. The showcase is a real app built on the library — eat-your-own-dogfood and a useful smoke test.

## Screen 2 — Component detail (`app/component/[slug].tsx`)

Layout:

```
Stack.Screen (header: { title: <component name>, headerBackTitle: 'Showcase' })
ScrollView
└─ For each story in component.stories:
   ├─ Text variant="heading-3"  → story.title
   ├─ View (preview surface, padded, subtle background tint)
   │  └─ <story.render />
   └─ Separator (between stories, not after last)
```

`Stack.Screen` (from `expo-router`) provides the native iOS navigation header with a free swipe-back gesture and back button — covered by `@react-navigation/native-stack`, which expo-router uses internally.

**Unknown slug.** If `params.slug` doesn't resolve to a `ComponentEntry`, render a small "Component not found" view with a `Link` back to `/`. No 404 screen — the showcase has a finite component set, so a stray QR code mistyping is the only realistic path here.

**Scroll-to-story query param.** When `?story=<id>` is present, scroll the matching variant into view on mount. Implementation:

- `useLocalSearchParams<{ story?: string }>()` reads the param.
- Each variant block uses `onLayout` to record its `y` offset into a ref-keyed map.
- On mount + when `story` changes, look up the offset and call `scrollViewRef.current?.scrollTo({ y, animated: true })`.
- Unknown `story` id → no-op (scroll stays at top).

This gives QR codes per-variant precision without needing per-variant routes.

## Layout, theme, and tokens

**Theme.** `_layout.tsx` reads `useColorScheme()` and passes it to `NoriProvider`. The library's tokens already cover light + dark, so the showcase's colors come from the same source — no playground-specific theming code.

**SafeAreaView.** Use `react-native-safe-area-context`'s `SafeAreaView` (already a dep). Top inset on home and detail; bottom inset is `'off'` so the FlatList scroll extends behind any home indicator.

**StatusBar.** `expo-status-bar` `StatusBar` rendered once in `_layout.tsx` with `style="auto"` so it follows system theme.

## Routing config

`app.json` additions:

```json
{
  "expo": {
    "scheme": "nori-ui",
    "plugins": [
      "expo-router"
    ]
  }
}
```

Optional `expo-router` linking config (in `_layout.tsx` or via the plugin) aliases the public path:

```ts
const linking = {
    prefixes: ['nori-ui://', 'https://nori-ui.com'],
    config: {
        screens: {
            index: '',
            'component/[slug]': 'components/:slug',
        },
    },
};
```

This makes both `nori-ui://components/button` (matches the eventual web URL) and `nori-ui://component/button` (matches the file path) route to the same screen — friction-free for QR codes and Universal Links alike.

## File-by-file changes

| Path | Action | Notes |
|---|---|---|
| `apps/playground-native/index.ts` | Replace contents with `import 'expo-router/entry';` | Entry-point swap |
| `apps/playground-native/App.tsx` | **Delete** | Replaced by `app/_layout.tsx` |
| `apps/playground-native/app/_layout.tsx` | Create | Stack root, NoriProvider, theme, linking config |
| `apps/playground-native/app/index.tsx` | Create | Home screen |
| `apps/playground-native/app/component/[slug].tsx` | Create | Detail screen |
| `apps/playground-native/app.json` | Update | `scheme: 'nori-ui'`, expo-router plugin, iOS bundle ID `com.nori-ui.playground`, Android package `com.noriui.playground` |
| `apps/playground-native/package.json` | Update | Add `expo-router`, `expo-linking`, `expo-constants` if missing |
| `apps/playground-native/babel.config.js` | Update | Add `expo-router/babel` if not picked up by `babel-preset-expo` |
| `apps/playground-native/metro.config.js` | Verify | `expo-router` works with default Metro config; confirm no overrides break it |
| `packages/core/src/stories/story-registry.tsx` | **Delete** | Replaced by CSF loader |
| `packages/core/src/stories/csf-loader.tsx` | Create | Runtime CSF discovery via `require.context`, exports `components` |
| `packages/core/src/stories/csf-slugs.ts` | Create | Node-only helper for tools running outside Metro (e.g. docs Jest); reads slugs from `*.stories.tsx` via `fs` |
| `packages/core/src/stories/index.ts` | Update | Barrel re-exports `components` from `csf-loader` (replaces flat `stories` export) |
| `packages/core/src/components/<Name>/<Name>.stories.tsx` | Update (per component) | Add any variant currently only in `story-registry.tsx` as a named CSF export |
| `packages/core/src/components/<Name>/<Name>.stories.tsx` | Create (where missing) | Minimal CSF file for components that don't have one yet (Box, HStack, VStack, Text, Spinner — verify per file) |
| `packages/core/src/stories/__tests__/csf-loader.test.ts` | Create | Slug uniqueness + format + story uniqueness assertions |
| `packages/core/src/index.ts` | Verify | Re-export of `components` from the stories barrel |

## Testing

- **Unit:** `story-registry.test.ts` enforces slug/story invariants. Runs in the existing Jest harness.
- **Type check:** `pnpm --filter playground-native typecheck` passes.
- **Smoke:** Metro bundles the app with no errors. App launches on the iOS simulator. Home screen lists all components alphabetically. Search filters live. Tapping a row navigates to the detail screen with the correct title in the header. Back gesture returns to home with search state preserved (via expo-router's stack persistence).
- **Deep link:** `xcrun simctl openurl booted "nori-ui://components/button"` opens the app at the Button detail screen. `xcrun simctl openurl booted "nori-ui://components/button?story=loading"` opens Button detail with the loading variant scrolled into view.
- **Cold start vs warm start:** Both link variants work whether the app was cold-started by the URL or already running.

No e2e regression suite for the playground yet — Spec A doesn't add one (out of scope; e2e is its own future spec).

## Risks and mitigations

- **`require.context` availability.** Metro supports `require.context` since 0.72 with `transformer.unstable_allowRequireContext: true`. The current `metro.config.js` may need this flag set explicitly. Mitigation: add the flag during implementation; verify the loader populates `components` non-empty in a smoke test before wiring it into the screens.
- **CSF tree-shaking on web.** The `*.stories.tsx` files currently sit inside the published `@nori-ui/core` package. We don't want them shipped in production bundles. Mitigation: confirm `tsup.config.ts` excludes `**/*.stories.tsx` from the published build (likely already the case — verify). Stories are only consumed by the playground (which compiles directly from source via the workspace symlink) and by Storybook's own bundler.
- **expo-router static-analysis edge cases.** expo-router relies on Metro's static file discovery for routes. If Metro config has overrides that break this, routes silently 404. Mitigation: keep `metro.config.js` minimal; if the existing config has nativewind transforms, verify expo-router still discovers the `app/` dir by running the app cold.
- **NoriProvider already-mounted assumption.** Some components may assume a NoriProvider exists at the root. `_layout.tsx` mounts it once around the `Stack`, so all routes inherit it. Verified by the existing usage in `App.tsx`.
- **Reanimated worklets across navigation.** The Switch component uses Reanimated worklets (cf. recent fixes). When unmounted via stack pop, worklets must clean up. Mitigation: existing Switch already handles this; we only need to ensure detail-screen unmount doesn't leak. Smoke test: navigate Switch detail ↔ home rapidly, watch for warnings.
- **Search input keyboard dismissal.** With `FlatList` + `TextInput` on iOS, scrolling can leave the keyboard up. Set `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"` on the FlatList.
- **Deep link to unknown slug.** `nori-ui://components/foo` should not crash. Detail screen handles unknown slug gracefully.

## Open questions

None blocking. The optional linking config (aliasing `components/<slug>` → `component/<slug>`) is recommended but not required; if it adds friction, drop it and accept the path asymmetry.

## Out-of-scope for this spec

- Light/dark theme toggle button in the header — system theme only for now.
- Per-component "Open in app" web pages — Spec B.
- Visual polish beyond matching the reference screenshot — small touches OK during implementation, larger redesigns are a future spec.
- Search ranking / fuzzy match — substring is enough for ~30 components.
