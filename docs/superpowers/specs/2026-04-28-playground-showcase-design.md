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
- Storybook web parity — the registry refactor preserves the existing `stories` flat export, but the web Storybook target is unchanged.

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

### Story registry refactor

Currently `packages/core/src/stories/story-registry.tsx` exports a flat `stories: StoryEntry[]` keyed by ids like `switch.default`, `button.primary`. Refactor into a component-rooted tree, deriving the flat list for backwards compatibility:

```ts
export type Story = {
    id: string;            // 'primary' (kebab-case, scoped to component)
    title: string;         // 'Primary'
    render: ComponentType<Record<string, never>>;
};

export type ComponentEntry = {
    slug: string;          // 'button' (kebab-case; matches docs slug)
    name: string;          // 'Button' (display name)
    stories: Story[];      // ordered, first is the canonical preview
};

export const components: ComponentEntry[] = [
    {
        slug: 'button',
        name: 'Button',
        stories: [
            { id: 'primary',     title: 'Primary',     render: () => <Button>Click me</Button> },
            { id: 'destructive', title: 'Destructive', render: () => <Button variant="destructive">Delete</Button> },
            { id: 'loading',     title: 'Loading',     render: () => <Button loading>Saving</Button> },
        ],
    },
    // ...
];

// Backwards-compatible flat export, derived (existing call sites unchanged):
export const stories: StoryEntry[] = components.flatMap((c) =>
    c.stories.map((s) => ({
        id: `${c.slug}.${s.id}`,
        title: `${c.name} · ${s.title}`,
        render: s.render,
    })),
);
```

The flat `stories` export keeps any internal consumer (Storybook bridge, e2e harness) working without change. The new `components` export is the canonical structure for the playground.

Slug rule: kebab-case, matches the docs MDX filename (after Spec B's flattening). Component name: PascalCase display name. Both are typed strings; a small assertion test in `packages/core/src/stories/__tests__/story-registry.test.ts` enforces:

- Slug is unique across the registry.
- Slug is kebab-case (`/^[a-z][a-z0-9-]*$/`).
- Story ids are unique within a component and kebab-case.
- Component list is alphabetised by slug (catches drift in PR review).

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
| `packages/core/src/stories/story-registry.tsx` | Refactor | New `components` export, derive flat `stories` |
| `packages/core/src/stories/__tests__/story-registry.test.ts` | Create | Slug uniqueness + format + story uniqueness assertions |
| `packages/core/src/index.ts` | Verify | Re-export of `stories` and (new) `components` from the stories barrel |

## Testing

- **Unit:** `story-registry.test.ts` enforces slug/story invariants. Runs in the existing Jest harness.
- **Type check:** `pnpm --filter playground-native typecheck` passes.
- **Smoke:** Metro bundles the app with no errors. App launches on the iOS simulator. Home screen lists all components alphabetically. Search filters live. Tapping a row navigates to the detail screen with the correct title in the header. Back gesture returns to home with search state preserved (via expo-router's stack persistence).
- **Deep link:** `xcrun simctl openurl booted "nori-ui://components/button"` opens the app at the Button detail screen. `xcrun simctl openurl booted "nori-ui://components/button?story=loading"` opens Button detail with the loading variant scrolled into view.
- **Cold start vs warm start:** Both link variants work whether the app was cold-started by the URL or already running.

No e2e regression suite for the playground yet — Spec A doesn't add one (out of scope; e2e is its own future spec).

## Risks and mitigations

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
