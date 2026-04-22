# unbogify-ui — Product Requirements Document

**Status:** Draft for review
**Date:** 2026-04-22
**Owner:** Manuel Bieh
**Working name:** `unbogify-ui` (placeholder; rename before v0.1 publish)

---

## 1. Executive Summary

### Problem Statement
Teams building cross-platform apps with React Native + Expo Web lack a modern, cohesive UI component library that ships with strong theming, Figma-driven design tokens, first-class TypeScript DX, AI-queryable documentation, and the ergonomic install experience that shadcn/ui has made standard on the web.

### Proposed Solution
`unbogify-ui` — a greenfield, Expo-first, New-Architecture-ready React Native + React Native Web component library. Styled with NativeWind v4, themed via Figma design tokens, i18next-compatible (without forcing i18next on consumers), and documented on a Fumadocs site with a first-class MCP server for AI tooling. Ships as a single published package with a single visible version.

### Success Criteria
1. **Install-to-first-component ≤ 5 minutes** on a fresh Expo project — from `yarn add unbogify-ui` to a `<Button>` rendering correctly on iOS, Android, and web.
2. **Tree-shaking verified with concrete budgets** — enforced by `size-limit` CI gates:
   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip.
   - Each additional component: ≤ 5 KB gzip marginal cost.
   - All 11 components together: ≤ 70 KB gzip.
3. **100% of v0.1 components** pass: unit tests (Jest + RNTL), web e2e (Playwright + axe a11y audit), native e2e (Maestro, iOS + Android).
4. **WCAG 2.2 Level AA** conformance verified for every component on web (axe-core) and native (RNTL a11y assertions). `prefers-reduced-motion` respected by every animated surface.
5. **TypeScript strictness:** zero `any`, zero un-justified `as` assertions, zero `@ts-ignore` without a comment. Public-API autocomplete is a tested surface (see §4 TS Quality).
6. **Docs Lighthouse scores ≥ 95** on Performance, Accessibility, Best Practices, SEO.
7. **MCP endpoint ≥ 95% success rate** on a 50-question natural-language eval of component lookup, prop discovery, and usage.
8. **Test matrix covers all supported Expo SDK tiers** (current + maintained + legacy — see §5 Version Support Policy).

---

## 2. User Experience & Functionality

### User Personas
- **Primary — Cross-platform app developers** using Expo who want production-grade primitives instead of rolling Pressable + StyleSheet per component.
- **Secondary — Design-system teams** who export tokens from Figma and want those tokens to drive both web and native UI end-to-end.
- **Tertiary — AI-assisted developers** (Claude Code, Cursor, Windsurf, etc.) whose tools can query the library for grounded, structured answers via MCP.

### User Stories

**US-1: Minimal install**
As a developer, I want to install the library and render my first component in under 5 minutes.

_Acceptance Criteria:_
- `yarn add unbogify-ui` pulls one package.
- Adding `<UnbogifyProvider>` at the app root and importing `<Button>` renders correctly on iOS, Android, and web without further config beyond the NativeWind preset line in `tailwind.config.ts`.
- A "Getting Started" docs page walks through this end-to-end.

**US-2: Theming with Figma tokens**
As a design-system lead, I want to export tokens from Figma and have them become the source of truth for both the library's theme and my app's theme.

_Acceptance Criteria:_
- Documented pipeline: Tokens Studio → JSON → `style-dictionary` → `tailwind.config.ts` theme + TypeScript `Token` types.
- Consumers override via `<UnbogifyProvider theme={customTheme}>` with full type safety (token keys autocompleted).
- All 11 v0.1 components consume tokens for color, spacing, radius, typography, shadow.

**US-3: Tree-shaken imports**
As a developer, I want to import one component without dragging the whole library into my bundle.

_Acceptance Criteria:_
- Package has `"exports"` map, `"sideEffects": false`, and an ESM-first dual build (ESM + CJS).
- `size-limit` CI check gates merges with the three budgets from §1 Success Criteria (first-import, marginal, total).
- Budgets are revisited per minor release; regressions block merges.

**US-4: i18n with default strings, i18next-compatible**
As a developer, I want to translate the library's English defaults with minimal friction, and have it feel native if I already use i18next.

_Acceptance Criteria:_
- Every user-visible string has an English default baked in.
- The library's internal lookup uses an i18next-shape `t(key, options?)` signature.
- Three consumer modes, all supported:
  1. **No setup** — English defaults render.
  2. **Static dictionary** — `<UnbogifyProvider i18n={{ 'button.cancel': 'Abbrechen', ... }}>` overrides globally.
  3. **i18next drop-in** — `<UnbogifyProvider i18n={t}>` where `t` is i18next's translation function; works directly because API shape matches (`{{var}}` interpolation, nested keys, `count` for pluralization).
- Per-instance prop overrides (e.g., `<Button loadingLabel="…" />`) take precedence over provider.
- A ready-to-copy `unbogify-en.json` resource bundle is shipped in the repo for i18next users who want to add translations incrementally.

**US-5: Icons — direct imports, no registry**
As a developer, I want to use icons the way React wants me to: import the component I need, pass it as a prop. No global registry, no provider bloat, no bundle surprises.

_Acceptance Criteria:_
- Consumers import icon components directly from their icon library of choice:
  ```tsx
  import { ChevronRight } from 'lucide-react-native';
  <Button trailingIcon={ChevronRight}>Continue</Button>
  ```
- Icon-accepting props throughout the library accept a **component reference** (`ComponentType<{ size?: number; color?: string }>`), never a string name.
- Tree-shaking is automatic and idiomatic — only imported icons are bundled.
- An optional `<Icon>` wrapper is exported for consistent sizing/color-token application when rendering a decorative icon: `<Icon as={ChevronRight} size="md" color="primary.500" />`. Use of the wrapper is optional; raw icon components work too.
- Lucide is recommended and used in all docs examples, declared as optional peer dependency. No hard dependency.
- **Semantic icon overrides** (for internal uses like Checkbox's checkmark, Switch's glyph, TextInput's clear/password-toggle): a small, fixed-size semantic registry is available via provider, with ~10 keys total (`checkmark`, `close`, `eye`, `eyeOff`, `chevronDown`, `chevronUp`, `alertTriangle`, `info`, `check`, `x`). Defaults are Lucide components.
  ```tsx
  <UnbogifyProvider icons={{ checkmark: MyCheck, close: MyX }}>
  ```
  The semantic map is typed as a closed interface — no free-form string lookup; no provider bloat.

**US-6: Polymorphic composition via `asChild`**
As a developer, I want to render a Button as a Link, or a Checkbox label as an anchor, without re-implementing styling or losing a11y wiring.

_Acceptance Criteria:_
- Every interactive component supports `asChild` (Radix/shadcn pattern):
  ```tsx
  <Button asChild variant="primary">
    <Link href="/somewhere">Go</Link>
  </Button>
  ```
- When `asChild` is true, the component passes all its props + ref + styling onto the single child instead of rendering its own wrapper element.
- Accessibility attributes (role, state, label) transfer to the child element correctly.
- A `<Slot>` primitive is exported so consumers can implement the same pattern in their own wrappers.
- Documented on every page where it applies, with at least one example per component.

**US-7: React Server Components compatibility**
As a consumer using Next.js App Router or another RSC environment, I want to import pure presentational primitives from server components without hitting `'use client'` boundary errors.

_Acceptance Criteria:_
- Library exports are split into two subpaths:
  - Default import (`'unbogify-ui'`) — primitives safe for RSC (pure render, no hooks/refs/context) are re-exported from here without `'use client'`.
  - `'unbogify-ui/client'` — everything else (provider, interactive components that use context, refs, or state) is under this subpath, with `'use client'` at the top.
- A CI check verifies that no file in the default entry tree contains React hooks or refers to `React.use*`.
- Docs site (Fumadocs + Next.js App Router) renders web variants of components from server components where possible — eats our own dog food.

**US-8: Accessibility as a first-class, continuous commitment**
As a developer, I want the components to be accessible by default so my app meets WCAG without heroic effort on my part.

_Acceptance Criteria:_
- WCAG 2.2 Level AA is the floor for every component.
- `prefers-reduced-motion` is respected by every component with motion (press states, Switch toggle, Spinner rotation, any future transitions).
- `prefers-color-scheme` drives the default theme's light/dark mode selection.
- Color contrast for default tokens meets WCAG AA (4.5:1 for body text, 3:1 for large text and UI components).
- Keyboard navigation and focus visibility tested per component on web; native equivalents (focus ring, accessibility-focused) tested on iOS/Android.
- Automated a11y audits (axe on web, RNTL a11y assertions on native) gate PRs.

**US-9: AI-queryable docs**
As a developer using Claude Code (or similar), I want my AI tools to answer grounded questions about the library.

_Acceptance Criteria:_
- `llms.txt` and `llms-full.txt` are served at the docs domain.
- An MCP server at `https://<docs-domain>/mcp` exposes these tools:
  - `search_components(query)` → component summaries
  - `get_component_docs(name)` → full description + usage + examples
  - `get_component_props(name)` → typed prop definitions (name, type, default, description)
  - `list_examples(component?, tag?)` → code snippets
- 50-question eval set achieves ≥ 95% success rate in CI.
- Accept-header content negotiation via Fumadocs: AI agents requesting `text/markdown` get MDX; humans get rendered HTML. Same URLs.

### Acceptance Criteria — Per-Component (applies to all 11)
Each component ships with:
- Exported TS types (strict, no `any`).
- Correct a11y wiring: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, plus an `aria-*` mapping layer on web.
- NativeWind styling via `className` prop. A `cn(...)` helper is exported for programmatic class composition (same API shape as `clsx` / `tailwind-merge`).
- Unit tests via Jest + `@testing-library/react-native` covering: render, variants, state transitions, a11y assertions, theming propagation.
- Playwright e2e on web: interactions + `@axe-core/playwright` a11y audit + visual regression screenshot.
- Maestro flow on iOS + Android: interactions + basic visual check.
- Docs page: description, prop table (auto-generated from TS via `react-docgen-typescript` or Fumadocs native integration), inline live web preview, Expo Snack embed for native preview, code tabs (imports, usage, theming).
- Storybook (web-only) story covering every variant.

### v0.1 Component List (11)
1. `Button` — variants: `primary | secondary | ghost | destructive`; sizes: `sm | md | lg`; states: default, pressed, disabled, loading; `leading`/`trailing` icon slots.
2. `TextInput` — label, placeholder, helper text, error state, prefix/suffix slots, controlled + uncontrolled.
3. `TextArea` — multi-line variant of TextInput; shares foundations.
4. `Text` — typography primitive, token-driven type scale.
5. `Box` — layout primitive (padding, margin, background, radius, border via token props).
6. `HStack` — horizontal flex layout with `gap` token prop.
7. `VStack` — vertical flex layout with `gap` token prop.
8. `Icon` — swappable registry (Lucide default), size + color tokens.
9. `Checkbox` — controlled + uncontrolled, label slot, indeterminate state.
10. `Switch` — controlled + uncontrolled, label slot, accessibility-correct on both platforms.
11. `Spinner` — size + color tokens, optional label for a11y.

### Non-Goals (v0.1)
- Modal, Dialog, Dropdown, Popover, Tooltip, Toast — require portals + focus management. Deferred to v0.2.
- Form primitives layer (`Form`, `Field`, validation). Deferred to v0.3.
- Select, Combobox, DatePicker, FileUpload. Deferred to v0.3.
- RTL support beyond what RN provides natively.
- Native visual regression testing (web visual regression via Playwright only in v0.1).
- Dark-mode runtime toggle UI (tokens structurally support it, but no toggle ships).
- Animations beyond system defaults. Reanimated integration is post-v0.1.
- Runtime locale-file autoloading.
- Separate per-component npm packages. One package, one version, always.

---

## 3. AI System Requirements (Docs MCP + Eval)

### Architecture
The Fumadocs site (Next.js App Router) hosts:
- MDX content under `content/components/*.mdx` with frontmatter: `name`, `description`, `since`, `tags[]`.
- Fumadocs `source` object as the single source of truth.
- `llms.txt` + `llms-full.txt` generated from `source.getPages()` using the standard Fumadocs pattern.
- `/mcp` Next.js route handler using `@modelcontextprotocol/sdk`. Tools read from the same `source` object — no data duplication.

### MCP Tools
```ts
// search_components
{ query: string } → Array<{ name: string; description: string; tags: string[]; since: string }>

// get_component_docs
{ name: string } → { description: string; usage: string; examples: Array<{ title: string; code: string; platform: 'web' | 'native' | 'both' }> }

// get_component_props
{ name: string } → Array<{ name: string; type: string; default?: string; description: string; required: boolean }>

// list_examples
{ component?: string; tag?: string } → Array<{ component: string; title: string; code: string; platform: 'web' | 'native' | 'both' }>
```

### Evaluation Strategy
- **Eval set:** 50 natural-language questions across four categories:
  - 15 × component lookup ("which component should I use for a toggle?")
  - 15 × prop discovery ("what props does Button accept?")
  - 10 × usage ("how do I make a loading button?")
  - 10 × examples ("show me a form with validation")
- **Grading:** for each question, a JSON gold answer lists the expected components / props / example IDs. Success = F1 ≥ 0.9 on returned items.
- **Target:** ≥ 95% aggregate success rate.
- **CI:** eval runs on every PR that touches `/apps/docs` or `/packages/ui/src/components`. Blocks merge on regression.

---

## 4. Technical Specifications

### Repository Layout (monorepo, single published package)
```
ui-kit/
├── packages/
│   └── ui/                       # the ONLY published package: "unbogify-ui"
│       ├── src/
│       │   ├── components/       # one folder per component + barrel-free index
│       │   ├── theme/            # tokens, provider, types
│       │   ├── i18n/             # provider + defaults + i18next-compat adapter
│       │   └── index.ts
│       ├── size-limit.config.cjs
│       └── package.json
├── apps/
│   ├── docs/                     # Fumadocs site + /mcp endpoint, deployed to Vercel
│   ├── playground-web/           # Vite + RN-Web; Playwright target; Storybook build target
│   └── playground-native/        # Expo app; Maestro target
├── tokens/                       # Tokens Studio JSON + style-dictionary config
├── tooling/                      # shared configs (biome, tsconfig bases, etc.)
├── .github/workflows/
│   ├── ci.yml
│   ├── release.yml               # semantic-release + npm OIDC on main
│   └── mcp-eval.yml
├── biome.json
├── eslint.config.mjs             # RN-rules-only, delete when Biome covers RN
├── .releaserc.json
├── commitlint.config.cjs
├── lefthook.yml
├── .yarnrc.yml                   # nodeLinker: node-modules
└── package.json                  # yarn workspaces, repo version tracks the published one
```

### Tech Stack (locked)
| Concern | Choice |
|---|---|
| Runtime target (current tier) | Expo SDK 55 (RN 0.83, React 19, New Architecture) |
| Runtime engines | Node 20+, iOS 15.1+, Android API 24+ (Android 7.0), browsers = last 2 modern versions |
| Support window | Rolling 3 tiers: current, maintained, legacy. See §5 Version Support Policy. |
| Language | TypeScript 5.6+, `strict: true`, no `any` in library source, no un-justified `as` / `@ts-ignore` |
| Composition pattern | `asChild` on every interactive component + exported `<Slot>` primitive (Radix/shadcn pattern) |
| RSC compatibility | Default entry = RSC-safe primitives. `unbogify-ui/client` subpath = components using state/context/refs with `'use client'` |
| Styling | NativeWind v4 (Tailwind CSS underneath) |
| Icons | Direct component imports from any icon library (Lucide recommended, optional peer dep). Small typed semantic registry (~10 keys) overridable via provider for internal glyphs. No string-name registry. |
| Motion | All components respect `prefers-reduced-motion` and `prefers-color-scheme` from v0.1. |
| i18n | Custom minimal runtime, API-shape-identical to i18next |
| Package manager | Yarn 4 (Berry), `nodeLinker: node-modules` |
| Linting — primary | Biome |
| Linting — gap filler | ESLint with `eslint-plugin-react-native` only; removed when Biome covers RN |
| Testing — unit/behavior | Jest + `@testing-library/react-native` |
| Testing — web e2e | Playwright + `@axe-core/playwright` + visual regression screenshots |
| Testing — native e2e | Maestro (iOS simulator + Android emulator), local CI first; Maestro Cloud if needed |
| Docs | Fumadocs on Next.js App Router, deployed to Vercel |
| MCP | `@modelcontextprotocol/sdk` as Next.js route handler |
| Storybook | `@storybook/react-vite` (web-only); skip RN Storybook |
| Design tokens | Tokens Studio (Figma) → JSON → `style-dictionary` → Tailwind theme + TS types |
| Commit convention | Conventional Commits (enforced via commitlint + lefthook) |
| Release | `semantic-release` with npm OIDC trusted publisher + `--provenance` |

### Biome Config (translated from barhoppers-guide's Prettier settings)
```jsonc
// biome.json — key formatter settings
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 4,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "arrowParentheses": "always",
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5",
      "quoteProperties": "preserve"
    }
  },
  "organizeImports": { "enabled": true },
  "overrides": [
    { "includes": ["**/*.json", "**/*.yml", "**/*.yaml"], "formatter": { "indentWidth": 2 } }
  ]
}
```

### TS Quality (world-class internal bar, non-evangelical externally)
- **Library source:** `strict: true`, no `any`, no un-justified `as` assertions, no `@ts-ignore`/`@ts-expect-error` without a commented reason. CI enforces via `tsc --noEmit` on the strictest config.
- **Public API:** designed for best-in-class autocomplete:
  - Variant props as literal string unions.
  - Theme tokens autocompleted at call sites via typed `Theme` interface.
  - i18n keys autocompleted from the default dictionary type.
  - Icon props typed as component references, not strings.
- **Module augmentation supported** for consumer theme/i18n extension:
  ```ts
  declare module 'unbogify-ui' {
    interface Theme { colors: { brand: string } }
    interface I18nKeys { 'myApp.customLabel': string }
  }
  ```
- **Docs stance:** examples show clean typed patterns but do not scold consumers who use `any` or loose patterns in their own code. The library holds itself to a higher bar than it demands of consumers.

### Consumer Install (the only thing users have to do)
```bash
yarn add unbogify-ui
# and (optional) any icon library you like — directly imported:
yarn add lucide-react-native lucide-react
```

```ts
// tailwind.config.ts
import { unbogifyPreset } from 'unbogify-ui/tailwind-preset';
export default { presets: [unbogifyPreset], content: [...] };
```

```tsx
// app root (client boundary)
'use client';
import { UnbogifyProvider } from 'unbogify-ui/client';

export default function App() {
  return (
    <UnbogifyProvider>
      <YourApp />
    </UnbogifyProvider>
  );
}
```

```tsx
// using icons — direct import, tree-shaken automatically
import { ChevronRight } from 'lucide-react-native';
import { Button } from 'unbogify-ui';

<Button trailingIcon={ChevronRight}>Continue</Button>
```

### Integration Points
- **Consumer app** → one dependency + one provider + one Tailwind preset line.
- **Figma → tokens** → Tokens Studio exports JSON; CI regenerates Tailwind theme + TS types; published as part of `unbogify-ui`.
- **npm** → OIDC trusted publisher linked to this GitHub repo; no long-lived token.
- **Vercel** → docs site on every `main` push; PR previews on every PR.

### Security & Privacy
- No telemetry, no runtime network calls from library code. Ever.
- MCP endpoint is read-only; rate-limited via Vercel edge middleware.
- OIDC trusted publisher replaces long-lived npm tokens.
- `--provenance` enabled on npm publishes so consumers can verify build origin.
- Dependabot + `npm audit` in CI.

---

## 5. Risks & Roadmap

### Phased Rollout
- **v0.1 (this spec)** — 11 primitives, theming, tokens, i18n, docs+MCP, semantic-release, Playwright+Maestro, `asChild`, RSC split, reduced-motion, WCAG 2.2 AA baseline. Target: 6–8 weeks of focused work.
- **v0.2** — Portal-dependent components: Modal, Dialog, Dropdown, Popover, Tooltip, Toast. Focus management across RN + Web.
- **v0.3** — Form primitives (`Form`, `Field`), validation integration, advanced inputs (Select, Combobox, DatePicker, FileUpload).
- **v1.0** — API stability pledge, complete semantic token system (dark-mode toggle UI, semantic aliases), Reanimated-based animation primitives, RTL audit.

### Version Support Policy

The library supports a **rolling window of 3 Expo SDK tiers**. Anchor: SDK 55 is the initial release.

| Tier | What it means |
|---|---|
| **Current** (N) | Latest published Expo SDK. All new features and fixes land here. Full test matrix runs here. |
| **Maintained** (N-1) | One SDK behind current. All bug fixes backported. Full test matrix runs here. |
| **Legacy** (N-2) | Two SDKs behind current. Only critical correctness and security fixes backported. Smoke tests run in CI. |
| **Unsupported** (N-3 and older) | Library likely still imports and works, but no fixes are published specifically for these SDKs. Consumers upgrade or live with breakage. |

**Concrete timeline (projection):**

| Expo SDK release | Current | Maintained | Legacy | Unsupported |
|---|---|---|---|---|
| SDK 55 ships (now) | 55 | — | — | — |
| SDK 56 ships | 56 | 55 | — | — |
| SDK 57 ships | 57 | 56 | 55 | — |
| SDK 58 ships | 58 | 57 | 56 | 55 |
| SDK 59 ships | 59 | 58 | 57 | 55, 56 |

**Operational rules:**
- CI runs the full component test matrix against Current and Maintained on every PR.
- Legacy runs a reduced smoke test (lint + typecheck + unit tests) on every PR; full e2e runs nightly.
- CHANGELOG and release notes always explicitly list the three supported tiers.
- README ships a live compatibility table that updates on each major Expo SDK release.
- Any PR that would force-drop a still-in-window tier must flag this in the description; reviewer confirmation required.

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| NativeWind v4 regressions on RN New Arch | Medium | High | Pin versions; Maestro smoke tests on New-Arch build in CI; documented fallback plan to StyleSheet-based primitives if a component breaks |
| React Native Web parity gaps | Medium | Medium | Every component runs e2e on both targets; per-component parity checklist in PR template |
| Tree-shaking silently broken | Medium | High | `size-limit` CI gate per component — PR cannot merge if budget exceeded |
| MCP endpoint drift from docs | Medium | Low | MCP reads Fumadocs `source` object directly — structurally single source of truth; CI eval catches regressions |
| OIDC publish fails on first release | Low | Medium | First release is a test prerelease on `next` channel; one-time fallback via short-lived manual token documented in RUNBOOK.md |
| Biome RN-rule gap causes pain | Low | Low | ESLint-RN remains in place until Biome covers RN; trivially removable |
| Expo Snack iframe reliability in docs | Low | Low | Graceful fallback to static code block + "Open in Snack" button when embed fails; monitor |
| Maestro CI time on local emulators gets slow | Low | Medium | Start with local Maestro in GitHub Actions via iOS + Android emulators; move to Maestro Cloud only if CI duration becomes a bottleneck |
| Figma token drift (Tokens Studio JSON schema changes) | Low | Medium | Pin Tokens Studio schema version; contract-test the token-gen pipeline in CI |

### Open Decisions Deferred to Implementation
- **Reanimated integration plan** (post-v0.1, but may influence Button press-state choices now — must still honor `prefers-reduced-motion`).
- **Cross-platform visual regression tool** if Playwright-on-web + Maestro-on-native proves insufficient in practice.
- **Final library name** to replace `unbogify-ui` before first published release — see project memory for rename-hygiene sweep list.
- **Semantic icon registry final key list** — current draft is ~10 keys (`checkmark`, `close`, `eye`, `eyeOff`, `chevronDown`, `chevronUp`, `alertTriangle`, `info`, `check`, `x`); finalize during Checkbox/Switch/TextInput implementation.

---

## 6. Definition of Done for v0.1

The library ships when:
- [ ] All 11 components implemented + documented + tested (unit, e2e web, e2e native).
- [ ] Every interactive component supports `asChild` with a11y-correct prop/ref forwarding.
- [ ] Library split into RSC-safe default entry + `unbogify-ui/client` subpath; CI check enforces no hooks in default entry.
- [ ] Every component with motion respects `prefers-reduced-motion` on web and native.
- [ ] Every component passes WCAG 2.2 Level AA audits (axe on web, RNTL a11y assertions on native).
- [ ] `size-limit` budgets set and passing for every exported component (per §1 success criteria).
- [ ] Docs site live, Lighthouse ≥ 95 on all four axes; `llms.txt` and `llms-full.txt` served; `/mcp` endpoint live with 50-question eval ≥ 95%.
- [ ] Release workflow green: a tagged release appears on GitHub, published to npm via OIDC with provenance, changelog auto-generated from Conventional Commits.
- [ ] Test matrix runs against Current, Maintained, and Legacy Expo SDK tiers (§5 Version Support Policy).
- [ ] TypeScript strictness audit passes: zero `any`, zero un-justified `as` / `@ts-ignore` in library source.
- [ ] `README.md` covers install, provider setup, Tailwind preset, theming, i18n, icons, `asChild`, RSC usage, and the compatibility table — in under 250 lines.
- [ ] `RUNBOOK.md` covers: releasing, rotating credentials, responding to a broken publish, rolling back a release, dropping a tier when a new SDK ships.
