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
4. **Docs Lighthouse scores ≥ 95** on Performance, Accessibility, Best Practices, SEO.
5. **MCP endpoint ≥ 95% success rate** on a 50-question natural-language eval of component lookup, prop discovery, and usage.

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

**US-5: Swappable icons**
As a developer who uses Phosphor (not Lucide), I want to swap the icon set without forking.

_Acceptance Criteria:_
- Default: Lucide via **optional peer dependencies** (`lucide-react`, `lucide-react-native`). Consumers who don't use icons pay nothing.
- `<UnbogifyProvider icons={createIconSet({ resolve: (name) => MyComponent })}>` replaces the registry.
- Per-instance `<Icon as={CustomSvg} />` escape hatch.
- `<Icon name="ChevronRight" size={24} />` is the canonical API; the `name` is a string so dictionary lookup stays consistent across providers.

**US-6: AI-queryable docs**
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
| Runtime | React 19, React Native 0.76+ (New Architecture), Expo SDK 52+ |
| Language | TypeScript 5.6+, strict mode |
| Styling | NativeWind v4 (Tailwind CSS underneath) |
| Icons | Lucide as optional peer deps; swappable via provider |
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

### Consumer Install (the only thing users have to do)
```bash
yarn add unbogify-ui
# and if you want icons:
yarn add lucide-react lucide-react-native
```

```ts
// tailwind.config.ts
import { unbogifyPreset } from 'unbogify-ui/tailwind-preset';
export default { presets: [unbogifyPreset], content: [...] };
```

```tsx
// app root
import { UnbogifyProvider } from 'unbogify-ui';

export default function App() {
  return (
    <UnbogifyProvider>
      <YourApp />
    </UnbogifyProvider>
  );
}
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
- **v0.1 (this spec)** — 11 primitives, theming, tokens, i18n, docs+MCP, semantic-release, Playwright+Maestro. Target: 6–8 weeks of focused work.
- **v0.2** — Portal-dependent components: Modal, Dialog, Dropdown, Popover, Tooltip, Toast. Focus management across RN + Web.
- **v0.3** — Form primitives (`Form`, `Field`), validation integration, advanced inputs (Select, Combobox, DatePicker, FileUpload).
- **v1.0** — API stability pledge, complete semantic token system (dark-mode toggle UI, semantic aliases), Reanimated-based animation primitives, RTL audit.

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
- **Exact semver + Node version targets** (`engines` field in package.json).
- **Reanimated integration plan** (post-v0.1, but may influence Button press-state choices now).
- **Cross-platform visual regression tool** if Playwright-on-web + Maestro-on-native proves insufficient in practice.
- **Final library name** to replace `unbogify-ui` before first published release.

---

## 6. Definition of Done for v0.1

The library ships when:
- [ ] All 11 components implemented + documented + tested (unit, e2e web, e2e native).
- [ ] `size-limit` budgets set and passing for every exported component.
- [ ] Docs site live, Lighthouse ≥ 95 on all four axes.
- [ ] MCP endpoint live, 50-question eval ≥ 95%.
- [ ] Release workflow green: a tagged release appears on GitHub, published to npm via OIDC with provenance, changelog auto-generated.
- [ ] `README.md` covers install, provider setup, Tailwind preset, theming, i18n, and icons in under 200 lines.
- [ ] `RUNBOOK.md` covers: releasing, rotating credentials, responding to a broken publish, rolling back a release.
