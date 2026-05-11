# Calendar — Phase 2A (Native validation + `behavior="scroll"`) Design

**Status:** approved (design)
**Date:** 2026-05-11
**Scope:** subsystem A of the original "Phase 2/3" rollout, re-scoped to also include `behavior="scroll"` on both platforms.
**Predecessor:** [`2026-05-05-plan-08a-calendar-web.md`](../plans/2026-05-05-plan-08a-calendar-web.md) — Phase 1 (web Calendar), merged.

---

## 1. Goals & non-goals

### Goals

- `<Calendar>` from `@nori-ui/core` works correctly on iOS + Android (Expo SDK 55+, Hermes runtime), with **behavior parity to web** wherever the platform allows (paged-only by default, drilldown, dropdown caption, locale, single/range/multi modes, constraints, render slots).
- Native-only divergence is confined to **range interaction**: tap-tap (no hover preview).
- **Both platforms support `behavior="paged"` (default) and `behavior="scroll"` (opt-in, vertical only).** Feature parity:
  - Web `scroll`: pure CSS scroll container with stacked month panels — no virtualization (perf is fine).
  - Native `scroll`: `@marceloterreiro/flash-calendar` for `FlashList`-backed virtualization on long month ranges.
- A new `nori-ui:rn` Jest project runs `*.native.test.tsx` files and covers the divergent code paths.
- Automated a11y assertions (roles, labels, states) on the native code path.
- React `Profiler` render-time test as a cheap perf proxy (informational, not gating).
- `playground-native` shows working Calendar demos (paged + scroll + dropdown caption + custom render) so iOS and Android simulators can be smoke-tested on a real boot.

### Non-goals (deferred to later subsystems)

- Non-Gregorian calendar systems (Hijri, Hebrew, Persian, Buddhist, Japanese) → **subsystem B**.
- `<DatePicker>` (input + popover, single date) → **subsystem C**.
- `<DatePicker.Range>` (input + popover, range) → **subsystem D**.
- Real-device 60fps measurement infrastructure (Detox/Maestro + device farm) — punted to a perf-tooling track of its own. Subsystem A ships with the Profiler proxy only.
- Tap-and-drag range gesture on touch (tap-tap only).
- Horizontal swipe to change month (paged stays buttons-only; vertical scroll covers the gestural alternative).
- Manual VoiceOver / TalkBack screen-reader sweeps gating PRs. Automated assertions are the bar; issues fix on report.
- Hardware-keyboard (iPad / external keyboard) contract on native.
- `flash-calendar` on web (web scroll rolls its own).
- Bundle-size budgets — rely on code-review discipline.

---

## 2. Architecture & file layout

### 2.1 Existing layout (after Phase 1)

```
packages/core/src/components/Calendar/
├── Calendar.tsx            (compound root + slots)
├── Calendar.types.ts
├── index.ts
├── state/                  (use-calendar-state, use-range-state, use-caption,
│                            locale-utils, constraints, types)
├── view/
│   ├── Caption.tsx
│   ├── DayCell.tsx
│   ├── DayGrid.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── MonthGrid.tsx
│   └── YearGrid.tsx
└── __tests__/
```

### 2.2 Additions in subsystem A

```
packages/core/src/components/Calendar/
├── scroll/
│   ├── ScrollBody.tsx                    (shared interface; default impl
│   │                                       throws if neither extension is picked)
│   ├── ScrollBody.web.tsx                (CSS scroll container, stacked DayGrids,
│   │                                       IntersectionObserver for visible-month tracking)
│   └── ScrollBody.native.tsx             (flash-calendar wrapper, mapping our
│                                           DayContext / renderDay to its API)
├── view/                                 (UNCHANGED for paged; DayGrid is reused
│                                           by ScrollBody)
├── Calendar.tsx                          (gains behavior dispatch:
│                                           `behavior === 'scroll' ? <ScrollBody/> : <DayGrid/>`)
└── __tests__/
    ├── (existing jsdom tests, unchanged)
    ├── Calendar.scroll.test.tsx          (web scroll path; runs under nori-ui:jsdom)
    └── native/
        ├── Calendar.native.test.tsx           (smoke render)
        ├── range-interaction.native.test.tsx  (tap-tap behavior via existing state machine)
        ├── a11y.native.test.tsx               (roles/labels/states)
        ├── scroll-body.native.test.tsx        (flash-calendar wrapper)
        └── perf.native.test.tsx               (Profiler render-time)
```

**Why no `interaction/` split:** Phase-1 wires hover-preview through `Pressable.onHoverIn`, which is already platform-aware (RN-Web maps to mouse events, RN native ignores it). On native, `setHoveredDate` is never called, so `previewRange` is always `null` and tap-tap behavior emerges from the existing range state machine without new code. The native tests **verify** this rather than implementing a parallel hook.

### 2.3 Why platform extensions (Approach B), not inline `Platform.OS`

The `behavior="scroll"` implementation diverges by **infrastructure**, not configuration: web uses CSS scroll + `IntersectionObserver`, native uses `flash-calendar`. Inline `Platform.OS` would force unrelated JSX/imports into each platform's bundle. Platform extensions send only the relevant implementation to each.

The codebase already uses this pattern for capability/infrastructure divergences (`animated-view.web.ts`, `sonner-native-bridge.native.tsx`, `blur-backdrop.native.tsx`), while inline `Platform.OS` is reserved for narrow one-liners (`Pagination`, `FloatButton`). Subsystem A follows the established split for `ScrollBody`; the rest of the Calendar requires no platform split because Phase-1 already used universal RN primitives (`Pressable`, `View`, `Text`).

### 2.4 Bundle / entry impact

- `packages/core/package.json` already exposes a `react-native` conditional export pointing at `./src/index.ts`. Metro auto-picks `*.native.tsx` extensions — no entry-point changes needed.
- **New optional peer dep** `@marceloterreiro/flash-calendar`, declared with `peerDependenciesMeta.optional = true`. Consumers who never set `behavior="scroll"` aren't forced to install it. `ScrollBody.native.tsx` resolves it lazily and throws a clear error message if missing when mounted.
- No new public API surface. `behavior` already exists in `CalendarBaseProps`; Phase 1 simply never honored `'scroll'`.

### 2.5 Test infrastructure additions

- New Jest project `nori-ui:rn` in `packages/core/jest.config.cjs`:
  - Preset: `jest-expo` is the preferred starting point; if it conflicts with the existing `ts-jest` transform, fall back to the bare `react-native` preset. The implementation plan §6.1 resolves the choice.
  - `testMatch`: `<rootDir>/src/**/__tests__/native/**/*.test.tsx`.
  - `setupFilesAfterEnv`: new `jest.native-setup.ts` mocks `@marceloterreiro/flash-calendar` and `react-native-gesture-handler` as needed.
- The `yarn test` script keeps invoking all projects; CI gains the third project in the test matrix.

---

## 3. Behavioral contract (web vs native parity)

### 3.1 Identical on both platforms

- Selection modes (`single`, `range`, `multiple`): same `value` shape, same `onChange` payload, same `ChangeMeta`.
- Drilldown navigation: `day → month → year`, triggered by header title taps and cell taps. Same triggers everywhere.
- Caption modes (`'title'`, `'dropdown'`, `'custom'`): the `Select` primitive used by `'dropdown'` is already universal.
- `visibleMonths='auto'`: measured via `onLayout`, platform-agnostic. (Already verified in Phase 1.)
- `firstDayOfWeek`, `weekendDays`, `showWeekNumbers`, `highlightToday`, `locale`, `minValue`, `maxValue`, `isDateUnavailable`, `minNights`, `maxNights`, `yearRange`.
- Render slots (`renderDay`, `Calendar.Header`, `Calendar.Footer`, `Calendar.Caption`): consumers must use universal primitives in their slot content; mixing in web-only DOM is the consumer's mistake.
- Body fade-up animation on month/view change: uses the existing universal `animation/animated-view.web.ts` ↔ RN `Animated` indirection.

### 3.2 Diverges by capability

| Concern | Web | Native | Why |
|---|---|---|---|
| Range hover preview (mouse) | yes — `onPointerEnter` paints tentative range | no — touch has no hover | tap-tap commits both endpoints; pending-start cell stays highlighted between taps |
| Keyboard (Aria key map) | full | not active | hardware-keyboard support is explicitly a non-goal here |
| Focus ring visuals | CSS `:focus-visible` | RN-style 2px outline rendered via `View` | DayCell already supports both |
| `behavior="scroll"` impl | CSS overflow + `IntersectionObserver` | `flash-calendar` | Section 2 |
| Disabled-cell tap | no-op | no-op | parity (existing) |

### 3.3 Range-mode interaction on native (tap-tap)

State transitions:

1. Initial / no pending: tap a cell → state becomes `{ start, end: null }`, the cell is highlighted as "pending start".
2. Pending-start: tap another cell → if it satisfies `minNights`/`maxNights` and isn't unavailable, state commits to `{ start, end }` with `start ≤ end` (auto-swap if user tapped a date before the pending start). Fires `onChange` once with `source: 'click'`.
3. Committed: tap any cell → state becomes `{ start: tapped, end: null }`, returning to the pending-start state.

No hover-preview path is registered on native. A regression-guard test asserts that mounting the native interaction hook never installs pointer-enter listeners.

### 3.4 `behavior="scroll"` contract (both platforms)

- Renders an unbounded vertical sequence of single-column month panels (one `<DayGrid>` per month).
- Initial render window: `[focusedDate - 12 months, focusedDate + 24 months]`. Expanded on scroll-near-edge. Window constants live in the scroll module; not consumer-facing.
- Caption changes (dropdown month/year selection, header-title drilldown commits) anchor the list to the chosen month.
- `visibleMonths` is **ignored** in scroll mode (scroll is single-column by definition). If a consumer passes both `behavior="scroll"` and `visibleMonths > 1`, a dev-mode `console.warn` fires and the component falls back to single-column rendering.
- Header chevrons (prev/next): in scroll mode they scroll the list by one month rather than paging.
- `ChangeMeta.source` is `'scroll'` for any value/focused-month change driven by user scroll (intersection observer on web, `flash-calendar` scroll callback on native).
- "Focused month" definition: the topmost-visible month panel on both platforms. Drives header title display, dropdown defaults, and year-grid drilldown anchor.

### 3.5 A11y (native, automated only)

- Day-grid container: `accessibilityRole="grid"`.
- Each day cell: `accessibilityRole="button"`; `accessibilityLabel="{weekday}, {full localized date}"` with appended state strings (`", selected"`, `", unavailable"`, `", today"`). `accessibilityState`: `{ selected, disabled }`.
- Header chevrons: `accessibilityRole="button"`; `accessibilityLabel="Previous month"` / `"Next month"`.
- Year and month grids: same pattern, labels read as `"2026"` / `"May"`.
- Dropdown caption: relies on the existing `Select`'s a11y (already covered upstream).

Manual screen-reader sweeps are not part of the acceptance gate — see non-goals.

### 3.6 Animations on native

- Body fade-up uses the existing `Animated.View` abstraction (the universal `animated-view` module). No platform-specific code.
- The Profiler test asserts the React commit phase of a paged month-change stays under an order-of-magnitude budget. Visual judgement on a simulator is the manual smoke check.

---

## 4. Test plan

### 4.1 New native test files

Located under `packages/core/src/components/Calendar/__tests__/native/`, run by the new `nori-ui:rn` Jest project.

| File | Coverage |
|---|---|
| `Calendar.native.test.tsx` | Smoke render of `single` / `range` / `multiple` modes; selection commits via `Pressable` press; drilldown view changes on header tap; dropdown caption opens and selects |
| `range-interaction.native.test.tsx` | Tap-tap state machine (Section 3.3): pending → committed → restart; minNights/maxNights honored on commit; **regression guard: hover-preview listeners are never installed on native** |
| `a11y.native.test.tsx` | Roles / labels / states per Section 3.5 |
| `scroll-body.native.test.tsx` | With mocked `flash-calendar`, assert: panel renders for each month in window; `onChange` fires with `source: 'scroll'` on simulated month change; `visibleMonths > 1` + `behavior="scroll"` triggers dev warning and falls back to single column |
| `perf.native.test.tsx` | React `Profiler` wraps Calendar; assert paged-month-change commit phase under a generous order-of-magnitude budget (informational; not gating) |

### 4.2 New web test file

Located under `packages/core/src/components/Calendar/__tests__/`, runs under the existing `nori-ui:jsdom` project.

| File | Coverage |
|---|---|
| `Calendar.scroll.test.tsx` | Web scroll mode renders the expected month-panel range; mocked `IntersectionObserver` drives focused-month tracking; dropdown-caption-driven anchor change scrolls list to target |

### 4.3 Existing tests

All Phase-1 jsdom suites (state machines, range, keyboard contract, integration, jest-axe, i18n, view-level web) continue to pass without modification.

### 4.4 Visual smoke (manual, one-time before merge)

`playground-native` gains a Calendar route showing six demos: single, range, multi, scroll, dropdown caption, custom render. One-time iOS sim + Android sim run; screen recordings attached to the PR.

### 4.5 What we explicitly do not test here

- Real-device 60fps perf (deferred to a perf-tooling track).
- Bundle size against numeric budgets (memory: no hard size budgets).
- Manual VoiceOver / TalkBack announcement quality (memory: a11y is automation-only).
- Hardware-keyboard contract on native (non-goal).

---

## 5. Acceptance criteria

Subsystem A is done when **all** of these hold.

### Functional
- [ ] `<Calendar>` renders on iOS sim and Android sim from `playground-native` (paged single/range/multi + scroll variant + dropdown caption + custom render).
- [ ] Selecting a date / range / multiple dates fires `onChange` with the documented payload shape on both sims.
- [ ] Drilldown (day → month → year → back) works with header taps on both sims.
- [ ] `behavior="scroll"` renders a vertically scrollable list of month panels on both platforms; header chevrons advance one month at a time; dropdown caption anchors the list.
- [ ] Range mode on native: 1st tap sets pending, 2nd tap commits, 3rd tap restarts. No hover-preview path exists on native.
- [ ] `visibleMonths > 1` with `behavior="scroll"` console-warns in dev and falls back to single column.

### Tests
- [ ] New Jest project `nori-ui:rn` exists in `packages/core/jest.config.cjs` and runs in CI.
- [ ] All native test files in §4.1 exist and pass.
- [ ] New web scroll test in §4.2 passes.
- [ ] All Phase-1 jsdom tests still pass.
- [ ] Workspace-wide `yarn typecheck` green.
- [ ] `yarn biome check .` clean.

### A11y (automated)
- [ ] Day cells expose `accessibilityRole`, `accessibilityLabel`, `accessibilityState` per §3.5 — asserted in `a11y.native.test.tsx`.
- [ ] Header chevrons expose `accessibilityLabel` `"Previous month"` / `"Next month"`.
- [ ] Year and month grids expose readable labels.

### Docs
- [ ] Existing Calendar docs page gains a "Scroll behavior" section + a `behavior="scroll"` demo block.
- [ ] If `flash-calendar` is added as an optional peer, the install instructions in the Calendar doc clarify when consumers need to install it.

### Smoke (manual, one-time before merge)
- [ ] iOS sim screen recording attached to PR showing paged + scroll modes working.
- [ ] Android sim screen recording attached to PR showing paged + scroll modes working.

### Non-criteria (explicitly out)
- No bundle-size budget assertion.
- No real-device 60fps assertion.
- No screen-reader manual sweep.
- No keyboard-on-iPad contract.

---

## 6. Open questions for the implementation plan

These do not block design approval but the implementation plan should resolve them:

1. **`jest-expo` vs `react-native` preset** for the `nori-ui:rn` project — settle by trying `jest-expo` first; fall back if the existing `ts-jest` transform conflicts.
2. **`flash-calendar` API mapping** — specifically, how its day-cell renderer slot integrates with our `renderDay` + `DayContext`. The wrapper layer in `ScrollBody.native.tsx` will need a thin adapter; exact shape settled in the plan.
3. **Initial scroll window constants** (`[−12, +24]` months) — confirm they're sensible after a smoke test; tune if cold-start cost is too high.
4. **`Profiler` budget value** — set by measuring once on the developer machine and adding generous headroom (target: catches an order-of-magnitude regression, ignores small fluctuations).

---

## Summary

- Hardens the merged Phase-1 Calendar on iOS + Android with **behavior parity** to web for everything except range hover-preview.
- Lights up `behavior="scroll"` on both platforms simultaneously: CSS-driven on web, `flash-calendar`-backed on native.
- Adds a `nori-ui:rn` Jest project with five new native test files plus one new web scroll test.
- A11y is automated-only, perf is Profiler-only, bundle size is not budgeted — by user policy.
- No public API surface changes; only the long-promised `'scroll'` option gets wired up.
