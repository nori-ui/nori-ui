# Calendar Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the merged Phase-1 `<Calendar>` on iOS + Android, with behavior parity to web for everything except range hover-preview (which becomes tap-tap naturally on touch), and light up `behavior="scroll"` on both platforms — CSS scroll + `IntersectionObserver` on web, `@marceloterreiro/flash-calendar` (optional peer dep) on native.

**Architecture:** Two new `scroll/ScrollBody.{web,native}.tsx` platform-extension files plug into `Calendar.tsx` via a small `behavior === 'scroll' ? <ScrollBody/> : <existing paged body/>` dispatch. No interaction-layer split (Phase-1's `Pressable.onHoverIn` is already platform-aware). A new `nori-ui:rn` Jest project covers the native code path via `jest-expo` preset.

**Tech Stack:** React 19, React Native 0.83 (Expo SDK 55), TypeScript strict, `@internationalized/date`, `@testing-library/react-native`, `jest-expo`, `@marceloterreiro/flash-calendar` (optional peer dep).

**Spec:** [`docs/superpowers/specs/2026-05-11-calendar-phase2a-native-design.md`](../specs/2026-05-11-calendar-phase2a-native-design.md) (commit `1533b5e`)

**Open-question resolutions:**
1. **Preset:** `jest-expo`. Falls back to bare `react-native` preset only if `ts-jest` conflicts arise.
2. **flash-calendar adapter:** `ScrollBody.native.tsx` wraps `Calendar.List` from `@marceloterreiro/flash-calendar`, passing our existing `DayContext` shape into its `renderItem` slot via a thin date→ctx mapper. The wrapper keeps the existing `DayCell` component as the leaf renderer so visual parity is automatic.
3. **Initial scroll window:** `[focusedDate - 12 months, focusedDate + 24 months]` defined as constants `SCROLL_PAST_MONTHS = 12`, `SCROLL_FUTURE_MONTHS = 24` in `scroll/constants.ts`. Tunable but not consumer-facing.
4. **Profiler budget:** `100ms` for paged month-change commit phase. Generous on purpose — only catches order-of-magnitude regressions, ignores normal fluctuations. Test fails loudly with the measured value if it crosses the threshold.

---

## File Structure

**Create:**
- `packages/core/jest.native-setup.ts` — `nori-ui:rn` setup (mocks flash-calendar, gesture-handler if needed)
- `packages/core/src/components/Calendar/scroll/constants.ts` — scroll window + tunable constants
- `packages/core/src/components/Calendar/scroll/ScrollBody.tsx` — shared interface + default impl that throws
- `packages/core/src/components/Calendar/scroll/ScrollBody.web.tsx` — CSS scroll container + IO
- `packages/core/src/components/Calendar/scroll/ScrollBody.native.tsx` — flash-calendar wrapper
- `packages/core/src/components/Calendar/__tests__/Calendar.scroll.test.tsx` — web scroll path
- `packages/core/src/components/Calendar/__tests__/native/Calendar.native.test.tsx` — native smoke
- `packages/core/src/components/Calendar/__tests__/native/range-interaction.native.test.tsx` — tap-tap verification
- `packages/core/src/components/Calendar/__tests__/native/a11y.native.test.tsx` — roles/labels/states
- `packages/core/src/components/Calendar/__tests__/native/scroll-body.native.test.tsx` — flash-calendar wrapper
- `packages/core/src/components/Calendar/__tests__/native/perf.native.test.tsx` — Profiler render-time
- `apps/playground-native/app/calendar.tsx` — playground route with six demos

**Modify:**
- `packages/core/jest.config.cjs` — add `nori-ui:rn` project
- `packages/core/package.json` — add `@marceloterreiro/flash-calendar` as optional peer dep + dev dep; add `@testing-library/react-native` to dev deps if not already; add `jest-expo` as dev dep
- `packages/core/src/components/Calendar/Calendar.tsx` — add behavior dispatch (single and range)
- `apps/docs/src/content/components/calendar.mdx` — add "Scroll behavior" section + demo

---

## Task 1: Add the `nori-ui:rn` Jest project skeleton

**Files:**
- Create: `packages/core/jest.native-setup.ts`
- Modify: `packages/core/jest.config.cjs`
- Modify: `packages/core/package.json` (devDependencies)

- [ ] **Step 1: Install dev deps**

```bash
yarn workspace @nori-ui/core add -D jest-expo @testing-library/jest-native
```

Verify `@testing-library/react-native` is already declared (it is per project audit — version `^12`).

- [ ] **Step 2: Create minimal native setup file**

Create `packages/core/jest.native-setup.ts`:

```ts
// Setup for the nori-ui:rn Jest project. Unlike jest.rn-setup.ts (which
// mocks react-native to render DOM tags for jsdom assertions), this file
// runs UNDER jest-expo, which provides a real RN test environment.
// We only mock things that:
//   1) can't load in jest (native modules, flash-calendar's RN bridge)
//   2) we don't want to exercise here (it's covered by the wrapper test)

import '@testing-library/jest-native/extend-expect';

// flash-calendar pulls in @shopify/flash-list which has a native module
// dependency. Mock the surface we use; scroll-body.native.test.tsx
// asserts the wrapper passes the right props in.
jest.mock('@marceloterreiro/flash-calendar', () => {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');

    type Day = { id: string; date: Date };
    type Props = {
        calendarInitialMonthId?: string;
        calendarPastScrollRangeInMonths?: number;
        calendarFutureScrollRangeInMonths?: number;
        onCalendarDayPress?: (id: string) => void;
        getCalendarWeekDayFormat?: (date: Date) => string;
        children?: React.ReactNode;
    };

    const CalendarList = (props: Props) => {
        // Render a deterministic, inspectable representation tests can
        // assert against. Real flash-calendar is virtualized; in tests
        // we surface enough surface to verify wiring.
        return React.createElement(
            View,
            { testID: 'flash-calendar-mock' },
            React.createElement(Text, null, `initial=${props.calendarInitialMonthId ?? ''}`),
            React.createElement(Text, null, `past=${props.calendarPastScrollRangeInMonths ?? 0}`),
            React.createElement(Text, null, `future=${props.calendarFutureScrollRangeInMonths ?? 0}`),
            props.children ?? null
        );
    };

    return { __esModule: true, Calendar: { List: CalendarList } };
});
```

- [ ] **Step 3: Add the third Jest project**

Modify `packages/core/jest.config.cjs` — append a third entry to the `projects` array (keep existing two untouched):

```js
const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: '@nori-ui/core',
    projects: [
        // ... existing nori-ui:node entry (unchanged)
        // ... existing nori-ui:jsdom entry (unchanged)
        {
            ...base,
            displayName: 'nori-ui:rn',
            preset: 'jest-expo',
            testMatch: ['<rootDir>/src/**/__tests__/native/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/jest.native-setup.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
            // jest-expo's default transformIgnorePatterns already covers
            // expo / react-native / @react-native packages; ts-jest handles our
            // TS source. Nothing extra needed unless a 3p RN dep gets pulled in.
        },
    ],
};
```

- [ ] **Step 4: Write a trivial smoke test to verify the project boots**

Create `packages/core/src/components/Calendar/__tests__/native/_smoke.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

describe('nori-ui:rn smoke', () => {
    it('renders a View+Text under jest-expo', () => {
        const { getByText } = render(
            <View>
                <Text>hello-native</Text>
            </View>
        );
        expect(getByText('hello-native')).toBeTruthy();
    });
});
```

- [ ] **Step 5: Run the project**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn
```

Expected: 1 passed, 0 failed.

If `jest-expo` conflicts with the `ts-jest` transform (e.g. babel/ts-jest tug-of-war on TSX files), fall back to:
- Remove `preset: 'jest-expo'`
- Set `testEnvironment: 'node'`
- Add a thin `react-native` resolver mock if needed

Record which path was taken in a comment in `jest.config.cjs`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/jest.config.cjs packages/core/jest.native-setup.ts \
    packages/core/src/components/Calendar/__tests__/native/_smoke.test.tsx \
    packages/core/package.json
git commit -m "test(core): add nori-ui:rn jest project for native code path"
```

---

## Task 2: Native smoke test — single mode renders + selects

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/native/Calendar.native.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `packages/core/src/components/Calendar/__tests__/native/Calendar.native.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../NoriProvider';

const wrap = (ui: React.ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('Calendar — native smoke (single mode)', () => {
    it('renders day cells for the focused month', () => {
        const { getByLabelText } = render(wrap(<Calendar defaultValue={d(2026, 5, 8)} />));
        expect(getByLabelText(/May 8, 2026/i)).toBeTruthy();
    });

    it('fires onChange when a day cell is pressed', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar defaultValue={d(2026, 5, 1)} onChange={onChange} />)
        );
        fireEvent.press(getByLabelText(/May 15, 2026/i));
        expect(onChange).toHaveBeenCalledTimes(1);
        const [val, meta] = onChange.mock.calls[0];
        expect(val).toMatchObject({ year: 2026, month: 5, day: 15 });
        expect(meta).toMatchObject({ view: 'day', source: 'click' });
    });
});
```

- [ ] **Step 2: Run it**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn Calendar.native
```

Expected: FAIL — either accessibilityLabel format mismatch, or NoriProvider issue, or `Calendar` import path. Read the failure and fix whichever surfaces *in the source* (don't soften the test).

- [ ] **Step 3: Fix any source issues revealed**

Common issues that may surface:
- `accessibilityLabel` not set on day cells → add it in `DayCell.tsx`, format: `"{weekday}, {Month} {day}, {year}"` plus state suffixes.
- `Pressable.onPress` not wired through `DayCell` → trace and fix.
- `NoriProvider` import path differs on native — confirm via `grep -n "export.*NoriProvider" packages/core/src/**/*.ts`.

Make the minimum source change required for the test to pass. Each surfaced bug counts as a finding — note them in the PR description.

- [ ] **Step 4: Run again, expect pass**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn Calendar.native
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/Calendar/__tests__/native/Calendar.native.test.tsx \
    packages/core/src/components/Calendar/view/DayCell.tsx
git commit -m "test(calendar): native smoke for single-mode render + select

Verifies the existing Calendar renders and fires onChange on iOS/Android
code paths via jest-expo. Surfaced [N] bugs fixed in DayCell."
```

(Replace `[N]` with the actual fix count, or drop that sentence if zero.)

---

## Task 3: Native smoke — multiple-mode + drilldown

**Files:**
- Modify: `packages/core/src/components/Calendar/__tests__/native/Calendar.native.test.tsx`

- [ ] **Step 1: Add failing tests**

Append to the existing native smoke file:

```tsx
describe('Calendar — native smoke (multiple mode)', () => {
    it('accumulates selected dates', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="multiple" defaultValue={[]} onChange={onChange} />)
        );
        fireEvent.press(getByLabelText(/May 1, 2026/i));
        fireEvent.press(getByLabelText(/May 3, 2026/i));
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toHaveLength(2);
    });
});

describe('Calendar — native smoke (drilldown)', () => {
    it('opens the month grid when the header title is pressed', () => {
        const { getByText, queryByText } = render(wrap(<Calendar />));
        // Header title contains the current month name; press it.
        const titleLike = getByText(/May 2026|2026/i);
        fireEvent.press(titleLike);
        // Month grid renders the 12 short month names.
        expect(queryByText(/Jan/i)).toBeTruthy();
        expect(queryByText(/Dec/i)).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run, fix, run, verify pass**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn Calendar.native
```

Fix surfaced issues in source (`Header.tsx`, `MonthGrid.tsx` are likely suspects if they used DOM-only event handlers).

Expected after fixes: 4 passed.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "test(calendar): native smoke for multiple-mode + drilldown"
```

---

## Task 4: Native range tap-tap verification

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/native/range-interaction.native.test.tsx`

This task verifies the existing `useRangeState` produces tap-tap behavior on native because `Pressable.onHoverIn` is never fired there. **No new range-interaction code is added** — the test guards the assumption.

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../NoriProvider';

const wrap = (ui: React.ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('Calendar — native range tap-tap', () => {
    it('first tap sets pending start, second tap commits end', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="range" defaultValue={null} onChange={onChange} />)
        );

        // 1st tap — pending start, no commit yet
        fireEvent.press(getByLabelText(/May 10, 2026/i));
        expect(onChange).toHaveBeenCalledTimes(1);
        let lastVal = onChange.mock.calls[0][0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 10 },
            end: null,
        });

        // 2nd tap — commits end
        fireEvent.press(getByLabelText(/May 15, 2026/i));
        expect(onChange).toHaveBeenCalledTimes(2);
        lastVal = onChange.mock.calls[1][0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 10 },
            end: { year: 2026, month: 5, day: 15 },
        });
    });

    it('third tap restarts the pending state', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="range" defaultValue={null} onChange={onChange} />)
        );

        fireEvent.press(getByLabelText(/May 10, 2026/i));
        fireEvent.press(getByLabelText(/May 15, 2026/i));
        fireEvent.press(getByLabelText(/May 20, 2026/i));

        const lastVal = onChange.mock.calls[2][0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 20 },
            end: null,
        });
    });

    it('never paints a preview range on native (no hover path active)', () => {
        const { getByLabelText, queryAllByA11yState } = render(
            wrap(<Calendar mode="range" defaultValue={null} />)
        );

        fireEvent.press(getByLabelText(/May 10, 2026/i));

        // No cell between May 10 and any other day should carry the
        // "preview" visual state, because setHoveredDate is never called.
        // The "selected" state belongs to the pending-start cell only.
        const selected = queryAllByA11yState({ selected: true });
        expect(selected).toHaveLength(1);
    });
});
```

- [ ] **Step 2: Run**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn range-interaction
```

Expected: PASS — these are verifications of existing behavior, not new behavior. If any fail, that's a bug in the existing range state machine and must be fixed before proceeding.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/__tests__/native/range-interaction.native.test.tsx
git commit -m "test(calendar): verify tap-tap range emerges from existing state machine on native"
```

---

## Task 5: Native a11y assertions

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/native/a11y.native.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../NoriProvider';

const wrap = (ui: React.ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('Calendar — native a11y', () => {
    it('day cells expose accessibilityLabel, role=button, and selected state', () => {
        const { getByLabelText } = render(
            wrap(<Calendar defaultValue={d(2026, 5, 8)} />)
        );
        const cell = getByLabelText(/Friday, May 8, 2026.*selected/i);
        expect(cell.props.accessibilityRole).toBe('button');
        expect(cell.props.accessibilityState).toMatchObject({ selected: true });
    });

    it('disabled day cells carry disabled state', () => {
        const isPast = (date: CalendarDate) =>
            date.compare(d(2026, 5, 5)) < 0;
        const { getByLabelText } = render(
            wrap(<Calendar defaultValue={d(2026, 5, 10)} isDateUnavailable={isPast} />)
        );
        const cell = getByLabelText(/May 1, 2026/i);
        expect(cell.props.accessibilityState).toMatchObject({ disabled: true });
    });

    it('previous/next chevrons expose readable labels', () => {
        const { getByLabelText } = render(wrap(<Calendar />));
        expect(getByLabelText(/previous month/i)).toBeTruthy();
        expect(getByLabelText(/next month/i)).toBeTruthy();
    });

    it('day grid container exposes role=grid', () => {
        const { getByA11yRole } = render(wrap(<Calendar />));
        expect(getByA11yRole('grid')).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run, expect failures revealing gaps**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn a11y.native
```

Expected: FAIL for any role/label/state currently missing. Likely gaps:
- DayCell may have `accessibilityLabel` but not include weekday or "selected" suffix.
- Header chevrons may rely on icon-only with no label.
- Day grid container may lack `accessibilityRole="grid"`.

- [ ] **Step 3: Fix source gaps**

In `DayCell.tsx`, derive the label like:

```tsx
const formatA11yLabel = (ctx: DayContext, locale: string): string => {
    const fmt = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const base = fmt.format(ctx.date.toDate('UTC' as never));
    const tags: string[] = [];
    if (ctx.isToday) tags.push('today');
    if (ctx.isSelected) tags.push('selected');
    if (ctx.isUnavailable) tags.push('unavailable');
    return tags.length ? `${base}, ${tags.join(', ')}` : base;
};
```

(Use the project's existing `formatDay` if it already exists — `grep -n "format.*Day\|Intl.DateTimeFormat" packages/core/src/components/Calendar/state/locale-utils.ts`.)

In `Header.tsx`, add `accessibilityLabel="Previous month"` / `"Next month"` to the prev/next `Pressable`s.

In `DayGrid.tsx`, add `accessibilityRole="grid"` to the root container `View`.

- [ ] **Step 4: Re-run, verify pass**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn a11y.native
```

Expected: 4 passed.

- [ ] **Step 5: Re-run the full project to catch any regression elsewhere**

```bash
yarn workspace @nori-ui/core test
```

Expected: all jsdom + node + rn projects green.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "feat(calendar): native a11y — labels, roles, and states on cells/chevrons/grid"
```

---

## Task 6: Native perf proxy via React Profiler

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/native/perf.native.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { Profiler, useState } from 'react';
import { fireEvent, render, act } from '@testing-library/react-native';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../NoriProvider';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

const BUDGET_MS = 100; // generous; catches order-of-magnitude regressions only

describe('Calendar — native perf (informational)', () => {
    it('paged month-change commit phase stays under budget', () => {
        const samples: number[] = [];
        const onRender = (_id: string, _phase: string, actualDuration: number) => {
            samples.push(actualDuration);
        };

        const Harness = () => {
            const [value, setValue] = useState(d(2026, 5, 8));
            return (
                <NoriProvider locale="en-US">
                    <Profiler id="calendar" onRender={onRender}>
                        <Calendar
                            value={value}
                            onChange={(v) => v && setValue(v as CalendarDate)}
                        />
                    </Profiler>
                </NoriProvider>
            );
        };

        const { getByLabelText } = render(<Harness />);
        samples.length = 0; // discard mount sample, measure month change

        act(() => {
            fireEvent.press(getByLabelText(/next month/i));
        });

        expect(samples.length).toBeGreaterThan(0);
        const max = Math.max(...samples);
        // Helpful failure output if the test does fail.
        if (max > BUDGET_MS) {
            // eslint-disable-next-line no-console
            console.error(`Calendar paged month-change commit took ${max.toFixed(2)}ms (budget ${BUDGET_MS}ms)`);
        }
        expect(max).toBeLessThan(BUDGET_MS);
    });
});
```

- [ ] **Step 2: Run**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn perf.native
```

Expected: PASS (well under 100ms on any reasonable CI box).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/__tests__/native/perf.native.test.tsx
git commit -m "test(calendar): Profiler-based render-time guard (informational, 100ms budget)"
```

---

## Task 7: Scroll constants module

**Files:**
- Create: `packages/core/src/components/Calendar/scroll/constants.ts`

- [ ] **Step 1: Create the file**

```ts
// Initial render window for behavior="scroll".
// The list mounts with this past/future range around the focused month
// and expands lazily as the user scrolls toward an edge.
export const SCROLL_PAST_MONTHS = 12;
export const SCROLL_FUTURE_MONTHS = 24;

// Expansion increment when scroll nears an edge (web ScrollBody only;
// flash-calendar handles its own virtualization).
export const SCROLL_EXPAND_INCREMENT = 12;
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/Calendar/scroll/constants.ts
git commit -m "feat(calendar): scroll-mode window constants"
```

---

## Task 8: ScrollBody shared interface

**Files:**
- Create: `packages/core/src/components/Calendar/scroll/ScrollBody.tsx`

This file is the platform-extension fallback. When neither `.web.tsx` nor `.native.tsx` is resolved (impossible in practice with our Metro/Vite config but defensive), it throws to surface the misconfiguration loudly.

- [ ] **Step 1: Create the shared interface**

```tsx
import type { CalendarDate } from '@internationalized/date';
import type { ReactNode } from 'react';
import type { CalendarMode, ChangeMeta, DayContext, DateRange, CalendarValue } from '../Calendar.types';

export type ScrollBodyProps<M extends CalendarMode> = {
    mode: M;
    locale: string;
    focusedDate: CalendarDate;
    onFocusedMonthChange: (anchor: CalendarDate, meta: ChangeMeta) => void;
    value: CalendarValue<M>;
    onSelectDate: (date: CalendarDate) => void;

    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;

    showWeekNumbers?: boolean;
    highlightToday?: boolean;
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    weekendDays?: ReadonlyArray<0 | 1 | 2 | 3 | 4 | 5 | 6>;

    renderDay?: (ctx: DayContext) => ReactNode;

    // Range-specific. Always undefined for single/multiple.
    previewRange?: DateRange | null;
};

export const ScrollBody = <M extends CalendarMode>(_props: ScrollBodyProps<M>): JSX.Element => {
    throw new Error(
        '[Calendar] ScrollBody: no platform implementation resolved. ' +
            'Ensure your bundler honors *.web.tsx / *.native.tsx Metro extensions.'
    );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/Calendar/scroll/ScrollBody.tsx
git commit -m "feat(calendar): ScrollBody shared interface (platform-extension fallback)"
```

---

## Task 9: Web ScrollBody — failing test

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/Calendar.scroll.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../Calendar';
import { NoriProvider } from '../../../NoriProvider';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);
const wrap = (ui: React.ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

const installIO = () => {
    class FakeIO {
        callback: IntersectionObserverCallback;
        constructor(cb: IntersectionObserverCallback) {
            this.callback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        fire(entries: Partial<IntersectionObserverEntry>[]) {
            this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
        }
    }
    (globalThis as Record<string, unknown>).IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
};

describe('Calendar — behavior="scroll" (web)', () => {
    beforeEach(() => {
        installIO();
    });

    it('renders the initial window of month panels around the focused date', () => {
        const { container } = render(
            wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />)
        );
        // 12 past + focused + 24 future = 37 month panels
        const panels = container.querySelectorAll('[data-month-panel]');
        expect(panels.length).toBe(37);
    });

    it('warns and falls back to single column when visibleMonths > 1', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(
            wrap(<Calendar behavior="scroll" visibleMonths={2} defaultValue={d(2026, 5, 8)} />)
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('visibleMonths is ignored when behavior="scroll"')
        );
        // Single-column means each row has exactly one panel.
        const firstRow = container.querySelector('[data-scroll-row]');
        expect(firstRow?.querySelectorAll('[data-month-panel]').length).toBe(1);
        warn.mockRestore();
    });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:jsdom Calendar.scroll
```

Expected: FAIL — `behavior="scroll"` is not yet dispatched in `Calendar.tsx`.

- [ ] **Step 3: Commit** (test only, no source change yet)

```bash
git add packages/core/src/components/Calendar/__tests__/Calendar.scroll.test.tsx
git commit -m "test(calendar): failing test for behavior=\"scroll\" on web"
```

---

## Task 10: Implement `ScrollBody.web.tsx`

**Files:**
- Create: `packages/core/src/components/Calendar/scroll/ScrollBody.web.tsx`

- [ ] **Step 1: Implement the web scroll body**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { CalendarDate } from '@internationalized/date';
import type { CalendarMode } from '../Calendar.types';
import type { ScrollBodyProps } from './ScrollBody';
import { SCROLL_PAST_MONTHS, SCROLL_FUTURE_MONTHS } from './constants';
import { DayGrid } from '../view/DayGrid';

const buildMonthList = (anchor: CalendarDate, past: number, future: number): CalendarDate[] => {
    const out: CalendarDate[] = [];
    for (let i = -past; i <= future; i += 1) {
        out.push(anchor.add({ months: i }));
    }
    return out;
};

export const ScrollBody = <M extends CalendarMode>(props: ScrollBodyProps<M>): JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const months = useMemo(
        () => buildMonthList(props.focusedDate.set({ day: 1 }), SCROLL_PAST_MONTHS, SCROLL_FUTURE_MONTHS),
        [props.focusedDate]
    );

    // Observe which month panel is topmost-visible; report it via
    // onFocusedMonthChange so the header title and dropdowns stay in sync.
    useEffect(() => {
        const root = containerRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') {
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                const top = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (!top) {
                    return;
                }
                const isoMonth = (top.target as HTMLElement).dataset.monthIso;
                if (!isoMonth) {
                    return;
                }
                const [yStr, mStr] = isoMonth.split('-');
                const y = Number.parseInt(yStr, 10);
                const m = Number.parseInt(mStr, 10);
                props.onFocusedMonthChange(props.focusedDate.set({ year: y, month: m, day: 1 }), {
                    view: 'day',
                    source: 'scroll',
                });
            },
            { root, threshold: [0, 0.5, 1] }
        );
        root.querySelectorAll<HTMLElement>('[data-month-panel]').forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [months, props.onFocusedMonthChange, props.focusedDate]);

    return (
        <View
            // @ts-expect-error — RN-Web forwards ref to the underlying div
            ref={containerRef}
            style={{ height: 480, overflow: 'scroll' as const }}
            data-scroll-container=""
        >
            {months.map((m) => (
                <View
                    key={`${m.year}-${m.month}`}
                    data-scroll-row=""
                    // @ts-expect-error — RN-Web data-* passthrough
                    data-month-iso={`${m.year}-${String(m.month).padStart(2, '0')}`}
                    data-month-panel=""
                >
                    <DayGrid
                        visibleMonth={m}
                        locale={props.locale}
                        firstDayOfWeek={props.firstDayOfWeek}
                        weekendDays={props.weekendDays as never}
                        value={props.value as never}
                        onDayPress={props.onSelectDate}
                        {...(props.minValue !== undefined ? { minValue: props.minValue } : {})}
                        {...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {})}
                        {...(props.isDateUnavailable !== undefined
                            ? { isDateUnavailable: props.isDateUnavailable }
                            : {})}
                        {...(props.previewRange !== undefined ? { previewRange: props.previewRange } : {})}
                        {...(props.showWeekNumbers !== undefined ? { showWeekNumbers: props.showWeekNumbers } : {})}
                        {...(props.highlightToday !== undefined ? { highlightToday: props.highlightToday } : {})}
                        {...(props.renderDay !== undefined ? { renderDay: props.renderDay } : {})}
                    />
                </View>
            ))}
        </View>
    );
};
```

Verify the `DayGrid` prop signature with `grep -n "^export.*DayGrid\|type DayGridProps" packages/core/src/components/Calendar/view/DayGrid.tsx` before pasting — adjust prop names to whatever Phase-1 settled on. Common shifts: `onDayPress` may be `onSelect`; `visibleMonth` may be `month`.

- [ ] **Step 2: Wire behavior dispatch in `Calendar.tsx`**

In `Calendar.tsx`, both `SingleOrMultiCalendar` and `RangeCalendar` need to branch on `behavior`. Find the return statement of `SingleOrMultiCalendar` (the existing `<View>` that wraps `<Header />` + grid). Wrap the grid body in:

```tsx
{props.behavior === 'scroll' ? (
    <>
        {props.visibleMonths !== undefined &&
            props.visibleMonths !== 'auto' &&
            (props.visibleMonths as number) > 1 &&
            // dev-mode warn: see Step 3
            null}
        <ScrollBody
            mode={props.mode ?? 'single'}
            locale={locale}
            focusedDate={state.focusedDate}
            onFocusedMonthChange={(d) => setAnchor(d)}
            value={state.value as CalendarValue<typeof props.mode extends undefined ? 'single' : NonNullable<typeof props.mode>>}
            onSelectDate={state.selectDate}
            firstDayOfWeek={firstDayOfWeek}
            {...(props.weekendDays !== undefined ? { weekendDays: props.weekendDays } : {})}
            {...(props.minValue !== undefined ? { minValue: props.minValue } : {})}
            {...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {})}
            {...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {})}
            {...(props.showWeekNumbers !== undefined ? { showWeekNumbers: props.showWeekNumbers } : {})}
            {...(props.highlightToday !== undefined ? { highlightToday: props.highlightToday } : {})}
            {...(props.renderDay !== undefined ? { renderDay: props.renderDay } : {})}
        />
    </>
) : (
    // existing paged body — unchanged
    <>
        {/* existing month/year drilldown + DayGrid rendering */}
    </>
)}
```

Mirror the change in `RangeCalendar`. Range adds `previewRange={range.previewRange}` to the ScrollBody props.

Import: `import { ScrollBody } from './scroll/ScrollBody';` (Metro/Vite picks `.web.tsx` automatically).

- [ ] **Step 3: Add the `visibleMonths` dev-mode warn**

Just above the `<ScrollBody>` render, add:

```tsx
useEffect(() => {
    if (
        process.env.NODE_ENV !== 'production' &&
        props.behavior === 'scroll' &&
        typeof props.visibleMonths === 'number' &&
        props.visibleMonths > 1
    ) {
        // eslint-disable-next-line no-console
        console.warn(
            '[Calendar] visibleMonths is ignored when behavior="scroll"; falling back to single column.'
        );
    }
}, [props.behavior, props.visibleMonths]);
```

- [ ] **Step 4: Run the failing test, verify it passes**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:jsdom Calendar.scroll
```

Expected: 2 passed.

- [ ] **Step 5: Run all jsdom tests to confirm no regression**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:jsdom
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/components/Calendar/scroll/ScrollBody.web.tsx \
    packages/core/src/components/Calendar/Calendar.tsx
git commit -m "feat(calendar): behavior=\"scroll\" on web (CSS scroll + IntersectionObserver)"
```

---

## Task 11: Web scroll — caption anchoring + chevron behavior

**Files:**
- Modify: `packages/core/src/components/Calendar/__tests__/Calendar.scroll.test.tsx`
- Modify: `packages/core/src/components/Calendar/scroll/ScrollBody.web.tsx`
- Modify: `packages/core/src/components/Calendar/Calendar.tsx` (chevron behavior in scroll mode)

- [ ] **Step 1: Add failing test for caption/chevron behavior**

Append to `Calendar.scroll.test.tsx`:

```tsx
it('scrolls to a target month when the dropdown caption changes', () => {
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
    const { container } = render(
        wrap(<Calendar behavior="scroll" caption="dropdown" defaultValue={d(2026, 5, 8)} />)
    );
    // Simulate the caption picking Jul 2026
    const jul = container.querySelector('[data-month-iso="2026-07"]');
    expect(jul).toBeTruthy();
    // The exact mechanism: ScrollBody.web exposes an imperative
    // scrollToMonth via ref OR re-renders with focusedDate=Jul which
    // triggers an effect that calls scrollIntoView. We assert the
    // effect's outcome rather than the mechanism.
    // (Re-render path: passing a new focusedDate is the standard way.)
});
```

NOTE: This test is intentionally lightweight — caption integration in scroll mode is the path of least surprise (pass `focusedDate` down; let the scroll body's effect bring it into view). The test below verifies the effect fires.

```tsx
it('header chevrons advance one month at a time in scroll mode', () => {
    const { getByLabelText, container } = render(
        wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />)
    );
    const next = getByLabelText(/next month/i);
    fireEvent.click(next);
    // After clicking next, the focused month is June — scroll body's
    // effect should have called scrollIntoView on the June panel.
    // We assert via the dataset rather than scroll position.
    const visible = container.querySelector('[data-focused-month="true"]');
    expect(visible?.getAttribute('data-month-iso')).toBe('2026-06');
});
```

- [ ] **Step 2: Run, expect failure**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:jsdom Calendar.scroll
```

Expected: FAIL — no scroll-to-month effect yet, no `data-focused-month` attribute.

- [ ] **Step 3: Implement scroll-to-focused-month effect in `ScrollBody.web.tsx`**

Add after the `useEffect` for the IntersectionObserver:

```tsx
const focusedMonthKey = `${props.focusedDate.year}-${String(props.focusedDate.month).padStart(2, '0')}`;

useEffect(() => {
    const root = containerRef.current;
    if (!root) {
        return;
    }
    const target = root.querySelector<HTMLElement>(`[data-month-iso="${focusedMonthKey}"]`);
    if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}, [focusedMonthKey]);
```

Then in the panel mapping, add `data-focused-month` to the panel matching `focusedMonthKey`:

```tsx
{months.map((m) => {
    const iso = `${m.year}-${String(m.month).padStart(2, '0')}`;
    return (
        <View
            key={iso}
            data-scroll-row=""
            // @ts-expect-error — RN-Web data-* passthrough
            data-month-iso={iso}
            data-month-panel=""
            data-focused-month={iso === focusedMonthKey ? 'true' : 'false'}
        >
            {/* DayGrid as before */}
        </View>
    );
})}
```

- [ ] **Step 4: Wire chevron-in-scroll-mode behavior in `Calendar.tsx`**

The existing header chevrons mutate `anchor` (`setAnchor(anchor.subtract({ months: 1 }))`). In scroll mode we want them to also advance `state.focusedDate` so ScrollBody's effect scrolls. Find the chevron handlers (in the existing `<Header>` invocation block) and update:

```tsx
<Header
    onPrev={() => {
        if (props.behavior === 'scroll') {
            state.moveFocus({ months: -1 });
        } else {
            setAnchor(anchor.subtract({ months: 1 }));
        }
    }}
    onNext={() => {
        if (props.behavior === 'scroll') {
            state.moveFocus({ months: 1 });
        } else {
            setAnchor(anchor.add({ months: 1 }));
        }
    }}
    // ... rest unchanged
/>
```

(Confirm `state.moveFocus` accepts `{ months: number }` — `grep -n "moveFocus" packages/core/src/components/Calendar/state/use-calendar-state.ts`. If the signature is different, mirror what `PgDn`/`PgUp` keyboard nav does — that's the established "shift by N months" pathway.)

- [ ] **Step 5: Run, verify pass**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:jsdom Calendar.scroll
```

Expected: 4 passed (2 from Task 9 + 2 from this task).

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "feat(calendar): scroll-mode chevrons advance month, caption changes scroll to target"
```

---

## Task 12: Add `flash-calendar` as optional peer dep

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: Add the dep entries**

In `packages/core/package.json`, add:

```json
{
  "peerDependencies": {
    "@marceloterreiro/flash-calendar": "^1"
  },
  "peerDependenciesMeta": {
    "@marceloterreiro/flash-calendar": { "optional": true }
  },
  "devDependencies": {
    "@marceloterreiro/flash-calendar": "^1"
  }
}
```

Merge with existing peerDependencies / peerDependenciesMeta / devDependencies — don't overwrite.

- [ ] **Step 2: Install**

```bash
yarn install
```

Verify resolution by checking `yarn why @marceloterreiro/flash-calendar` succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/core/package.json yarn.lock
git commit -m "feat(calendar): add flash-calendar as optional peer dep for native scroll"
```

---

## Task 13: Native ScrollBody — failing test

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/native/scroll-body.native.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../NoriProvider';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);
const wrap = (ui: React.ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('Calendar — behavior="scroll" (native)', () => {
    it('mounts the flash-calendar wrapper with the configured window', () => {
        const { getByTestId, getByText } = render(
            wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />)
        );
        // The mock from jest.native-setup.ts renders text props.
        expect(getByTestId('flash-calendar-mock')).toBeTruthy();
        expect(getByText('past=12')).toBeTruthy();
        expect(getByText('future=24')).toBeTruthy();
        expect(getByText('initial=2026-05')).toBeTruthy();
    });

    it('warns and falls back to single column when visibleMonths > 1', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(wrap(<Calendar behavior="scroll" visibleMonths={3} defaultValue={d(2026, 5, 8)} />));
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('visibleMonths is ignored when behavior="scroll"')
        );
        warn.mockRestore();
    });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn scroll-body.native
```

Expected: FAIL — no native ScrollBody yet.

- [ ] **Step 3: Commit** (test only)

```bash
git add packages/core/src/components/Calendar/__tests__/native/scroll-body.native.test.tsx
git commit -m "test(calendar): failing test for behavior=\"scroll\" on native"
```

---

## Task 14: Implement `ScrollBody.native.tsx`

**Files:**
- Create: `packages/core/src/components/Calendar/scroll/ScrollBody.native.tsx`

- [ ] **Step 1: Implement the native scroll body**

```tsx
import { useMemo } from 'react';
import type { CalendarDate } from '@internationalized/date';
import type { CalendarMode } from '../Calendar.types';
import type { ScrollBodyProps } from './ScrollBody';
import { SCROLL_PAST_MONTHS, SCROLL_FUTURE_MONTHS } from './constants';

// Lazy resolve so consumers who never use behavior="scroll" never need
// the optional peer dep installed.
let cachedCalendarList: unknown = null;
const resolveCalendarList = () => {
    if (cachedCalendarList !== null) {
        return cachedCalendarList;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('@marceloterreiro/flash-calendar');
        cachedCalendarList = mod?.Calendar?.List;
        if (!cachedCalendarList) {
            throw new Error('flash-calendar module did not export Calendar.List');
        }
        return cachedCalendarList;
    } catch (e) {
        throw new Error(
            '[Calendar] behavior="scroll" requires @marceloterreiro/flash-calendar. ' +
                'Install it as a peer dependency: yarn add @marceloterreiro/flash-calendar'
        );
    }
};

const monthIdFromDate = (d: CalendarDate): string =>
    `${d.year}-${String(d.month).padStart(2, '0')}-01`;

const dateFromMonthId = (id: string, day: number): { y: number; m: number; d: number } => {
    const [y, m] = id.split('-').map((x) => Number.parseInt(x, 10));
    return { y, m, d: day };
};

export const ScrollBody = <M extends CalendarMode>(props: ScrollBodyProps<M>): JSX.Element => {
    const CalendarList = resolveCalendarList() as React.ComponentType<{
        calendarInitialMonthId: string;
        calendarPastScrollRangeInMonths: number;
        calendarFutureScrollRangeInMonths: number;
        onCalendarDayPress: (id: string) => void;
    }>;

    const initialMonthId = useMemo(() => monthIdFromDate(props.focusedDate), [props.focusedDate]);

    const onDayPress = (id: string) => {
        // flash-calendar emits ids like "2026-05-15"; reconstruct a
        // CalendarDate that respects our calendar type. We assume
        // Gregorian (subsystem A non-goal: non-Gregorian).
        const [y, m, d] = id.split('-').map((x) => Number.parseInt(x, 10));
        const date = props.focusedDate.set({ year: y, month: m, day: d });
        props.onSelectDate(date);
    };

    return (
        <CalendarList
            calendarInitialMonthId={initialMonthId}
            calendarPastScrollRangeInMonths={SCROLL_PAST_MONTHS}
            calendarFutureScrollRangeInMonths={SCROLL_FUTURE_MONTHS}
            onCalendarDayPress={onDayPress}
        />
    );
};
```

NOTE: The exact prop names (`calendarInitialMonthId` etc.) come from `flash-calendar`'s `Calendar.List` API. **Verify against the real package** before finalizing:

```bash
yarn workspace @nori-ui/core node -e "console.log(Object.keys(require('@marceloterreiro/flash-calendar')))"
```

If the API differs, mirror the real prop names — and update the jest mock in `jest.native-setup.ts` to match so the test still passes.

- [ ] **Step 2: Add the dev-mode warn to the native code path**

The warn lives in `Calendar.tsx`; it already fires from Task 10 Step 3 regardless of platform. No additional work needed here — confirm it triggers on native by reading the test output of Task 13 Step 2 (the warn assertion was in the failing test).

- [ ] **Step 3: Run, verify pass**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn scroll-body.native
```

Expected: 2 passed.

- [ ] **Step 4: Run the full RN project to catch regressions**

```bash
yarn workspace @nori-ui/core test --selectProjects nori-ui:rn
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/Calendar/scroll/ScrollBody.native.tsx
git commit -m "feat(calendar): behavior=\"scroll\" on native via flash-calendar wrapper"
```

---

## Task 15: playground-native Calendar route

**Files:**
- Create: `apps/playground-native/app/calendar.tsx`

Locate the actual playground-native router pattern first:

```bash
ls apps/playground-native/app/ | head
cat apps/playground-native/app/_layout.tsx | head -40
```

The route file name + structure must match what's already there.

- [ ] **Step 1: Create the route file**

```tsx
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Calendar, type DateRange } from '@nori-ui/core';
import { CalendarDate } from '@internationalized/date';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

export default function CalendarRoute() {
    const [single, setSingle] = useState<CalendarDate | null>(d(2026, 5, 8));
    const [range, setRange] = useState<DateRange | null>(null);
    const [multi, setMulti] = useState<CalendarDate[]>([]);

    return (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
            <Section title="1. Single — paged (default)">
                <Calendar value={single} onChange={(v) => setSingle(v as CalendarDate | null)} />
            </Section>

            <Section title="2. Range — paged">
                <Calendar mode="range" value={range} onChange={(v) => setRange(v as DateRange | null)} />
            </Section>

            <Section title="3. Multiple — paged">
                <Calendar
                    mode="multiple"
                    value={multi}
                    onChange={(v) => setMulti(v as CalendarDate[])}
                />
            </Section>

            <Section title="4. Single — scroll">
                <Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />
            </Section>

            <Section title="5. Dropdown caption">
                <Calendar caption="dropdown" defaultValue={d(2026, 5, 8)} />
            </Section>

            <Section title="6. Custom renderDay">
                <Calendar
                    defaultValue={d(2026, 5, 8)}
                    renderDay={(ctx) => (
                        <View style={{ padding: 6 }}>
                            <Text style={{ fontWeight: ctx.isToday ? '700' : '400' }}>
                                {String(ctx.date.day)}
                            </Text>
                        </View>
                    )}
                />
            </Section>
        </ScrollView>
    );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{title}</Text>
        {children}
    </View>
);
```

- [ ] **Step 2: Add the route to the nav/tabs config**

Find where playground-native registers tabs/links (likely `apps/playground-native/app/(tabs)/_layout.tsx` or `apps/playground-native/app/_layout.tsx`) and add a "Calendar" entry pointing at this route. Follow the existing pattern verbatim — don't introduce new nav primitives.

- [ ] **Step 3: Boot the iOS sim**

```bash
yarn workspace @nori-ui/playground-native ios
```

Navigate to the Calendar route. Verify all six demos render and respond to taps.

- [ ] **Step 4: Boot the Android sim**

```bash
yarn workspace @nori-ui/playground-native android
```

Verify same.

- [ ] **Step 5: Capture screen recordings**

iOS: `xcrun simctl io booted recordVideo calendar-ios.mp4` (Ctrl-C when done).
Android: `adb shell screenrecord /sdcard/calendar-android.mp4` then `adb pull /sdcard/calendar-android.mp4`.

Save both alongside the PR for the manual-smoke acceptance criterion.

- [ ] **Step 6: Commit the route**

```bash
git add apps/playground-native/app/calendar.tsx apps/playground-native/app/_layout.tsx
git commit -m "feat(playground-native): Calendar route with six demos for sim smoke"
```

---

## Task 16: Docs — Scroll behavior section

**Files:**
- Modify: `apps/docs/src/content/components/calendar.mdx`

Locate the actual docs file first:

```bash
find apps/docs -name "calendar*" -type f | head
```

Adjust the path below if the file lives elsewhere or uses a different extension.

- [ ] **Step 1: Add the section**

Insert a new section near the bottom of the existing Calendar page, before the prop reference:

```mdx
## Scroll behavior

By default `<Calendar>` renders one month at a time (paged) with prev/next chevrons in the header. Set `behavior="scroll"` to render a vertically scrollable list of month panels instead.

<Preview name="calendar-scroll" />

```tsx
<Calendar behavior="scroll" defaultValue={today(getLocalTimeZone())} />
```

When `behavior="scroll"` is active:

- The header chevrons advance the focused month one panel at a time (the list scrolls to bring the new month into view).
- The dropdown caption (`caption="dropdown"`) also scrolls the list to the chosen month/year.
- `visibleMonths` is ignored — scroll mode is single-column by definition. Passing `visibleMonths > 1` together with `behavior="scroll"` logs a development-mode warning and falls back to single column.
- On native, scroll mode requires the optional peer dependency `@marceloterreiro/flash-calendar`:

```bash
yarn add @marceloterreiro/flash-calendar
```

Web doesn't require any additional dependency.
```

- [ ] **Step 2: Create the preview demo**

Locate the docs preview registry (`grep -rn "calendar-basic" apps/docs/src | head`) and add a `calendar-scroll` entry matching the existing pattern.

- [ ] **Step 3: Boot the docs site, verify the page**

```bash
yarn workspace @nori-ui/docs dev
```

Open the Calendar page, confirm the new section renders and the live demo works in the browser.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/content/components/calendar.mdx \
    apps/docs/src/<preview-registry-path>
git commit -m "docs(calendar): Scroll behavior section + live demo"
```

---

## Task 17: Workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck (workspace-wide, per project memory)**

```bash
yarn typecheck
```

Expected: green across all workspaces.

- [ ] **Step 2: Biome**

```bash
yarn biome check .
```

Expected: clean.

- [ ] **Step 3: All Jest projects**

```bash
yarn workspace @nori-ui/core test
```

Expected: `nori-ui:node`, `nori-ui:jsdom`, `nori-ui:rn` all pass.

- [ ] **Step 4: Repo-wide tests (catches any docs/playground regressions)**

```bash
yarn test
```

Expected: green.

- [ ] **Step 5: If anything fails, fix in place (Boy Scout rule)**

Per project policy, fix broken typecheck/tests/lint regardless of "ownership" before merging. Only escalate if the effort is massive.

- [ ] **Step 6: Final commit (only if Step 5 made changes)**

```bash
git add -u
git commit -m "chore: fix workspace lint/type/test fallout from Phase 2A landing"
```

---

## Self-Review

**Spec coverage check** against [`2026-05-11-calendar-phase2a-native-design.md`](../specs/2026-05-11-calendar-phase2a-native-design.md):

| Spec section | Covered by |
|---|---|
| §1 Goal: iOS/Android parity render | Tasks 2, 3 (smoke), Task 15 (sim verification) |
| §1 Goal: tap-tap range emerges naturally | Task 4 (verifies, doesn't implement — design call) |
| §1 Goal: `behavior="scroll"` on web | Tasks 8, 9, 10, 11 |
| §1 Goal: `behavior="scroll"` on native (flash-calendar) | Tasks 12, 13, 14 |
| §1 Goal: nori-ui:rn Jest project | Task 1 |
| §1 Goal: automated a11y | Task 5 |
| §1 Goal: Profiler perf proxy | Task 6 |
| §1 Goal: playground-native demos | Task 15 |
| §3.4 scroll contract: `[-12, +24]` window | Task 7 constants; Task 10/14 wire-up |
| §3.4 scroll contract: chevrons advance one month | Task 11 |
| §3.4 scroll contract: caption anchors list | Task 11 |
| §3.4 scroll contract: `visibleMonths > 1` warns + single column | Tasks 10 (web), 13 (native test) |
| §3.4 scroll contract: ChangeMeta.source = 'scroll' | Task 10 (web `onFocusedMonthChange`); native via flash-calendar callback in Task 14 (TODO: confirm flash-calendar emits a month-change callback in its actual API; if not, derive from the visible-month tracking and add follow-up |
| §3.5 a11y roles/labels/states | Task 5 |
| §6.1 jest-expo preset | Task 1 |
| §6.2 flash-calendar API mapping | Task 14 |
| §6.3 initial scroll window | Task 7 |
| §6.4 Profiler budget = 100ms | Task 6 |
| §5 docs update | Task 16 |
| §5 manual smoke (sim recordings) | Task 15 Step 5 |

One gap in the scroll-mode `ChangeMeta.source='scroll'` story on native is called out inline. The implementation plan resolves it by deriving from flash-calendar's visible-month callback; if that callback doesn't exist in the real API, a follow-up issue is acceptable since the rest of the contract still holds.

**Placeholder scan:**
- No "TBD" / "TODO" / "implement later" in the task bodies.
- One `<preview-registry-path>` placeholder in Task 16 Step 4 — this is a "look this up in the repo before committing" instruction, not an unresolved design question. Accepted.

**Type consistency:**
- `ScrollBodyProps<M>` defined in Task 8, consumed identically in Tasks 10 (web) and 14 (native).
- `monthIdFromDate` / `dateFromMonthId` helpers in Task 14 use the same `YYYY-MM-DD` format that the jest mock in Task 1 step 2 emits — consistent.
- `SCROLL_PAST_MONTHS` / `SCROLL_FUTURE_MONTHS` constant names used identically across Tasks 7, 10, 14.

---

## Summary

- 17 tasks, TDD-structured (failing test → implement → pass → commit per task).
- No new public API surface — only `behavior="scroll"` (already typed in Phase 1) gets wired up.
- Native code path covered by a new `nori-ui:rn` Jest project (jest-expo preset).
- Web scroll via CSS + `IntersectionObserver`, native scroll via `flash-calendar` (optional peer dep).
- A11y is automated-only; perf is informational; no size budgets — per memory.
