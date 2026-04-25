---
title: React Native UI library docs — feature landscape
date: 2026-04-25
type: research
status: snapshot — point-in-time, will rot
---

# React Native UI library docs — feature landscape (2026-04-25)

## Why this exists

We want nori-ui's docs to be best-in-class for both human developers and AI
coding agents. Before deciding what to build next we surveyed how the most-
used React Native component libraries present their docs today, so we can
pick targets that are either (a) table-stakes we're missing or (b) genuine
differentiators.

This is a snapshot, not a living doc. Ecosystem positions move; re-run this
exercise before any major roadmap planning.

## Libraries surveyed

| # | Library | Why it made the cut |
|---|---|---|
| 1 | **Tamagui** | One of the two most-cited universal RN/Web libraries in 2026; optimizing compiler, active SDK 53–55 support |
| 2 | **gluestack-ui (v3)** | NativeBase successor (GeekyAnts), v3 shipped with Expo SDK 53/RSC, NativeWind-based copy-paste |
| 3 | **react-native-reusables** (RNR) | "shadcn/ui for RN," fastest-rising NativeWind copy-paste library, official CLI |
| 4 | **React Native Paper** (RNP) | ~244k npm weekly downloads, Material Design 3, Callstack-maintained |
| 5 | **NativewindUI** (NWUI) | Other rising NativeWind kit (built on `@rn-primitives`) |

Excluded: **NativeBase** (retired into gluestack), **UI Kitten**, **React
Native Elements** (both stagnating in 2026).

## Sources

- LogRocket — best RN UI libraries 2026 — https://blog.logrocket.com/best-react-native-ui-component-libraries/
- react-native-paper on npm — https://www.npmjs.com/package/react-native-paper
- NativeBase future / migration to gluestack — https://nativebase.io/blogs/the-future-of-nativebase
- Tamagui llms.txt — https://tamagui.dev/llms.txt
- Tamagui Studio / Theme Builder / Bento — https://tamagui.dev/studio · https://tamagui.dev/theme · https://tamagui.dev/bento
- Tamagui Button docs — https://tamagui.dev/ui/button
- gluestack v3 release — https://gluestack.io/blogs/why-gluestack-ui-v2
- gluestack-ui MCP server (official) — https://github.com/gluestack/mcp · https://gluestack.io/ui/docs/mcp-server/mcp-server
- gluestack Figma kit — https://gluestack.io/ui/docs/home/getting-started/figma-ui-kit
- gluestack-ui Button docs — https://gluestack.io/ui/docs/components/button
- react-native-reusables CLI — https://www.npmjs.com/package/@react-native-reusables/cli/v/0.4.1
- RNR llms.txt discussion #459 — https://github.com/founded-labs/react-native-reusables/discussions/459
- React Native Reusables docs — https://reactnativereusables.com/docs
- React Native Paper Button docs — http://oss.callstack.com/react-native-paper/docs/components/Button/
- Paper v5 migration guide — https://github.com/callstack/react-native-paper/discussions/3974
- @rn-primitives — https://github.com/roninoss/rn-primitives
- NativewindUI — https://nativewindui.com/

## Common features (≥ 3 of 5 ship it)

Legend: ✓ shipped, ✗ absent, ~ partial, ⚠️ claimed but unverified.

| Feature | TAM | GS | RNR | RNP | NWUI | Notes |
|---|---|---|---|---|---|---|
| Live preview of components | ✓ | ✓ | ✓ | ~ static images | ✓ | Paper still uses screenshots |
| Package-manager tabs (npm/yarn/pnpm/bun) | ✓ | ✓ | ✓ | ✗ | ⚠️ | Paper just shows one command |
| Copy-code button on snippets | ✓ | ✓ | ✓ | ✗ | ⚠️ | — |
| CLI `add` command (shadcn-style) | ~ Bento (paid Takeout) | ✓ `npx gluestack-ui add` | ✓ `npx @react-native-reusables/cli add` | ✗ | ✓ via shadcn registry | — |
| Auto-generated prop tables | ✓ | ✓ | ~ inline | ✓ | ✓ | All but RNR show formal API tables |
| Dark-mode toggle on docs site | ✓ | ✓ | ✓ | ✓ | ✓ | universal |
| Theme switcher demo on docs (multi-theme picker) | ✓ B/W, Ocean, SUPER… | ~ light/dark only | ~ | ~ | ~ | Tamagui uniquely picks brand themes inline |
| "Edit on GitHub" per page | ✓ | ✓ | ⚠️ | ✓ | ⚠️ | — |
| Versioned docs / version selector | ✓ | ✓ v1/v2/v3 | ✗ | ✓ v1–v5 | ✗ | Paper has the deepest history |
| Migration guides | ✓ | ✓ | ✗ | ✓ | ✗ | Paper v4→v5 is the gold standard |
| Search (full-text, Algolia-style) | ✓ | ✓ | ✓ | ✓ | ✓ | universal |
| Figma kit link | ✓ community | ✓ first-class | ✗ | ✗ | ✗ | — |
| Changelog visibility | ✓ | ✓ | ✓ | ✓ | ✓ | universal |

## Unique / early-adopter features (only 1–2 of 5 ship it)

| Feature | TAM | GS | RNR | RNP | NWUI | Notes |
|---|---|---|---|---|---|---|
| `/llms.txt` published | ✓ | ✗ | ✗ (only proposed) | ✗ | ✗ | Tamagui is the only one in this set |
| First-party MCP server | ⚠️ community | ✓ official | ✗ | ✗ | ✗ | gluestack ships v2 screen-generation MCP |
| Recipe / pattern marketplace (login, e-commerce, settings…) | ✓ Bento (free + paid) | ~ small "Recipes" | ✗ | ✗ | ✗ | Tamagui Bento is the most ambitious |
| Visual theme-builder studio | ✓ Studio + Theme Builder | ✗ | ✗ | ✗ | ✗ | Tamagui-only |
| Per-platform preview switcher (iOS/Android/Web) | ✗ | ✗ | ✗ | ✗ | ✗ | **Whitespace — nobody ships this well** |
| Inline editable / runnable Snack embeds | ✗ | ✗ | ✓ "Expo Snack Examples" linked from docs | ~ official Snack demo (single, not per-component) | ✗ | RNR is the leader |
| 5+ historical versions of docs | ✗ | ~ 3 versions | ✗ | ✓ v1–v5 | ✗ | Paper-only |
| Performance benchmark page | ~ compiler claims | ✓ perf section | ✗ | ✗ | ✗ | Mostly marketing copy |
| "Open in v0 / Cursor / Claude" buttons per component | ✗ | ✗ | ✗ | ✗ | ✗ | **Total whitespace** |
| "Copy as Markdown / View as JSON" per page | ✗ | ✗ | ✗ | ✗ | ✗ | **Whitespace** |
| RTL / i18n preview toggle | ✗ | ✗ | ✗ | ✗ | ✗ | **Whitespace** |
| Bundle-size badge per component | ✗ | ✗ | ✗ | ✗ | ✗ | **Whitespace** |
| Dependency graph visualizer | ✗ | ✗ | ✗ | ✗ | ✗ | **Whitespace** |
| Public roadmap on docs | ~ | ✓ | ⚠️ | ~ GitHub only | ⚠️ | — |

## Where nori-ui stands today

**Already shipped (as of this snapshot):**
- `<Install>` package-manager tabs
- `<Preview>` live demo + source-code tabs
- Syntax highlighting matching site theme (shiki, github-light/dark)
- Dark-mode toggle, search
- `/llms.txt` and `/llms-full.txt`
- MCP server endpoint at `/mcp`

**Common-tier gaps (table-stakes we should close):**
- CLI `add` command
- Auto-generated prop tables from TS source
- "Edit on GitHub" per page
- Versioned docs URL pattern
- Figma kit link

**Whitespace opportunities (almost nobody else ships these):**
- Per-platform preview switcher (iOS / Android / Web)
- "Open in v0 / Cursor / Claude" buttons per component
- "Copy as Markdown" + per-component `/components/<name>.md` endpoint
- RTL / i18n preview toggle
- Bundle-size badge per component

## Recommended priorities (ranked, opinionated)

1. **CLI `npx nori-ui add <component>`** — standard mental model (shadcn / RNR / GS); without it, copy-paste is friction.
2. **Per-platform preview switcher (iOS / Android / Web)** — biggest visible differentiator for a *universal* RN+Web library specifically. Nobody ships it well today.
3. **Auto-generated prop tables from TS source** via `react-docgen-typescript` — common-tier, trivial, kills the hand-written tables in every MDX. Reinforces the "world-class TS internally" stance.
4. **"Copy as Markdown" + per-component `/components/<name>.md` endpoint** — agents `curl` one URL and get prose + full source. Real shadcn-style affordance.
5. **"Open in v0 / Cursor / Claude" buttons** — total whitespace among top 5; high agent-first signal.
6. **"Edit on GitHub" link per page** — table-stakes; ~30 lines.
7. **"Open in StackBlitz" embeds for web demos** — easier than Snack, mature, fast.
8. **Versioned docs URL pattern (`/v0/...`) before 1.0** — Paper's depth is its moat; cheaper to set up now than retrofit.
9. **Figma kit link** — even just a placeholder showing intent matters to designers evaluating.
10. **Component playground (Storybook-style controls)** — bigger lift, but turns docs into an exploration tool.

**Skip for now:** bundle-size badges, dependency graphs, theme-builder studio, RTL toggle, recipe marketplace. High-effort, low-pull until adoption exists.

## Notes for re-running this research

- This survey was scoped to docs *features*, not component coverage or API
  ergonomics. A separate survey covering accessibility, theming, and
  component count is worth doing before any positioning claims.
- The five libraries chosen reflect 2026-04-25 popularity. If the next
  re-run is more than ~6 months out, refresh the candidate list before the
  matrix.
- The matrix is the deliverable, not the prose. Prefer adding/removing
  rows over rewriting the narrative.
