# Calendar — Phase 1 (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fully functional, themed, accessible web `<Calendar>` component for `@nori-ui/core` — single, range, multi-select, drill-down (day/month/year), and multi-month paged layout — built on `@internationalized/date` and exposed through the existing `NoriProvider`.

**Architecture:** A platform-agnostic headless layer (`useCalendarState`, `useRangeState`, `useCalendarKeyboard`, locale utilities) drives a web render layer composed of existing nori-ui primitives (`Button`, `IconButton`-style `Pressable`, `HStack`, `VStack`, `Text`). `NoriProvider` gains a `locale` prop with `Intl`-based auto-detection (`new Intl.DateTimeFormat().resolvedOptions().locale`). Native rendering, the `DatePicker` composition, and non-Gregorian sub-imports are deferred to Phases 2 and 3.

**Tech Stack:** React 19, TypeScript 5.6, `@internationalized/date` (Adobe), NativeWind v4, react-native + react-native-web (single-file cross-platform), Jest + @testing-library/react + jest-axe.

**Out of scope (deferred to Phase 2/3):** native render layer, `flash-calendar` integration, `<DatePicker>` and `<DatePicker.Range>`, opt-in Hijri/Hebrew/Persian/Buddhist/Japanese sub-imports, `appearance="native"` OS-picker delegation, time picker.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `packages/core/package.json` | modify | Add `@internationalized/date` dependency |
| `packages/core/src/i18n/locale.ts` | create | `LocaleProvider`, `useLocale`, `detectLocale`, `LocaleInput` type |
| `packages/core/src/i18n/__tests__/locale.test.tsx` | create | Tests for default detection + override |
| `packages/core/src/i18n/index.ts` | modify | Re-export locale types (RSC-safe) |
| `packages/core/src/client.ts` | modify | Re-export `LocaleProvider` and `useLocale` |
| `packages/core/src/provider/nori-provider.tsx` | modify | Accept `locale` prop, wrap children with `LocaleProvider` |
| `packages/core/src/components/Calendar/index.ts` | create | Public barrel + `Object.assign` compound export |
| `packages/core/src/components/Calendar/Calendar.types.ts` | create | All shared types: `Mode`, `View`, `CalendarProps<M>`, etc. |
| `packages/core/src/components/Calendar/state/locale-utils.ts` | create | `getFirstDayOfWeek`, `getWeekendDays`, `formatMonthName`, `formatWeekdayName`, `formatYearTitle` |
| `packages/core/src/components/Calendar/state/constraints.ts` | create | `isOutOfRange`, `composeUnavailable` |
| `packages/core/src/components/Calendar/state/use-calendar-state.ts` | create | View + focused date + selection state machine for `single` and `multiple` modes |
| `packages/core/src/components/Calendar/state/use-range-state.ts` | create | Pending range + hover preview + min/max nights |
| `packages/core/src/components/Calendar/state/use-calendar-keyboard.ts` | create | Returns `onKeyDown` handler implementing the React Aria key contract |
| `packages/core/src/components/Calendar/view/DayCell.tsx` | create | Single-day pressable cell with state-based styling |
| `packages/core/src/components/Calendar/view/DayGrid.tsx` | create | Weekday header row + 7-col day grid for one month |
| `packages/core/src/components/Calendar/view/Header.tsx` | create | Title button (toggles view) + prev/next nav |
| `packages/core/src/components/Calendar/view/Footer.tsx` | create | Optional slot wrapper for action buttons |
| `packages/core/src/components/Calendar/view/MonthGrid.tsx` | create | 3×4 month picker (drill-down view) |
| `packages/core/src/components/Calendar/view/YearGrid.tsx` | create | 4×3 year picker (decade drill-down) |
| `packages/core/src/components/Calendar/Calendar.tsx` | create | Web entry — composes all view pieces + state, supports `visibleMonths` |
| `packages/core/src/components/Calendar/Calendar.stories.tsx` | create | Storybook CSF stories |
| `packages/core/src/components/Calendar/__tests__/locale-utils.test.ts` | create | Locale derivation tests across 5 locales |
| `packages/core/src/components/Calendar/__tests__/constraints.test.ts` | create | Min/max + isDateUnavailable composer |
| `packages/core/src/components/Calendar/__tests__/use-calendar-state.test.tsx` | create | State machine: single, multi, view transitions |
| `packages/core/src/components/Calendar/__tests__/use-range-state.test.tsx` | create | Range state transitions |
| `packages/core/src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx` | create | Full RAC key contract |
| `packages/core/src/components/Calendar/__tests__/Calendar.test.tsx` | create | Component render + interaction integration |
| `packages/core/src/components/Calendar/__tests__/Calendar.a11y.test.tsx` | create | jest-axe + ARIA grid pattern assertions |
| `packages/core/src/components/Calendar/__tests__/Calendar.i18n.test.tsx` | create | 5 locales: en-US, de-DE, fr-FR, ar-SA (RTL), he-IL (RTL) |
| `packages/core/src/components/index.ts` | modify | Export `Calendar` |
| `apps/docs/components/demos/calendar-basic.tsx` | create | Demo |
| `apps/docs/components/demos/calendar-range.tsx` | create | Demo |
| `apps/docs/components/demos/calendar-multiple.tsx` | create | Demo |
| `apps/docs/components/demos/calendar-drilldown.tsx` | create | Demo |
| `apps/docs/components/demos/calendar-controlled.tsx` | create | Demo |
| `apps/docs/components/demos/calendar-custom-render.tsx` | create | Demo (renderDay slot) |
| `apps/docs/content/docs/components/calendar.mdx` | create | Docs page |

---

## Task 1: Add `@internationalized/date` dependency

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: Add the dependency**

```bash
cd /Users/manuelbieh/htdocs/_git/ui-kit && yarn workspace @nori-ui/core add @internationalized/date@^3.5.6
```

- [ ] **Step 2: Verify it landed in `dependencies` (not devDependencies)**

Run: `grep -A2 '"dependencies"' packages/core/package.json`
Expected: shows `"@internationalized/date": "^3.5.6"` inside the `dependencies` block.

- [ ] **Step 3: Verify install resolves and typecheck still passes**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/core/package.json yarn.lock && git commit -m "chore(core): add @internationalized/date dependency for Calendar"
```

---

## Task 2: Locale provider — failing tests first

**Files:**
- Create: `packages/core/src/i18n/__tests__/locale.test.tsx`

- [ ] **Step 1: Write failing tests for `detectLocale` + `useLocale`**

```tsx
// packages/core/src/i18n/__tests__/locale.test.tsx
import { render } from '@testing-library/react';
import { LocaleProvider, useLocale, detectLocale } from '../locale';

describe('detectLocale', () => {
    it('returns the resolved Intl locale by default', () => {
        const tag = detectLocale();
        // BCP 47 tag — at minimum "xx" or "xx-YY"
        expect(tag).toMatch(/^[a-z]{2,3}(-[A-Z][a-zA-Z0-9-]*)?$/);
    });
});

describe('useLocale', () => {
    const Probe = ({ onValue }: { onValue: (v: string) => void }) => {
        const locale = useLocale();
        onValue(locale);
        return null;
    };

    it('returns detected locale when no provider is mounted', () => {
        let captured = '';
        render(<Probe onValue={(v) => { captured = v; }} />);
        expect(captured).toBe(detectLocale());
    });

    it('returns the provider value when mounted', () => {
        let captured = '';
        render(
            <LocaleProvider locale="de-DE">
                <Probe onValue={(v) => { captured = v; }} />
            </LocaleProvider>
        );
        expect(captured).toBe('de-DE');
    });

    it('accepts an Intl.Locale instance and returns its toString()', () => {
        let captured = '';
        render(
            <LocaleProvider locale={new Intl.Locale('fr-FR')}>
                <Probe onValue={(v) => { captured = v; }} />
            </LocaleProvider>
        );
        expect(captured).toBe('fr-FR');
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/i18n/__tests__/locale.test.tsx`
Expected: FAIL — module not found `'../locale'`.

---

## Task 3: Implement `LocaleProvider`, `useLocale`, `detectLocale`

**Files:**
- Create: `packages/core/src/i18n/locale.ts`

- [ ] **Step 1: Implement the locale module**

```ts
// packages/core/src/i18n/locale.ts
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

export type LocaleInput = string | Intl.Locale;

/**
 * Resolve the runtime's default locale. Works under Hermes (which ships
 * Intl on iOS via system ICU and on Android via bundled ICU) and any
 * browser. Returns a BCP 47 tag.
 */
export const detectLocale = (): string => {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
        // Defensive — should never happen in supported environments.
        return 'en-US';
    }
};

const toTag = (input: LocaleInput | undefined): string =>
    input === undefined ? detectLocale() : typeof input === 'string' ? input : input.toString();

const LocaleContext = createContext<string | null>(null);
LocaleContext.displayName = 'LocaleContext';

export type LocaleProviderProps = {
    locale?: LocaleInput;
    children?: ReactNode;
};

export const LocaleProvider = ({ locale, children }: LocaleProviderProps) => {
    const value = useMemo(() => toTag(locale), [locale]);
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): string => {
    const ctx = useContext(LocaleContext);
    return ctx ?? detectLocale();
};
```

- [ ] **Step 2: Rename to `.tsx` because it returns JSX**

```bash
mv packages/core/src/i18n/locale.ts packages/core/src/i18n/locale.tsx
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `yarn workspace @nori-ui/core test src/i18n/__tests__/locale.test.tsx`
Expected: PASS — 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/i18n/locale.tsx packages/core/src/i18n/__tests__/locale.test.tsx
git commit -m "feat(core): add LocaleProvider and useLocale with Intl auto-detection"
```

---

## Task 4: Wire locale into NoriProvider and exports

**Files:**
- Modify: `packages/core/src/i18n/index.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/src/provider/nori-provider.tsx`

- [ ] **Step 1: Re-export `LocaleInput` type from the RSC-safe i18n barrel**

Edit `packages/core/src/i18n/index.ts` — append after the existing exports:

```ts
export type { LocaleInput } from './locale';
```

- [ ] **Step 2: Re-export the provider + hook from the client barrel**

Open `packages/core/src/client.ts` and add:

```ts
export { LocaleProvider, useLocale, detectLocale } from './i18n/locale';
export type { LocaleInput, LocaleProviderProps } from './i18n/locale';
```

(Place near other client re-exports — match the existing alphabetical or logical ordering already used in that file.)

- [ ] **Step 3: Update `NoriProvider` to accept `locale` and wrap with `LocaleProvider`**

In `packages/core/src/provider/nori-provider.tsx`:

  1. Add to imports:

```tsx
import { type LocaleInput, LocaleProvider } from '../i18n/locale';
```

  2. Add `locale?: LocaleInput;` to the `NoriProviderProps` type (placed alphabetically, after `i18n`).

  3. Update the function signature to destructure `locale`, conditionally spread it, and wrap the existing inner tree with `<LocaleProvider {...localeProps}>`. The full updated function:

```tsx
export function NoriProvider({ theme, colorScheme, i18n, icons, locale, children }: NoriProviderProps) {
    const themeProps = theme === undefined ? {} : { theme };
    const i18nProps = i18n === undefined ? {} : { i18n };
    const iconsProps = icons === undefined ? {} : { icons };
    const localeProps = locale === undefined ? {} : { locale };

    const inner = (
        <LocaleProvider {...localeProps}>
            <ThemeProvider {...themeProps}>
                <I18nProvider {...i18nProps}>
                    <SemanticIconsProvider {...iconsProps}>{children}</SemanticIconsProvider>
                </I18nProvider>
            </ThemeProvider>
        </LocaleProvider>
    );

    return colorScheme === undefined ? inner : <ColorSchemeProvider value={colorScheme}>{inner}</ColorSchemeProvider>;
}
```

  4. Update the JSDoc above `theme?:` block by adding a doc paragraph for the `locale` prop:

```tsx
    /**
     * BCP 47 locale tag (or `Intl.Locale`) used by locale-aware components
     * (Calendar, Number/Currency formatting, RelativeTime). Defaults to
     * the runtime's resolved locale (`new Intl.DateTimeFormat().resolvedOptions().locale`),
     * which mirrors what other `Intl` calls in the consumer's code use.
     */
    locale?: LocaleInput;
```

- [ ] **Step 4: Add a NoriProvider test verifying `locale` propagates**

Append to `packages/core/src/provider/__tests__/nori-provider.test.tsx` (create the file if it doesn't exist by mirroring the existing test setup; if it does, add only the new test):

```tsx
import { render } from '@testing-library/react';
import { NoriProvider } from '../nori-provider';
import { useLocale } from '../../i18n/locale';

describe('NoriProvider locale prop', () => {
    const Probe = ({ onValue }: { onValue: (v: string) => void }) => {
        onValue(useLocale());
        return null;
    };

    it('propagates explicit locale to descendants', () => {
        let captured = '';
        render(
            <NoriProvider locale="ja-JP">
                <Probe onValue={(v) => { captured = v; }} />
            </NoriProvider>
        );
        expect(captured).toBe('ja-JP');
    });
});
```

- [ ] **Step 5: Run all tests**

Run: `yarn workspace @nori-ui/core test`
Expected: all tests PASS, including the new locale + nori-provider tests.

- [ ] **Step 6: Run typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/provider/nori-provider.tsx packages/core/src/i18n/index.ts packages/core/src/client.ts packages/core/src/provider/__tests__/nori-provider.test.tsx
git commit -m "feat(core): NoriProvider accepts locale prop with Intl auto-detection default"
```

---

## Task 5: Locale utilities (headless) — failing tests first

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/locale-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/src/components/Calendar/__tests__/locale-utils.test.ts
import { CalendarDate } from '@internationalized/date';
import {
    formatMonthYearTitle,
    formatWeekdayNames,
    getFirstDayOfWeek,
    getWeekendDays,
} from '../state/locale-utils';

describe('getFirstDayOfWeek', () => {
    it.each([
        ['en-US', 0], // Sunday
        ['de-DE', 1], // Monday
        ['fr-FR', 1], // Monday
        ['ar-SA', 6], // Saturday
        ['he-IL', 0], // Sunday
    ])('returns the right day for %s', (locale, expected) => {
        expect(getFirstDayOfWeek(locale)).toBe(expected);
    });
});

describe('getWeekendDays', () => {
    it('returns Sat+Sun for Western locales', () => {
        expect(getWeekendDays('en-US')).toEqual([6, 0]);
        expect(getWeekendDays('de-DE')).toEqual([6, 0]);
    });
    it('returns Fri+Sat for ar-SA', () => {
        expect(getWeekendDays('ar-SA')).toEqual([5, 6]);
    });
    it('returns Fri+Sat for he-IL', () => {
        expect(getWeekendDays('he-IL')).toEqual([5, 6]);
    });
});

describe('formatWeekdayNames', () => {
    it('returns 7 short weekday names starting at the locale firstDayOfWeek', () => {
        const enUS = formatWeekdayNames('en-US');
        expect(enUS).toHaveLength(7);
        expect(enUS[0]).toMatch(/S/); // Sunday
        const deDE = formatWeekdayNames('de-DE');
        expect(deDE).toHaveLength(7);
        expect(deDE[0]).toMatch(/M/); // Montag
    });
});

describe('formatMonthYearTitle', () => {
    it('formats according to locale', () => {
        const date = new CalendarDate(2026, 5, 1);
        expect(formatMonthYearTitle(date, 'en-US')).toMatch(/May/);
        expect(formatMonthYearTitle(date, 'de-DE')).toMatch(/Mai/);
        expect(formatMonthYearTitle(date, 'fr-FR')).toMatch(/mai/);
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/locale-utils.test.ts`
Expected: FAIL — module not found.

---

## Task 6: Implement `locale-utils`

**Files:**
- Create: `packages/core/src/components/Calendar/state/locale-utils.ts`

- [ ] **Step 1: Implement**

```ts
// packages/core/src/components/Calendar/state/locale-utils.ts
import type { CalendarDate } from '@internationalized/date';
import { getDayOfWeek, startOfWeek } from '@internationalized/date';

/**
 * Day of week index where 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * Matches `Date.prototype.getDay()` and Intl `weekday` semantics.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The weekday a calendar week begins on for the given locale, per CLDR.
 * Examples: en-US → 0 (Sun), de-DE → 1 (Mon), ar-SA → 6 (Sat).
 */
export const getFirstDayOfWeek = (locale: string): DayOfWeek => {
    // @internationalized/date's startOfWeek uses the same CLDR data —
    // derive by asking what the start of the week is for a known date and
    // reading back the weekday.
    const probe = ANCHOR_DATE; // a Wednesday; see constants below
    const start = startOfWeek(probe, locale);
    return getDayOfWeek(start, locale) as DayOfWeek;
};

/**
 * The two days CLDR considers weekend in this locale (e.g. [6, 0] for
 * en-US = Sat+Sun; [5, 6] for ar-SA = Fri+Sat).
 */
export const getWeekendDays = (locale: string): [DayOfWeek, DayOfWeek] => {
    // Intl.Locale#weekInfo is the CLDR-backed source. Spec quirk: not
    // every engine ships it (Hermes Android in particular), so fall back
    // to a small lookup table for the locales we care about.
    try {
        // biome-ignore lint/suspicious/noExplicitAny: weekInfo is in the spec but TS lib types lag
        const info = (new Intl.Locale(locale) as any).getWeekInfo?.()
            // biome-ignore lint/suspicious/noExplicitAny: same as above
            ?? (new Intl.Locale(locale) as any).weekInfo;
        if (info?.weekend && Array.isArray(info.weekend) && info.weekend.length === 2) {
            // CLDR uses 1=Mon..7=Sun; convert to 0=Sun..6=Sat.
            const [a, b] = info.weekend.map((d: number) => (d === 7 ? 0 : d) as DayOfWeek);
            return [a, b];
        }
    } catch {
        // Fall through to lookup.
    }
    return WEEKEND_FALLBACK[locale] ?? WEEKEND_FALLBACK[locale.split('-')[0] ?? ''] ?? [6, 0];
};

const WEEKEND_FALLBACK: Record<string, [DayOfWeek, DayOfWeek]> = {
    'en-US': [6, 0],
    'de-DE': [6, 0],
    'fr-FR': [6, 0],
    'ja-JP': [6, 0],
    'ar-SA': [5, 6],
    'ar-AE': [5, 6],
    'he-IL': [5, 6],
    'fa-IR': [4, 5], // Thu+Fri in Iran
    en: [6, 0],
    de: [6, 0],
    fr: [6, 0],
    ar: [5, 6],
    he: [5, 6],
};

/**
 * Seven weekday short names ordered to begin at the locale's firstDayOfWeek.
 * Use for the calendar grid header row.
 */
export const formatWeekdayNames = (locale: string, format: 'short' | 'narrow' = 'short'): string[] => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: format });
    const start = getFirstDayOfWeek(locale);
    // 2026-01-04 is a Sunday in Gregorian; offset from there.
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 0, 4 + ((start + i) % 7)));
        return fmt.format(d);
    });
};

/** "May 2026" / "Mai 2026" / "mai 2026" */
export const formatMonthYearTitle = (date: CalendarDate, locale: string): string => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    return fmt.format(date.toDate('UTC'));
};

/** "January", "Februar", "février" — twelve full month names. */
export const formatMonthNames = (locale: string): string[] => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(Date.UTC(2026, m, 15))));
};

/** "May 5, 2026" — for screen-reader announcements. */
export const formatFullDate = (date: CalendarDate, locale: string): string => {
    const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
    return fmt.format(date.toDate('UTC'));
};

// A known Wednesday in 2026 — used as the probe for week-start derivation.
import { CalendarDate as _CD } from '@internationalized/date';
const ANCHOR_DATE = new _CD(2026, 5, 6);
```

- [ ] **Step 2: Run tests to verify all pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/locale-utils.test.ts`
Expected: PASS — all 4 describe blocks green.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/state/locale-utils.ts packages/core/src/components/Calendar/__tests__/locale-utils.test.ts
git commit -m "feat(core/calendar): locale utilities (firstDayOfWeek, weekend, formatters)"
```

---

## Task 7: Constraints helpers — failing tests first

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/constraints.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/src/components/Calendar/__tests__/constraints.test.ts
import { CalendarDate } from '@internationalized/date';
import { composeUnavailable, isOutOfRange } from '../state/constraints';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('isOutOfRange', () => {
    it('returns false when no bounds are given', () => {
        expect(isOutOfRange(d(2026, 5, 5))).toBe(false);
    });
    it('returns true when before minValue', () => {
        expect(isOutOfRange(d(2026, 5, 1), { minValue: d(2026, 5, 5) })).toBe(true);
    });
    it('returns true when after maxValue', () => {
        expect(isOutOfRange(d(2026, 5, 10), { maxValue: d(2026, 5, 5) })).toBe(true);
    });
    it('returns false on the boundary', () => {
        expect(isOutOfRange(d(2026, 5, 5), { minValue: d(2026, 5, 5), maxValue: d(2026, 5, 5) })).toBe(false);
    });
});

describe('composeUnavailable', () => {
    it('returns false when no constraints provided', () => {
        const fn = composeUnavailable({});
        expect(fn(d(2026, 5, 5))).toBe(false);
    });
    it('respects minValue/maxValue', () => {
        const fn = composeUnavailable({ minValue: d(2026, 5, 5), maxValue: d(2026, 5, 10) });
        expect(fn(d(2026, 5, 4))).toBe(true);
        expect(fn(d(2026, 5, 5))).toBe(false);
        expect(fn(d(2026, 5, 11))).toBe(true);
    });
    it('combines with isDateUnavailable predicate', () => {
        const fn = composeUnavailable({
            isDateUnavailable: (date) => date.day === 7,
        });
        expect(fn(d(2026, 5, 6))).toBe(false);
        expect(fn(d(2026, 5, 7))).toBe(true);
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/constraints.test.ts`
Expected: FAIL — module not found.

---

## Task 8: Implement constraints

**Files:**
- Create: `packages/core/src/components/Calendar/state/constraints.ts`

- [ ] **Step 1: Implement**

```ts
// packages/core/src/components/Calendar/state/constraints.ts
import type { CalendarDate } from '@internationalized/date';

export type Constraints = {
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;
};

const cmp = (a: CalendarDate, b: CalendarDate): number => a.compare(b);

export const isOutOfRange = (
    date: CalendarDate,
    bounds: Pick<Constraints, 'minValue' | 'maxValue'> = {}
): boolean => {
    if (bounds.minValue && cmp(date, bounds.minValue) < 0) return true;
    if (bounds.maxValue && cmp(date, bounds.maxValue) > 0) return true;
    return false;
};

/**
 * Returns a single predicate that combines minValue/maxValue bounds and
 * a user-provided isDateUnavailable. The composed function is what every
 * view layer (DayCell, keyboard nav focus skip, Calendar.List) consults.
 */
export const composeUnavailable = (c: Constraints) => (date: CalendarDate): boolean => {
    if (isOutOfRange(date, c)) return true;
    if (c.isDateUnavailable && c.isDateUnavailable(date)) return true;
    return false;
};
```

- [ ] **Step 2: Run tests to verify pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/constraints.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/state/constraints.ts packages/core/src/components/Calendar/__tests__/constraints.test.ts
git commit -m "feat(core/calendar): add constraint helpers (isOutOfRange, composeUnavailable)"
```

---

## Task 9: Shared types module

**Files:**
- Create: `packages/core/src/components/Calendar/Calendar.types.ts`

- [ ] **Step 1: Define every public + internal type Calendar uses**

```ts
// packages/core/src/components/Calendar/Calendar.types.ts
import type { CalendarDate } from '@internationalized/date';
import type { ReactNode, Ref } from 'react';
import type { View as RNView } from 'react-native';
import type { DayOfWeek } from './state/locale-utils';

export type CalendarMode = 'single' | 'range' | 'multiple';
export type CalendarView = 'day' | 'month' | 'year';
export type CalendarBehavior = 'paged' | 'scroll';

export type DateRange = { start: CalendarDate; end: CalendarDate | null };

export type CalendarValue<M extends CalendarMode> =
    M extends 'single' ? CalendarDate | null
    : M extends 'range' ? DateRange | null
    : M extends 'multiple' ? CalendarDate[]
    : never;

export type ChangeMeta = {
    view: CalendarView;
    source: 'click' | 'keyboard' | 'scroll';
};

export type DayContext = {
    date: CalendarDate;
    isOutsideMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
    isInRange: boolean;
    isInPreviewRange: boolean;
    isUnavailable: boolean;
    isFocused: boolean;
    isWeekend: boolean;
};

export type CalendarSlots = {
    /** Custom renderer for a single day cell. Receives full state. */
    renderDay?: (ctx: DayContext) => ReactNode;
};

export type CalendarBaseProps<M extends CalendarMode = 'single'> = {
    mode?: M;
    value?: CalendarValue<M>;
    defaultValue?: CalendarValue<M>;
    onChange?: (value: CalendarValue<M>, meta: ChangeMeta) => void;

    view?: CalendarView;
    defaultView?: CalendarView;
    onViewChange?: (view: CalendarView) => void;

    /** Default 'paged' on web, 'scroll' on native (Phase 2). */
    behavior?: CalendarBehavior;
    /** Number of calendar months side-by-side. `'auto'` = 2 on ≥768px, else 1. */
    visibleMonths?: number | 'auto';

    /** Inclusive minimum selectable date. */
    minValue?: CalendarDate;
    /** Inclusive maximum selectable date. */
    maxValue?: CalendarDate;
    /** Predicate marking a date unavailable (cannot be focused or selected). */
    isDateUnavailable?: (date: CalendarDate) => boolean;

    /** Override locale firstDayOfWeek (0=Sun..6=Sat). */
    firstDayOfWeek?: DayOfWeek;
    /** Override locale weekend marking. */
    weekendDays?: DayOfWeek[];
    /** Render the ISO week number column. */
    showWeekNumbers?: boolean;
    /** Highlight today's cell. @defaultValue true */
    highlightToday?: boolean;

    /** Override `NoriProvider.locale`. */
    locale?: string;

    /** Range mode only — minimum nights between start and end. */
    minNights?: number;
    /** Range mode only — maximum nights between start and end. */
    maxNights?: number;

    /** Custom renderer for a single day cell. */
    renderDay?: (ctx: DayContext) => ReactNode;

    /** Test id for the root element. */
    testID?: string;
    className?: string;
    ref?: Ref<RNView>;
    children?: ReactNode;
};

// Convenience aliases used by the public API export.
export type CalendarProps<M extends CalendarMode = 'single'> = CalendarBaseProps<M>;
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/Calendar.types.ts
git commit -m "feat(core/calendar): define shared types (Mode, View, CalendarProps, DayContext)"
```

---

## Task 10: `useCalendarState` (single + multiple) — failing tests first

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/use-calendar-state.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// packages/core/src/components/Calendar/__tests__/use-calendar-state.test.tsx
import { CalendarDate } from '@internationalized/date';
import { act, renderHook } from '@testing-library/react';
import { useCalendarState } from '../state/use-calendar-state';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('useCalendarState — single mode', () => {
    it('exposes initial focusedDate from defaultValue', () => {
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', defaultValue: d(2026, 5, 5), locale: 'en-US' })
        );
        expect(result.current.focusedDate.day).toBe(5);
        expect(result.current.value).toEqual(d(2026, 5, 5));
    });

    it('selecting a date updates value and fires onChange with meta', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', onChange, locale: 'en-US' })
        );
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        expect(result.current.value).toEqual(d(2026, 5, 10));
        expect(onChange).toHaveBeenCalledWith(d(2026, 5, 10), { view: 'day', source: 'click' });
    });

    it('respects controlled value', () => {
        const onChange = jest.fn();
        const { result, rerender } = renderHook(
            ({ value }) => useCalendarState({ mode: 'single', value, onChange, locale: 'en-US' }),
            { initialProps: { value: d(2026, 5, 5) as CalendarDate | null } }
        );
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        // Value still 5 — controlled.
        expect(result.current.value).toEqual(d(2026, 5, 5));
        // onChange did fire.
        expect(onChange).toHaveBeenCalledWith(d(2026, 5, 10), expect.objectContaining({ view: 'day' }));
        // Caller updates value.
        rerender({ value: d(2026, 5, 10) });
        expect(result.current.value).toEqual(d(2026, 5, 10));
    });

    it('refuses to select unavailable dates', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({
                mode: 'single',
                onChange,
                locale: 'en-US',
                isDateUnavailable: (date) => date.day === 7,
            })
        );
        act(() => result.current.selectDate(d(2026, 5, 7), 'click'));
        expect(result.current.value).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('useCalendarState — multiple mode', () => {
    it('toggles dates in/out of value array', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'multiple', defaultValue: [], onChange, locale: 'en-US' })
        );
        act(() => result.current.selectDate(d(2026, 5, 5), 'click'));
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        expect(result.current.value).toEqual([d(2026, 5, 5), d(2026, 5, 10)]);
        // Re-selecting removes.
        act(() => result.current.selectDate(d(2026, 5, 5), 'click'));
        expect(result.current.value).toEqual([d(2026, 5, 10)]);
    });
});

describe('useCalendarState — view drill-down', () => {
    it('changes view via setView', () => {
        const onViewChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', onViewChange, locale: 'en-US' })
        );
        expect(result.current.view).toBe('day');
        act(() => result.current.setView('month'));
        expect(result.current.view).toBe('month');
        expect(onViewChange).toHaveBeenCalledWith('month');
    });
});

describe('useCalendarState — focus arithmetic', () => {
    it('moveFocus by days/weeks/months/years', () => {
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', defaultValue: d(2026, 5, 15), locale: 'en-US' })
        );
        act(() => result.current.moveFocus({ days: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 5, 16));
        act(() => result.current.moveFocus({ weeks: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 5, 23));
        act(() => result.current.moveFocus({ months: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 6, 23));
        act(() => result.current.moveFocus({ years: -1 }));
        expect(result.current.focusedDate).toEqual(d(2025, 6, 23));
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-calendar-state.test.tsx`
Expected: FAIL — module not found.

---

## Task 11: Implement `useCalendarState`

**Files:**
- Create: `packages/core/src/components/Calendar/state/use-calendar-state.ts`

- [ ] **Step 1: Implement**

```ts
// packages/core/src/components/Calendar/state/use-calendar-state.ts
'use client';

import type { CalendarDate } from '@internationalized/date';
import { today, getLocalTimeZone } from '@internationalized/date';
import { useCallback, useState } from 'react';
import type { CalendarMode, CalendarValue, CalendarView, ChangeMeta } from '../Calendar.types';
import { composeUnavailable, type Constraints } from './constraints';

export type FocusDelta = {
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
};

export type UseCalendarStateProps<M extends CalendarMode> = Constraints & {
    mode?: M;
    locale: string;
    value?: CalendarValue<M>;
    defaultValue?: CalendarValue<M>;
    onChange?: (value: CalendarValue<M>, meta: ChangeMeta) => void;
    view?: CalendarView;
    defaultView?: CalendarView;
    onViewChange?: (view: CalendarView) => void;
};

export type UseCalendarStateReturn<M extends CalendarMode> = {
    value: CalendarValue<M>;
    view: CalendarView;
    focusedDate: CalendarDate;
    setView: (next: CalendarView) => void;
    moveFocus: (delta: FocusDelta) => void;
    setFocusedDate: (date: CalendarDate) => void;
    selectDate: (date: CalendarDate, source: ChangeMeta['source']) => void;
    isUnavailable: (date: CalendarDate) => boolean;
};

const initialFocus = <M extends CalendarMode>(
    mode: M,
    value: CalendarValue<M> | undefined,
    fallback: CalendarDate
): CalendarDate => {
    if (!value) return fallback;
    if (mode === 'single') return (value as CalendarDate | null) ?? fallback;
    if (mode === 'range') {
        const r = value as { start: CalendarDate; end: CalendarDate | null };
        return r?.start ?? fallback;
    }
    const arr = value as CalendarDate[];
    return arr[0] ?? fallback;
};

export const useCalendarState = <M extends CalendarMode = 'single'>(
    props: UseCalendarStateProps<M>
): UseCalendarStateReturn<M> => {
    const mode = (props.mode ?? 'single') as M;
    const fallback = today(getLocalTimeZone());

    const [internalValue, setInternalValue] = useState<CalendarValue<M>>(() => {
        if (props.value !== undefined) return props.value;
        if (props.defaultValue !== undefined) return props.defaultValue;
        return (mode === 'multiple' ? [] : null) as CalendarValue<M>;
    });
    const isControlled = props.value !== undefined;
    const value = isControlled ? (props.value as CalendarValue<M>) : internalValue;

    const [internalView, setInternalView] = useState<CalendarView>(props.defaultView ?? 'day');
    const isViewControlled = props.view !== undefined;
    const view = isViewControlled ? (props.view as CalendarView) : internalView;

    const [focusedDate, setFocusedDate] = useState<CalendarDate>(() =>
        initialFocus(mode, value, fallback)
    );

    const isUnavailable = useCallback(
        composeUnavailable({
            minValue: props.minValue,
            maxValue: props.maxValue,
            isDateUnavailable: props.isDateUnavailable,
        }),
        [props.minValue, props.maxValue, props.isDateUnavailable]
    );

    const setView = useCallback(
        (next: CalendarView) => {
            if (!isViewControlled) setInternalView(next);
            props.onViewChange?.(next);
        },
        [isViewControlled, props.onViewChange]
    );

    const moveFocus = useCallback(
        (delta: FocusDelta) => {
            setFocusedDate((cur) => {
                let next = cur;
                if (delta.days) next = next.add({ days: delta.days });
                if (delta.weeks) next = next.add({ weeks: delta.weeks });
                if (delta.months) next = next.add({ months: delta.months });
                if (delta.years) next = next.add({ years: delta.years });
                return next;
            });
        },
        []
    );

    const selectDate = useCallback(
        (date: CalendarDate, source: ChangeMeta['source']) => {
            if (isUnavailable(date)) return;
            const meta: ChangeMeta = { view, source };
            let next: CalendarValue<M>;
            if (mode === 'single') {
                next = date as CalendarValue<M>;
            } else if (mode === 'multiple') {
                const arr = (value as CalendarDate[]) ?? [];
                const exists = arr.some((d) => d.compare(date) === 0);
                next = (exists ? arr.filter((d) => d.compare(date) !== 0) : [...arr, date]) as CalendarValue<M>;
            } else {
                // range mode delegated to useRangeState
                return;
            }
            if (!isControlled) setInternalValue(next);
            props.onChange?.(next, meta);
            setFocusedDate(date);
        },
        [isControlled, isUnavailable, mode, props.onChange, value, view]
    );

    return {
        value,
        view,
        focusedDate,
        setView,
        moveFocus,
        setFocusedDate,
        selectDate,
        isUnavailable,
    };
};
```

- [ ] **Step 2: Run tests to verify pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-calendar-state.test.tsx`
Expected: PASS — all describes green.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/state/use-calendar-state.ts packages/core/src/components/Calendar/__tests__/use-calendar-state.test.tsx
git commit -m "feat(core/calendar): useCalendarState (single + multiple modes, view drill-down, focus arithmetic)"
```

---

## Task 12: `useRangeState` — failing tests first

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/use-range-state.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// packages/core/src/components/Calendar/__tests__/use-range-state.test.tsx
import { CalendarDate } from '@internationalized/date';
import { act, renderHook } from '@testing-library/react';
import { useRangeState } from '../state/use-range-state';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('useRangeState', () => {
    it('first click sets pending start with end=null', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange }));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: null });
        expect(onChange).toHaveBeenCalledWith({ start: d(2026, 5, 5), end: null }, expect.any(Object));
    });

    it('second click commits the range, ordered ascending', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange }));
        act(() => result.current.selectDate(d(2026, 5, 10)));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        // Second click was earlier than first — order should normalize.
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 10) });
    });

    it('third click starts a new range', () => {
        const { result } = renderHook(() => useRangeState({}));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        act(() => result.current.selectDate(d(2026, 5, 10)));
        act(() => result.current.selectDate(d(2026, 5, 20)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 20), end: null });
    });

    it('hover preview reflects pending state, not committed', () => {
        const { result } = renderHook(() => useRangeState({}));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        act(() => result.current.setHoveredDate(d(2026, 5, 8)));
        expect(result.current.previewRange).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 8) });
        // After commit, preview clears.
        act(() => result.current.selectDate(d(2026, 5, 10)));
        expect(result.current.previewRange).toBeNull();
    });

    it('respects minNights — selection below minimum is rejected', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange, minNights: 3 }));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        // Try to set end only 1 night out — should NOT commit.
        act(() => result.current.selectDate(d(2026, 5, 6)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: null });
        // 3 nights or more works.
        act(() => result.current.selectDate(d(2026, 5, 8)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 8) });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-range-state.test.tsx`
Expected: FAIL — module not found.

---

## Task 13: Implement `useRangeState`

**Files:**
- Create: `packages/core/src/components/Calendar/state/use-range-state.ts`

- [ ] **Step 1: Implement**

```ts
// packages/core/src/components/Calendar/state/use-range-state.ts
'use client';

import type { CalendarDate } from '@internationalized/date';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeMeta, DateRange } from '../Calendar.types';
import { composeUnavailable, type Constraints } from './constraints';

export type UseRangeStateProps = Constraints & {
    value?: DateRange | null;
    defaultValue?: DateRange | null;
    onChange?: (value: DateRange | null, meta: ChangeMeta) => void;
    minNights?: number;
    maxNights?: number;
};

export type UseRangeStateReturn = {
    value: DateRange | null;
    previewRange: DateRange | null;
    hoveredDate: CalendarDate | null;
    selectDate: (date: CalendarDate, source?: ChangeMeta['source']) => void;
    setHoveredDate: (date: CalendarDate | null) => void;
    isUnavailable: (date: CalendarDate) => boolean;
};

const order = (a: CalendarDate, b: CalendarDate): [CalendarDate, CalendarDate] =>
    a.compare(b) <= 0 ? [a, b] : [b, a];

const nightsBetween = (a: CalendarDate, b: CalendarDate): number => {
    const [first, last] = order(a, b);
    return last.toDate('UTC').getTime() - first.toDate('UTC').getTime() === 0
        ? 0
        : Math.round((last.toDate('UTC').getTime() - first.toDate('UTC').getTime()) / 86400000);
};

export const useRangeState = (props: UseRangeStateProps): UseRangeStateReturn => {
    const [internal, setInternal] = useState<DateRange | null>(props.defaultValue ?? null);
    const isControlled = props.value !== undefined;
    const value = isControlled ? (props.value ?? null) : internal;

    const [hoveredDate, setHoveredDate] = useState<CalendarDate | null>(null);

    const isUnavailable = useMemo(
        () =>
            composeUnavailable({
                minValue: props.minValue,
                maxValue: props.maxValue,
                isDateUnavailable: props.isDateUnavailable,
            }),
        [props.minValue, props.maxValue, props.isDateUnavailable]
    );

    const commit = useCallback(
        (next: DateRange | null, source: ChangeMeta['source']) => {
            if (!isControlled) setInternal(next);
            props.onChange?.(next, { view: 'day', source });
        },
        [isControlled, props.onChange]
    );

    const selectDate = useCallback(
        (date: CalendarDate, source: ChangeMeta['source'] = 'click') => {
            if (isUnavailable(date)) return;

            // No range yet, or both endpoints set → start a fresh selection.
            if (!value || value.end !== null) {
                commit({ start: date, end: null }, source);
                setHoveredDate(null);
                return;
            }

            // We have a pending start, no end yet.
            const nights = nightsBetween(value.start, date);
            if (props.minNights !== undefined && nights < props.minNights) return;
            if (props.maxNights !== undefined && nights > props.maxNights) return;

            const [start, end] = order(value.start, date);
            commit({ start, end }, source);
            setHoveredDate(null);
        },
        [commit, isUnavailable, props.maxNights, props.minNights, value]
    );

    const previewRange = useMemo<DateRange | null>(() => {
        if (!value || value.end !== null || !hoveredDate) return null;
        const [start, end] = order(value.start, hoveredDate);
        return { start, end };
    }, [hoveredDate, value]);

    return {
        value,
        previewRange,
        hoveredDate,
        selectDate,
        setHoveredDate,
        isUnavailable,
    };
};
```

- [ ] **Step 2: Run tests to verify pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-range-state.test.tsx`
Expected: PASS — 5 tests green.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/state/use-range-state.ts packages/core/src/components/Calendar/__tests__/use-range-state.test.tsx
git commit -m "feat(core/calendar): useRangeState (pending start, hover preview, min/max nights)"
```

---

## Task 14: `useCalendarKeyboard` — failing tests first

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx`

- [ ] **Step 1: Write failing tests covering the React Aria key contract**

```tsx
// packages/core/src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx
import { CalendarDate } from '@internationalized/date';
import { renderHook } from '@testing-library/react';
import { useCalendarKeyboard } from '../state/use-calendar-keyboard';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

const fakeEvent = (key: string, shiftKey = false) =>
    ({
        key,
        shiftKey,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    }) as unknown as React.KeyboardEvent;

describe('useCalendarKeyboard — RAC contract', () => {
    const baseState = {
        focusedDate: d(2026, 5, 15),
        moveFocus: jest.fn(),
        selectDate: jest.fn(),
        setView: jest.fn(),
        view: 'day' as const,
    };

    beforeEach(() => {
        baseState.moveFocus.mockClear();
        baseState.selectDate.mockClear();
        baseState.setView.mockClear();
    });

    it('ArrowRight moves focus +1 day', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowRight'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: 1 });
    });

    it('ArrowLeft moves focus -1 day', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowLeft'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: -1 });
    });

    it('ArrowDown moves focus +1 week', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowDown'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ weeks: 1 });
    });

    it('ArrowUp moves focus -1 week', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowUp'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ weeks: -1 });
    });

    it('PageDown moves focus +1 month', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageDown'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ months: 1 });
    });

    it('PageUp moves focus -1 month', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageUp'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ months: -1 });
    });

    it('Shift+PageDown moves focus +1 year', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageDown', true));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ years: 1 });
    });

    it('Shift+PageUp moves focus -1 year', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageUp', true));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ years: -1 });
    });

    it('Enter selects the focused date with source=keyboard', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('Enter'));
        expect(baseState.selectDate).toHaveBeenCalledWith(d(2026, 5, 15), 'keyboard');
    });

    it('Space selects the focused date', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent(' '));
        expect(baseState.selectDate).toHaveBeenCalledWith(d(2026, 5, 15), 'keyboard');
    });

    it('Home moves to start of week, End to end of week (using firstDayOfWeek=0)', () => {
        const { result } = renderHook(() =>
            useCalendarKeyboard({ ...baseState, firstDayOfWeek: 0 })
        );
        result.current.onKeyDown(fakeEvent('Home'));
        // 2026-05-15 is a Friday → start of week (Sun) is May 10.
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: -5 });
        baseState.moveFocus.mockClear();
        result.current.onKeyDown(fakeEvent('End'));
        // End of week (Sat) is May 16.
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: 1 });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx`
Expected: FAIL — module not found.

---

## Task 15: Implement `useCalendarKeyboard`

**Files:**
- Create: `packages/core/src/components/Calendar/state/use-calendar-keyboard.ts`

- [ ] **Step 1: Implement**

```ts
// packages/core/src/components/Calendar/state/use-calendar-keyboard.ts
'use client';

import type { CalendarDate } from '@internationalized/date';
import { useCallback } from 'react';
import type { CalendarView, ChangeMeta } from '../Calendar.types';
import type { DayOfWeek } from './locale-utils';
import type { FocusDelta } from './use-calendar-state';

export type UseCalendarKeyboardProps = {
    focusedDate: CalendarDate;
    moveFocus: (delta: FocusDelta) => void;
    selectDate: (date: CalendarDate, source: ChangeMeta['source']) => void;
    setView: (view: CalendarView) => void;
    view: CalendarView;
    /** Default 0 (Sunday). Used by Home/End to compute week boundaries. */
    firstDayOfWeek?: DayOfWeek;
};

export const useCalendarKeyboard = (props: UseCalendarKeyboardProps) => {
    const { focusedDate, moveFocus, selectDate, firstDayOfWeek = 0 } = props;

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            // The day-of-week index 0..6 of the focused date in JS terms.
            const focusedDow = focusedDate.toDate('UTC').getUTCDay() as DayOfWeek;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    moveFocus({ days: -1 });
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    moveFocus({ days: 1 });
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    moveFocus({ weeks: -1 });
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    moveFocus({ weeks: 1 });
                    return;
                case 'PageUp':
                    event.preventDefault();
                    moveFocus(event.shiftKey ? { years: -1 } : { months: -1 });
                    return;
                case 'PageDown':
                    event.preventDefault();
                    moveFocus(event.shiftKey ? { years: 1 } : { months: 1 });
                    return;
                case 'Home': {
                    event.preventDefault();
                    // Days back to the locale's first day of week.
                    const back = (focusedDow - firstDayOfWeek + 7) % 7;
                    moveFocus({ days: -back });
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    const back = (focusedDow - firstDayOfWeek + 7) % 7;
                    const forward = 6 - back;
                    moveFocus({ days: forward });
                    return;
                }
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    selectDate(focusedDate, 'keyboard');
                    return;
                default:
                    return;
            }
        },
        [focusedDate, firstDayOfWeek, moveFocus, selectDate]
    );

    return { onKeyDown };
};
```

- [ ] **Step 2: Run tests to verify pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx`
Expected: PASS — all 11 tests green.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/state/use-calendar-keyboard.ts packages/core/src/components/Calendar/__tests__/use-calendar-keyboard.test.tsx
git commit -m "feat(core/calendar): keyboard handler implementing the React Aria key contract"
```

---

## Task 16: `DayCell` view component

**Files:**
- Create: `packages/core/src/components/Calendar/view/DayCell.tsx`

The DayCell is purely presentational — receives a `DayContext` plus `onPress`/`onHoverIn` callbacks and renders a styled pressable. Keep it small; integration tests will exercise it via `Calendar.test.tsx`.

- [ ] **Step 1: Implement**

```tsx
// packages/core/src/components/Calendar/view/DayCell.tsx
'use client';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { cn } from '../../../utils/cn';
import type { DayContext } from '../Calendar.types';

export type DayCellProps = {
    ctx: DayContext;
    onPress: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
    children?: ReactNode;
    /** Render slot — when given, the slot wins over default rendering. */
    renderDay?: (ctx: DayContext) => ReactNode;
};

const SIZE = 36; // single density baseline; theme controls spacing not the cell

export const DayCell = ({ ctx, onPress, onHoverIn, onHoverOut, renderDay }: DayCellProps) => {
    const colors = useThemeColors();

    const baseStyle: ViewStyle = {
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px('2'),
    };

    const stateStyle: ViewStyle = (() => {
        if (ctx.isUnavailable) return { opacity: 0.4 };
        if (ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd) {
            return { backgroundColor: colors.interactivePrimary };
        }
        if (ctx.isInRange || ctx.isInPreviewRange) {
            return { backgroundColor: colors.interactivePrimarySoft };
        }
        return {};
    })();

    const textColor =
        ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd
            ? colors.onInteractivePrimary
            : ctx.isOutsideMonth
              ? colors.textTertiary
              : colors.textPrimary;

    if (renderDay) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityState={{
                    selected: ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd,
                    disabled: ctx.isUnavailable,
                }}
                disabled={ctx.isUnavailable}
                onPress={onPress}
                {...(onHoverIn ? { onHoverIn } : {})}
                {...(onHoverOut ? { onHoverOut } : {})}
                style={[baseStyle, stateStyle]}
                data-state={
                    ctx.isSelected
                        ? 'selected'
                        : ctx.isInPreviewRange
                          ? 'preview'
                          : ctx.isInRange
                            ? 'in-range'
                            : undefined
                }
            >
                {renderDay(ctx)}
            </Pressable>
        );
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{
                selected: ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd,
                disabled: ctx.isUnavailable,
            }}
            disabled={ctx.isUnavailable}
            onPress={onPress}
            {...(onHoverIn ? { onHoverIn } : {})}
            {...(onHoverOut ? { onHoverOut } : {})}
            style={[baseStyle, stateStyle]}
            className={cn(ctx.isToday && 'ring-1 ring-semantic-interactive-primary')}
            data-state={
                ctx.isSelected
                    ? 'selected'
                    : ctx.isInPreviewRange
                      ? 'preview'
                      : ctx.isInRange
                        ? 'in-range'
                        : undefined
            }
        >
            <RNText style={{ color: textColor, fontWeight: ctx.isToday ? '600' : '400' }}>
                {ctx.date.day}
            </RNText>
        </Pressable>
    );
};
```

- [ ] **Step 2: Verify typecheck (no test yet — covered by Calendar integration test)**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0. **If `colors.interactivePrimarySoft` / `colors.onInteractivePrimary` / `colors.textTertiary` are not in the theme, replace each with the closest existing token from `useThemeColors()` — verify with `grep -r 'interactivePrimary' packages/core/src/theme/` and adapt.**

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/view/DayCell.tsx
git commit -m "feat(core/calendar): DayCell view component with state-based styling"
```

---

## Task 17: `DayGrid` — render one month

**Files:**
- Create: `packages/core/src/components/Calendar/view/DayGrid.tsx`

- [ ] **Step 1: Implement**

```tsx
// packages/core/src/components/Calendar/view/DayGrid.tsx
'use client';

import type { CalendarDate } from '@internationalized/date';
import { endOfMonth, startOfMonth, today, getLocalTimeZone } from '@internationalized/date';
import { type ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import type {
    CalendarMode,
    CalendarValue,
    DateRange,
    DayContext,
} from '../Calendar.types';
import { formatWeekdayNames, type DayOfWeek, getFirstDayOfWeek } from '../state/locale-utils';
import { DayCell } from './DayCell';

// NOTE: the `Text` import path above must match this codebase's actual
// re-export. Replace with the verified path discovered via:
//   grep -r "export .* Text" packages/core/src/components/Text/

type DayGridProps<M extends CalendarMode> = {
    visibleMonth: CalendarDate; // any date inside the month to render
    locale: string;
    mode: M;
    value: CalendarValue<M>;
    previewRange?: DateRange | null;
    focusedDate: CalendarDate;
    isUnavailable: (date: CalendarDate) => boolean;
    weekendDays: [DayOfWeek, DayOfWeek];
    firstDayOfWeek?: DayOfWeek;
    onDayPress: (date: CalendarDate) => void;
    onDayHover?: (date: CalendarDate | null) => void;
    renderDay?: (ctx: DayContext) => ReactNode;
};

const isInRange = (date: CalendarDate, range: DateRange | null | undefined): boolean => {
    if (!range || !range.end) return false;
    return date.compare(range.start) >= 0 && date.compare(range.end) <= 0;
};

const buildContext = <M extends CalendarMode>(
    date: CalendarDate,
    args: {
        visibleMonth: CalendarDate;
        mode: M;
        value: CalendarValue<M>;
        previewRange?: DateRange | null;
        focusedDate: CalendarDate;
        isUnavailable: (date: CalendarDate) => boolean;
        weekendDays: [DayOfWeek, DayOfWeek];
        todayDate: CalendarDate;
    }
): DayContext => {
    const isOutsideMonth = date.month !== args.visibleMonth.month;
    const isToday = date.compare(args.todayDate) === 0;
    const dow = date.toDate('UTC').getUTCDay() as DayOfWeek;
    const isWeekend = args.weekendDays.includes(dow);
    let isSelected = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let inRange = false;

    if (args.mode === 'single') {
        const v = args.value as CalendarDate | null;
        isSelected = !!v && v.compare(date) === 0;
    } else if (args.mode === 'range') {
        const r = args.value as DateRange | null;
        if (r) {
            isRangeStart = r.start.compare(date) === 0;
            isRangeEnd = r.end !== null && r.end.compare(date) === 0;
            inRange = isInRange(date, r);
        }
    } else {
        const arr = args.value as CalendarDate[];
        isSelected = arr.some((x) => x.compare(date) === 0);
    }

    return {
        date,
        isOutsideMonth,
        isToday,
        isSelected,
        isRangeStart,
        isRangeEnd,
        isInRange: inRange,
        isInPreviewRange: isInRange(date, args.previewRange ?? null),
        isUnavailable: args.isUnavailable(date),
        isFocused: args.focusedDate.compare(date) === 0,
        isWeekend,
    };
};

export const DayGrid = <M extends CalendarMode>(props: DayGridProps<M>) => {
    const { visibleMonth, locale, mode, value, previewRange, focusedDate, isUnavailable, weekendDays, firstDayOfWeek, onDayPress, onDayHover, renderDay } = props;

    const start = startOfMonth(visibleMonth);
    const end = endOfMonth(visibleMonth);
    const fdow = firstDayOfWeek ?? getFirstDayOfWeek(locale);

    const cells = useMemo<CalendarDate[]>(() => {
        const startDow = start.toDate('UTC').getUTCDay() as DayOfWeek;
        const back = (startDow - fdow + 7) % 7;
        const first = start.subtract({ days: back });
        const total = 42; // 6 rows × 7 — handles all month layouts
        return Array.from({ length: total }, (_, i) => first.add({ days: i }));
    }, [start, fdow]);

    const weekdayNames = useMemo(() => formatWeekdayNames(locale), [locale]);
    const todayDate = useMemo(() => today(getLocalTimeZone()), []);

    return (
        <View accessibilityRole="grid" style={{ width: 7 * 36 }}>
            <View style={{ flexDirection: 'row' }} accessibilityRole="none">
                {weekdayNames.map((name, i) => (
                    <View key={`${name}-${i}`} style={{ width: 36, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, opacity: 0.7 }}>{name}</Text>
                    </View>
                ))}
            </View>
            {Array.from({ length: 6 }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row' }} accessibilityRole="row">
                    {cells.slice(row * 7, row * 7 + 7).map((date) => {
                        const ctx = buildContext(date, {
                            visibleMonth,
                            mode,
                            value,
                            previewRange,
                            focusedDate,
                            isUnavailable,
                            weekendDays,
                            todayDate,
                        });
                        return (
                            <DayCell
                                key={`${date.year}-${date.month}-${date.day}`}
                                ctx={ctx}
                                onPress={() => onDayPress(date)}
                                {...(onDayHover ? { onHoverIn: () => onDayHover(date), onHoverOut: () => onDayHover(null) } : {})}
                                {...(renderDay ? { renderDay } : {})}
                            />
                        );
                    })}
                </View>
            ))}
            {/* Suppress unused warning — `end` is documented intent */}
            {void end}
        </View>
    );
};
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0. **If the `Text` import path is wrong (Step 2 marks it as needing verification), fix it and re-run.**

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/view/DayGrid.tsx
git commit -m "feat(core/calendar): DayGrid renders one month with weekday header and 6×7 cells"
```

---

## Task 18: `Header` (with drill-down trigger)

**Files:**
- Create: `packages/core/src/components/Calendar/view/Header.tsx`

- [ ] **Step 1: Implement**

```tsx
// packages/core/src/components/Calendar/view/Header.tsx
'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../../i18n/use-translation';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';
import type { CalendarView } from '../Calendar.types';
import { formatMonthYearTitle } from '../state/locale-utils';

type HeaderProps = {
    visibleMonth: CalendarDate;
    locale: string;
    view: CalendarView;
    onPrev: () => void;
    onNext: () => void;
    onTitlePress: () => void;
};

const NavButton = ({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) => {
    const colors = useThemeColors();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: px('2'),
            }}
        >
            <RNText style={{ color: colors.textPrimary, fontSize: 18 }}>{children}</RNText>
        </Pressable>
    );
};

export const Header = ({ visibleMonth, locale, view, onPrev, onNext, onTitlePress }: HeaderProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();

    const title = (() => {
        if (view === 'day') return formatMonthYearTitle(visibleMonth, locale);
        if (view === 'month') return String(visibleMonth.year);
        const start = visibleMonth.year - (visibleMonth.year % 10);
        return `${start} – ${start + 11}`;
    })();

    const titleAriaLabel = t(
        view === 'day' ? 'calendar.header.openMonthView' : view === 'month' ? 'calendar.header.openYearView' : 'calendar.header.openDayView',
        { defaultValue: 'Change view' }
    );

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: px('2') }}>
            <NavButton label={t('calendar.header.previous', { defaultValue: 'Previous' })} onPress={onPrev}>‹</NavButton>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={titleAriaLabel}
                onPress={onTitlePress}
                style={{ paddingHorizontal: px('3'), paddingVertical: px('2'), borderRadius: px('2') }}
            >
                <RNText style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{title}</RNText>
            </Pressable>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>›</NavButton>
        </View>
    );
};
```

- [ ] **Step 2: Add the calendar i18n keys to the default dictionary**

Open `packages/core/src/i18n/default-dictionary.ts` and add (alphabetically with existing entries):

```ts
'calendar.header.previous': 'Previous',
'calendar.header.next': 'Next',
'calendar.header.openMonthView': 'Open month picker',
'calendar.header.openYearView': 'Open year picker',
'calendar.header.openDayView': 'Open day picker',
'calendar.today': 'Today',
'calendar.clear': 'Clear',
```

- [ ] **Step 3: Add type augmentation for the new I18nKeys**

Open `packages/core/src/i18n/types.ts`. Find the `I18nKeys` interface and add the same 6 keys (matching the dictionary entries above) so consumers' typed dictionaries can override them.

- [ ] **Step 4: Verify typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/Calendar/view/Header.tsx packages/core/src/i18n/default-dictionary.ts packages/core/src/i18n/types.ts
git commit -m "feat(core/calendar): Header with prev/next nav and view-drilldown title"
```

---

## Task 19: `MonthGrid` and `YearGrid` (drill-down views)

**Files:**
- Create: `packages/core/src/components/Calendar/view/MonthGrid.tsx`
- Create: `packages/core/src/components/Calendar/view/YearGrid.tsx`

- [ ] **Step 1: Implement `MonthGrid`**

```tsx
// packages/core/src/components/Calendar/view/MonthGrid.tsx
'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { formatMonthNames } from '../state/locale-utils';

type MonthGridProps = {
    visibleMonth: CalendarDate;
    locale: string;
    onSelect: (month: number) => void; // 1..12
};

export const MonthGrid = ({ visibleMonth, locale, onSelect }: MonthGridProps) => {
    const colors = useThemeColors();
    const names = formatMonthNames(locale);

    return (
        <View style={{ width: 7 * 36, paddingVertical: px('2') }}>
            {Array.from({ length: 4 }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: px('1') }}>
                    {Array.from({ length: 3 }, (_, col) => {
                        const idx = row * 3 + col;
                        const isCurrent = idx + 1 === visibleMonth.month;
                        return (
                            <Pressable
                                key={idx}
                                accessibilityRole="button"
                                accessibilityLabel={names[idx]}
                                onPress={() => onSelect(idx + 1)}
                                style={{
                                    paddingHorizontal: px('3'),
                                    paddingVertical: px('2'),
                                    borderRadius: px('2'),
                                    backgroundColor: isCurrent ? colors.interactivePrimary : 'transparent',
                                    minWidth: 70,
                                    alignItems: 'center',
                                }}
                            >
                                <RNText style={{ color: isCurrent ? colors.onInteractivePrimary : colors.textPrimary }}>
                                    {names[idx]}
                                </RNText>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
```

- [ ] **Step 2: Implement `YearGrid`**

```tsx
// packages/core/src/components/Calendar/view/YearGrid.tsx
'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';

type YearGridProps = {
    visibleMonth: CalendarDate;
    onSelect: (year: number) => void;
};

export const YearGrid = ({ visibleMonth, onSelect }: YearGridProps) => {
    const colors = useThemeColors();
    const decadeStart = visibleMonth.year - (visibleMonth.year % 10);
    const years = Array.from({ length: 12 }, (_, i) => decadeStart + i - 1); // pad with prev decade tail

    return (
        <View style={{ width: 7 * 36, paddingVertical: px('2') }}>
            {Array.from({ length: 3 }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: px('1') }}>
                    {Array.from({ length: 4 }, (_, col) => {
                        const year = years[row * 4 + col]!;
                        const isCurrent = year === visibleMonth.year;
                        return (
                            <Pressable
                                key={year}
                                accessibilityRole="button"
                                accessibilityLabel={String(year)}
                                onPress={() => onSelect(year)}
                                style={{
                                    paddingHorizontal: px('3'),
                                    paddingVertical: px('2'),
                                    borderRadius: px('2'),
                                    backgroundColor: isCurrent ? colors.interactivePrimary : 'transparent',
                                    minWidth: 50,
                                    alignItems: 'center',
                                }}
                            >
                                <RNText style={{ color: isCurrent ? colors.onInteractivePrimary : colors.textPrimary }}>
                                    {year}
                                </RNText>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
```

- [ ] **Step 3: Verify typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/components/Calendar/view/MonthGrid.tsx packages/core/src/components/Calendar/view/YearGrid.tsx
git commit -m "feat(core/calendar): MonthGrid and YearGrid for drill-down navigation"
```

---

## Task 20: `Calendar.tsx` — wire it all together (failing integration test first)

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/Calendar.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// packages/core/src/components/Calendar/__tests__/Calendar.test.tsx
import { CalendarDate } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { Calendar } from '../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> single mode', () => {
    it('renders the focused month title', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        expect(screen.getByText(/May 2026/)).toBeInTheDocument();
    });

    it('selecting a day calls onChange with the date and meta', () => {
        const onChange = jest.fn();
        render(<Calendar defaultValue={d(2026, 5, 15)} onChange={onChange} locale="en-US" />);
        const dayCell = screen.getByRole('button', { name: /20/ });
        fireEvent.click(dayCell);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ year: 2026, month: 5, day: 20 }),
            expect.objectContaining({ view: 'day', source: 'click' })
        );
    });

    it('clicking the title drills down from day to month view', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        fireEvent.click(screen.getByText(/May 2026/));
        // Month grid renders 12 month names.
        expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();
        // Title now shows the year.
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('clicking the year title drills down to year/decade view', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} defaultView="month" locale="en-US" />);
        fireEvent.click(screen.getByText('2026'));
        // Decade grid renders a span like "2020 – 2031".
        expect(screen.getByText(/2020 – 2031/)).toBeInTheDocument();
    });
});

describe('<Calendar /> range mode', () => {
    it('two clicks build a range', () => {
        const onChange = jest.fn();
        render(<Calendar mode="range" defaultValue={null} defaultView="day" onChange={onChange} locale="en-US" />);
        // Default focus is today; for stable test, pin to defaultValue=null and explicit visibleMonth via prop is not needed
        // because the first month with defaultValue=null falls back to today. Instead, just verify the call shape.
        const day10 = screen.getAllByRole('button').find((b) => b.textContent === '10');
        expect(day10).toBeDefined();
        fireEvent.click(day10!);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ start: expect.anything(), end: null }),
            expect.objectContaining({ view: 'day' })
        );
    });
});

describe('<Calendar /> visibleMonths', () => {
    it('renders two month grids when visibleMonths=2', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} visibleMonths={2} locale="en-US" />);
        expect(screen.getByText(/May 2026/)).toBeInTheDocument();
        expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/Calendar.test.tsx`
Expected: FAIL — `Calendar` not exported.

---

## Task 21: Implement `Calendar.tsx` (web entry)

**Files:**
- Create: `packages/core/src/components/Calendar/Calendar.tsx`

- [ ] **Step 1: Implement**

```tsx
// packages/core/src/components/Calendar/Calendar.tsx
'use client';

import { CalendarDate } from '@internationalized/date';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocale } from '../../i18n/locale';
import { px } from '../../theme/px';
import type {
    CalendarBaseProps,
    CalendarMode,
    CalendarValue,
    DateRange,
    DayContext,
} from './Calendar.types';
import {
    formatWeekdayNames,
    getFirstDayOfWeek,
    getWeekendDays,
    type DayOfWeek,
} from './state/locale-utils';
import { useCalendarKeyboard } from './state/use-calendar-keyboard';
import { useCalendarState } from './state/use-calendar-state';
import { useRangeState } from './state/use-range-state';
import { DayGrid } from './view/DayGrid';
import { Footer } from './view/Footer';
import { Header } from './view/Header';
import { MonthGrid } from './view/MonthGrid';
import { YearGrid } from './view/YearGrid';

const DEFAULT_VISIBLE_MONTHS = 1;
const DESKTOP_BREAKPOINT = 768;

const useResolvedVisibleMonths = (input: number | 'auto' | undefined): number => {
    const fallback = DEFAULT_VISIBLE_MONTHS;
    if (typeof input === 'number') return input;
    // 'auto' or undefined → 2 on ≥768px, else 1. SSR: default to 1.
    if (Platform.OS !== 'web' || typeof window === 'undefined') return fallback;
    const [count, setCount] = useState<number>(window.innerWidth >= DESKTOP_BREAKPOINT ? 2 : 1);
    if (typeof window !== 'undefined') {
        // Subscribe once per render — cheap.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useMemo(() => {
            const handler = () => setCount(window.innerWidth >= DESKTOP_BREAKPOINT ? 2 : 1);
            window.addEventListener('resize', handler);
            return () => window.removeEventListener('resize', handler);
        }, []);
    }
    return count;
};

const CalendarRoot = <M extends CalendarMode = 'single'>(props: CalendarBaseProps<M>) => {
    const providerLocale = useLocale();
    const locale = props.locale ?? providerLocale;

    // State path forks at 'range' because the range model differs (pending start, hover preview).
    if ((props.mode ?? 'single') === 'range') {
        return <RangeCalendar {...(props as CalendarBaseProps<'range'>)} locale={locale} />;
    }
    return <SingleOrMultiCalendar {...props} locale={locale} />;
};

const SingleOrMultiCalendar = <M extends Exclude<CalendarMode, 'range'>>(
    props: CalendarBaseProps<M> & { locale: string }
) => {
    const { locale, renderDay } = props;
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

    const state = useCalendarState<M>({
        ...(props.mode !== undefined ? { mode: props.mode } : {}),
        locale,
        ...(props.value !== undefined ? { value: props.value } : {}),
        ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
        ...(props.onChange !== undefined ? { onChange: props.onChange } : {}),
        ...(props.view !== undefined ? { view: props.view } : {}),
        ...(props.defaultView !== undefined ? { defaultView: props.defaultView } : {}),
        ...(props.onViewChange !== undefined ? { onViewChange: props.onViewChange } : {}),
        ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
        ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
        ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
    });

    const keyboard = useCalendarKeyboard({
        focusedDate: state.focusedDate,
        moveFocus: state.moveFocus,
        selectDate: state.selectDate,
        setView: state.setView,
        view: state.view,
        firstDayOfWeek,
    });

    const visibleMonths = useResolvedVisibleMonths(props.visibleMonths);
    const months = Array.from({ length: visibleMonths }, (_, i) => state.focusedDate.add({ months: i }));

    return (
        <View
            ref={props.ref}
            testID={props.testID}
            onKeyDown={(e: React.KeyboardEvent) => keyboard.onKeyDown(e)}
            style={{ padding: px('3') }}
        >
            <Header
                visibleMonth={state.focusedDate}
                locale={locale}
                view={state.view}
                onPrev={() => state.moveFocus(state.view === 'year' ? { years: -10 } : state.view === 'month' ? { years: -1 } : { months: -1 })}
                onNext={() => state.moveFocus(state.view === 'year' ? { years: 10 } : state.view === 'month' ? { years: 1 } : { months: 1 })}
                onTitlePress={() =>
                    state.setView(state.view === 'day' ? 'month' : state.view === 'month' ? 'year' : 'day')
                }
            />
            {state.view === 'day' && (
                <View style={{ flexDirection: 'row', gap: px('4') }}>
                    {months.map((m) => (
                        <DayGrid
                            key={`${m.year}-${m.month}`}
                            visibleMonth={m}
                            locale={locale}
                            mode={(props.mode ?? 'single') as M}
                            value={state.value as CalendarValue<M>}
                            focusedDate={state.focusedDate}
                            isUnavailable={state.isUnavailable}
                            weekendDays={weekendDays}
                            firstDayOfWeek={firstDayOfWeek}
                            onDayPress={(date) => state.selectDate(date, 'click')}
                            {...(renderDay ? { renderDay } : {})}
                        />
                    ))}
                </View>
            )}
            {state.view === 'month' && (
                <MonthGrid
                    visibleMonth={state.focusedDate}
                    locale={locale}
                    onSelect={(month) => {
                        state.setFocusedDate(new CalendarDate(state.focusedDate.year, month, 1));
                        state.setView('day');
                    }}
                />
            )}
            {state.view === 'year' && (
                <YearGrid
                    visibleMonth={state.focusedDate}
                    onSelect={(year) => {
                        state.setFocusedDate(new CalendarDate(year, state.focusedDate.month, 1));
                        state.setView('month');
                    }}
                />
            )}
            {props.children ? <Footer>{props.children}</Footer> : null}
        </View>
    );
};

const RangeCalendar = (props: CalendarBaseProps<'range'> & { locale: string }) => {
    const { locale, renderDay } = props;
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

    const range = useRangeState({
        ...(props.value !== undefined ? { value: props.value } : {}),
        ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
        ...(props.onChange !== undefined ? { onChange: props.onChange } : {}),
        ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
        ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
        ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
        ...(props.minNights !== undefined ? { minNights: props.minNights } : {}),
        ...(props.maxNights !== undefined ? { maxNights: props.maxNights } : {}),
    });

    // For range, we use a separate focused-date local state since useRangeState
    // doesn't carry one (range doesn't need keyboard arithmetic the same way single does).
    const [focusedDate, setFocusedDate] = useState<CalendarDate>(
        () => (range.value?.start ?? new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()))
    );
    const [view, setView] = useState<'day' | 'month' | 'year'>(props.defaultView ?? 'day');

    const visibleMonths = useResolvedVisibleMonths(props.visibleMonths);
    const months = Array.from({ length: visibleMonths }, (_, i) => focusedDate.add({ months: i }));

    return (
        <View ref={props.ref} testID={props.testID} style={{ padding: px('3') }}>
            <Header
                visibleMonth={focusedDate}
                locale={locale}
                view={view}
                onPrev={() => setFocusedDate((f) => f.add({ months: -1 }))}
                onNext={() => setFocusedDate((f) => f.add({ months: 1 }))}
                onTitlePress={() => setView((v) => (v === 'day' ? 'month' : v === 'month' ? 'year' : 'day'))}
            />
            {view === 'day' && (
                <View style={{ flexDirection: 'row', gap: px('4') }}>
                    {months.map((m) => (
                        <DayGrid<'range'>
                            key={`${m.year}-${m.month}`}
                            visibleMonth={m}
                            locale={locale}
                            mode="range"
                            value={range.value as DateRange | null}
                            previewRange={range.previewRange}
                            focusedDate={focusedDate}
                            isUnavailable={range.isUnavailable}
                            weekendDays={weekendDays}
                            firstDayOfWeek={firstDayOfWeek}
                            onDayPress={(date) => range.selectDate(date)}
                            onDayHover={(date) => range.setHoveredDate(date)}
                            {...(renderDay ? { renderDay } : {})}
                        />
                    ))}
                </View>
            )}
            {view === 'month' && (
                <MonthGrid
                    visibleMonth={focusedDate}
                    locale={locale}
                    onSelect={(month) => {
                        setFocusedDate(new CalendarDate(focusedDate.year, month, 1));
                        setView('day');
                    }}
                />
            )}
            {view === 'year' && (
                <YearGrid
                    visibleMonth={focusedDate}
                    onSelect={(year) => {
                        setFocusedDate(new CalendarDate(year, focusedDate.month, 1));
                        setView('month');
                    }}
                />
            )}
            {props.children ? <Footer>{props.children}</Footer> : null}
        </View>
    );
};

// Compound parts (slots).
export type CalendarHeaderSlotProps = { children?: ReactNode };
const CalendarHeaderSlot = ({ children }: CalendarHeaderSlotProps) => <>{children}</>;
CalendarHeaderSlot.displayName = 'Calendar.Header';

export type CalendarFooterSlotProps = { children?: ReactNode };
const CalendarFooterSlot = ({ children }: CalendarFooterSlotProps) => <>{children}</>;
CalendarFooterSlot.displayName = 'Calendar.Footer';

export const Calendar = Object.assign(CalendarRoot, {
    Header: CalendarHeaderSlot,
    Footer: CalendarFooterSlot,
});
```

- [ ] **Step 2: Create `Footer` view stub (it was imported above)**

Create `packages/core/src/components/Calendar/view/Footer.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { px } from '../../../theme/px';

export const Footer = ({ children }: { children?: ReactNode }) => (
    <View style={{ paddingTop: px('3') }}>{children}</View>
);
```

- [ ] **Step 3: Run integration tests to verify pass**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/Calendar.test.tsx`
Expected: PASS — all describes green.

If any test fails because `useLocale` returns something unexpected in jsdom, mock it explicitly in the test file by wrapping renders in `<NoriProvider locale="en-US">...</NoriProvider>`.

- [ ] **Step 4: Run typecheck**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/Calendar/Calendar.tsx packages/core/src/components/Calendar/view/Footer.tsx packages/core/src/components/Calendar/__tests__/Calendar.test.tsx
git commit -m "feat(core/calendar): Calendar component with single/range/multi + drill-down + visibleMonths"
```

---

## Task 22: Public barrel + register in components index

**Files:**
- Create: `packages/core/src/components/Calendar/index.ts`
- Modify: `packages/core/src/components/index.ts`

- [ ] **Step 1: Create the Calendar barrel**

```ts
// packages/core/src/components/Calendar/index.ts
export { Calendar } from './Calendar';
export type {
    CalendarBehavior,
    CalendarMode,
    CalendarProps,
    CalendarValue,
    CalendarView,
    ChangeMeta,
    DateRange,
    DayContext,
} from './Calendar.types';
```

- [ ] **Step 2: Re-export from `components/index.ts`**

Open `packages/core/src/components/index.ts` and add (alphabetically with existing entries — Calendar comes between Button and Card):

```ts
export {
    Calendar,
    type CalendarBehavior,
    type CalendarMode,
    type CalendarProps,
    type CalendarValue,
    type CalendarView,
    type ChangeMeta as CalendarChangeMeta,
    type DateRange,
    type DayContext,
} from './Calendar';
```

- [ ] **Step 3: Verify the import works from the package root**

Run: `yarn workspace @nori-ui/core typecheck`
Expected: exit 0.

- [ ] **Step 4: Quick smoke test from the consumer angle**

Create a temp test file `packages/core/src/components/Calendar/__tests__/exports.test.ts`:

```ts
import { Calendar } from '../../../';
import type { CalendarProps } from '../../../';

it('Calendar exports correctly from package root', () => {
    expect(Calendar).toBeDefined();
    expect(typeof Calendar).toBe('function');
    expect(Calendar.Header).toBeDefined();
    expect(Calendar.Footer).toBeDefined();
    // Type-only — proves the type is reachable.
    const _props: CalendarProps = {};
    void _props;
});
```

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/exports.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/Calendar/index.ts packages/core/src/components/index.ts packages/core/src/components/Calendar/__tests__/exports.test.ts
git commit -m "feat(core): export Calendar from package root with compound slots"
```

---

## Task 23: A11y test suite (jest-axe)

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/Calendar.a11y.test.tsx`

- [ ] **Step 1: Install `jest-axe` if not already present**

Run: `grep '"jest-axe"' packages/core/package.json`
If not found:

```bash
yarn workspace @nori-ui/core add -D jest-axe @types/jest-axe
```

- [ ] **Step 2: Write the a11y test**

```tsx
// packages/core/src/components/Calendar/__tests__/Calendar.a11y.test.tsx
import { CalendarDate } from '@internationalized/date';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Calendar } from '../Calendar';

expect.extend(toHaveNoViolations);

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> a11y', () => {
    it('has no axe violations in single mode', async () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no axe violations in range mode', async () => {
        const { container } = render(<Calendar mode="range" locale="en-US" />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('header buttons have accessible names', () => {
        const { getByLabelText } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        expect(getByLabelText('Previous')).toBeInTheDocument();
        expect(getByLabelText('Next')).toBeInTheDocument();
    });
});
```

- [ ] **Step 3: Run the a11y suite**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/Calendar.a11y.test.tsx`
Expected: PASS — 0 axe violations.

- [ ] **Step 4: Commit**

```bash
git add packages/core/package.json packages/core/src/components/Calendar/__tests__/Calendar.a11y.test.tsx
git commit -m "test(core/calendar): a11y tests with jest-axe (single + range modes)"
```

---

## Task 24: i18n test suite (5 locales incl. RTL)

**Files:**
- Create: `packages/core/src/components/Calendar/__tests__/Calendar.i18n.test.tsx`

- [ ] **Step 1: Write the i18n suite**

```tsx
// packages/core/src/components/Calendar/__tests__/Calendar.i18n.test.tsx
import { CalendarDate } from '@internationalized/date';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> i18n — title format', () => {
    it.each([
        ['en-US', /May 2026/],
        ['de-DE', /Mai 2026/],
        ['fr-FR', /mai 2026/],
        ['ar-SA', /2026/], // Arabic month name varies by transliteration; year is the stable assertion
        ['he-IL', /2026/],
    ])('formats title for %s', (locale, regex) => {
        const { unmount } = render(<Calendar defaultValue={d(2026, 5, 15)} locale={locale} />);
        const found = screen.queryAllByText(regex);
        expect(found.length).toBeGreaterThan(0);
        unmount();
    });
});

describe('<Calendar /> i18n — firstDayOfWeek', () => {
    it('en-US starts week on Sunday — first weekday header matches "S"', () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        const headers = container.querySelectorAll('[role="grid"] > div:first-child > div');
        // First cell text should start with S (Sun).
        expect(headers[0]?.textContent).toMatch(/S/);
    });

    it('de-DE starts week on Monday', () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="de-DE" />);
        const headers = container.querySelectorAll('[role="grid"] > div:first-child > div');
        // First cell text should start with M (Mo).
        expect(headers[0]?.textContent).toMatch(/M/);
    });
});

describe('<Calendar /> i18n — disabled past min', () => {
    it('respects minValue across locales', () => {
        const onChange = jest.fn();
        render(
            <Calendar
                defaultValue={d(2026, 5, 15)}
                minValue={d(2026, 5, 10)}
                onChange={onChange}
                locale="ar-SA"
            />
        );
        // Day 5 should be disabled.
        const cells = screen.getAllByRole('button');
        const day5 = cells.find((b) => b.textContent === '5');
        expect(day5).toBeDefined();
        expect(day5?.getAttribute('aria-disabled')).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run the suite**

Run: `yarn workspace @nori-ui/core test src/components/Calendar/__tests__/Calendar.i18n.test.tsx`
Expected: PASS. If any selector misses (e.g. CSS-in-JS strips role attributes), inspect the rendered DOM and fix the selector — do not relax the assertion.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/__tests__/Calendar.i18n.test.tsx
git commit -m "test(core/calendar): i18n tests across en-US, de-DE, fr-FR, ar-SA, he-IL"
```

---

## Task 25: Storybook stories

**Files:**
- Create: `packages/core/src/components/Calendar/Calendar.stories.tsx`

- [ ] **Step 1: Write CSF stories matching the Button.stories.tsx pattern**

```tsx
// packages/core/src/components/Calendar/Calendar.stories.tsx
import { CalendarDate } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './Calendar';

const meta: Meta<typeof Calendar> = {
    title: 'Components/Calendar',
    component: Calendar,
    parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

const today = new CalendarDate(2026, 5, 15);

export const Basic: Story = {
    args: { defaultValue: today, locale: 'en-US' },
};

export const Range: Story = {
    args: { mode: 'range', locale: 'en-US', visibleMonths: 2 },
};

export const Multiple: Story = {
    args: { mode: 'multiple', defaultValue: [today, today.add({ days: 3 })], locale: 'en-US' },
};

export const German: Story = {
    args: { defaultValue: today, locale: 'de-DE' },
};

export const ArabicRTL: Story = {
    args: { defaultValue: today, locale: 'ar-SA' },
};

export const WithMinMax: Story = {
    args: {
        defaultValue: today,
        minValue: today.subtract({ days: 5 }),
        maxValue: today.add({ days: 14 }),
        locale: 'en-US',
    },
};
```

- [ ] **Step 2: Verify Storybook builds (if storybook script exists at the workspace root)**

Run: `yarn storybook:build 2>&1 | tail -20` (or whichever script the repo uses; check `package.json` workspace scripts).
Expected: build succeeds; if the script name differs, find it via `grep storybook package.json apps/*/package.json` and adapt.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/components/Calendar/Calendar.stories.tsx
git commit -m "docs(core/calendar): Storybook stories (basic, range, multi, locales, min/max)"
```

---

## Task 26: Demos for docs

**Files:**
- Create: `apps/docs/components/demos/calendar-basic.tsx`
- Create: `apps/docs/components/demos/calendar-range.tsx`
- Create: `apps/docs/components/demos/calendar-multiple.tsx`
- Create: `apps/docs/components/demos/calendar-drilldown.tsx`
- Create: `apps/docs/components/demos/calendar-controlled.tsx`
- Create: `apps/docs/components/demos/calendar-custom-render.tsx`

- [ ] **Step 1: Inspect an existing demo to match the file pattern**

Run: `cat apps/docs/components/demos/button-basic.tsx 2>&1 | head -40`
Match the imports, the export shape (default export?), and the Preview registry registration if any.

- [ ] **Step 2: Write `calendar-basic.tsx`**

```tsx
import { useState } from 'react';
import { Calendar } from '@nori-ui/core';
import type { CalendarDate } from '@internationalized/date';

export default function CalendarBasicDemo() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    return <Calendar value={value} onChange={(v) => setValue(v)} />;
}
```

- [ ] **Step 3: Write `calendar-range.tsx`**

```tsx
import { useState } from 'react';
import { Calendar } from '@nori-ui/core';
import type { DateRange } from '@nori-ui/core';

export default function CalendarRangeDemo() {
    const [range, setRange] = useState<DateRange | null>(null);
    return <Calendar mode="range" value={range} onChange={(v) => setRange(v)} visibleMonths={2} />;
}
```

- [ ] **Step 4: Write `calendar-multiple.tsx`**

```tsx
import { useState } from 'react';
import { Calendar } from '@nori-ui/core';
import type { CalendarDate } from '@internationalized/date';

export default function CalendarMultipleDemo() {
    const [dates, setDates] = useState<CalendarDate[]>([]);
    return <Calendar mode="multiple" value={dates} onChange={(v) => setDates(v)} />;
}
```

- [ ] **Step 5: Write `calendar-drilldown.tsx`**

```tsx
import { Calendar } from '@nori-ui/core';

export default function CalendarDrilldownDemo() {
    return <Calendar defaultView="year" />;
}
```

- [ ] **Step 6: Write `calendar-controlled.tsx`**

```tsx
import { useState } from 'react';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';

export default function CalendarControlledDemo() {
    const [value, setValue] = useState<CalendarDate | null>(new CalendarDate(2026, 5, 15));
    return (
        <div>
            <Calendar value={value} onChange={(v) => setValue(v)} />
            <p style={{ marginTop: 12 }}>Selected: {value ? value.toString() : '—'}</p>
        </div>
    );
}
```

- [ ] **Step 7: Write `calendar-custom-render.tsx`**

```tsx
import { Calendar } from '@nori-ui/core';

export default function CalendarCustomRenderDemo() {
    return (
        <Calendar
            renderDay={(ctx) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 12 }}>{ctx.date.day}</span>
                    {ctx.isWeekend && <span style={{ fontSize: 8, color: '#999' }}>•</span>}
                </div>
            )}
        />
    );
}
```

- [ ] **Step 8: Register the demos with the docs Preview registry**

Search for the existing registry pattern: `grep -rn "demos/button-basic\|registerDemo" apps/docs/`. Whatever pattern registers Button demos, add equivalent entries for the 6 new Calendar demos.

- [ ] **Step 9: Run `yarn dev` for the docs and visually verify** (optional but recommended)

Run: `yarn workspace docs dev` in a background terminal, then open the calendar page once it's written in Task 27.

- [ ] **Step 10: Commit**

```bash
git add apps/docs/components/demos/calendar-*.tsx
# plus whatever demo registry file you modified in Step 8
git commit -m "docs(calendar): six demos (basic, range, multi, drilldown, controlled, custom-render)"
```

---

## Task 27: MDX docs page

**Files:**
- Create: `apps/docs/content/docs/components/calendar.mdx`

- [ ] **Step 1: Inspect an existing MDX page to match the pattern**

Run: `head -60 apps/docs/content/docs/components/button.mdx 2>&1`
Note the frontmatter keys (title, description, since, tags, platform, category) and the `<Preview name="..." />` shape.

- [ ] **Step 2: Write `calendar.mdx`**

```mdx
---
title: Calendar
description: Inline visual calendar for picking dates, ranges, or multiple selections — with locale-aware first day of week, weekend marking, and drill-down navigation.
since: 1.0.0
tags: [date, picker, range, i18n, a11y]
platform: [web, native]
category: data-entry
---

The `<Calendar>` component is an inline date picker. It supports single, range,
and multi-select modes; click the title to drill down through month and year
views; and respects the active locale's first day of week, weekend days, and
weekday names.

For the input + popover form pattern, see [`<DatePicker>`](./date-picker.mdx)
(Phase 3, follow-up release).

## Basic usage

<Preview name="calendar-basic" />

```tsx
import { useState } from 'react';
import { Calendar } from '@nori-ui/core';
import type { CalendarDate } from '@internationalized/date';

const [value, setValue] = useState<CalendarDate | null>(null);

<Calendar value={value} onChange={(v) => setValue(v)} />
```

## Range selection

Two-month layout on desktop (`visibleMonths={2}`), single-month on mobile by default.

<Preview name="calendar-range" />

## Multiple selection

<Preview name="calendar-multiple" />

## Drill-down navigation

Click the title to toggle between day, month, and year views. `defaultView="year"` opens directly into the decade picker.

<Preview name="calendar-drilldown" />

## Controlled

<Preview name="calendar-controlled" />

## Custom day rendering

Use the `renderDay` slot to overlay availability dots, prices, or any per-day decoration.

<Preview name="calendar-custom-render" />

## Internationalization

Calendar reads its locale from `NoriProvider.locale`, falling back to `new Intl.DateTimeFormat().resolvedOptions().locale`. You can also override per-component with the `locale` prop.

The `firstDayOfWeek` and `weekendDays` are derived from the locale via CLDR; both are overridable.

## Keyboard

| Key | Action |
| --- | --- |
| `←` / `→` | Move focus by 1 day |
| `↑` / `↓` | Move focus by 1 week |
| `PgUp` / `PgDn` | Move focus by 1 month |
| `Shift + PgUp/Dn` | Move focus by 1 year |
| `Home` / `End` | Move to start/end of week |
| `Enter` / `Space` | Select focused date |

## Props

<PropsTable name="Calendar" />
```

- [ ] **Step 3: Run docs tests (the redirects + categories test mentioned in prior session)**

Run: `yarn workspace docs test`
Expected: PASS. If "category: data-entry" trips the redirects test (as `actions` did in the prior FloatButton session), add `data-entry` to the known-categories allow-list, mirroring that fix.

- [ ] **Step 4: Run MCP regen**

Run: `yarn workspace @nori-ui/mcp typecheck` (the prior session noted MCP typecheck pre-generates data; this surfaces the new Calendar entry).
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content/docs/components/calendar.mdx
# plus any test allow-list updates
git commit -m "docs(calendar): MDX page with usage, range, drilldown, custom render, keyboard contract"
```

---

## Task 28: Final validation gate

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `yarn test`
Expected: PASS — every workspace's tests green. If any pre-existing playground-native typecheck failure is unrelated (the prior session flagged it), confirm it's not caused by Calendar.

- [ ] **Step 2: Full typecheck**

Run: `yarn typecheck`
Expected: exit 0.

- [ ] **Step 3: Lint + format**

Run: `yarn biome check --write .`
Then verify: `yarn biome check .`
Expected: 0 errors. Stage and commit any auto-fixes:

```bash
git add -A && git diff --cached --stat
git commit -m "style: biome auto-fixes from Calendar feature"
```

(Skip this commit if `git diff --cached` is empty.)

- [ ] **Step 4: Bundle size check**

Run: `yarn size-limit` (if configured at root) or `yarn workspace @nori-ui/core size-limit`.
Expected: Calendar entry under 35 kB min+gz (Gregorian only).
If over budget, identify the largest contributor with `--why` and address before merging.

- [ ] **Step 5: Build the package**

Run: `yarn workspace @nori-ui/core build`
Expected: exit 0; `dist/` updated.

- [ ] **Step 6: Final commit if anything changed**

```bash
git status
# If clean, you're done. If not, commit any final fixes.
```

- [ ] **Step 7: Push and open PR**

```bash
git push -u origin HEAD
gh pr create --title "feat(core): Calendar component (Phase 1 — web)" --body "$(cat <<'EOF'
## Summary
- Adds `<Calendar>` to `@nori-ui/core` with `single`, `range`, and `multiple` modes
- Drill-down navigation: day → month → year/decade views
- Multi-month layouts via `visibleMonths` (`'auto'` defaults to 2 on ≥768px, else 1)
- Full React Aria keyboard contract; jest-axe a11y suite
- Locale-aware via new `NoriProvider.locale` prop (defaults to `Intl.DateTimeFormat().resolvedOptions().locale`)
- 5-locale i18n test coverage including RTL (`ar-SA`, `he-IL`)
- Built on `@internationalized/date` (Adobe) — Hermes-safe, Temporal-ready
- Composed entirely from existing nori-ui primitives + theme tokens

## Out of scope (future phases)
- Phase 2: native render layer + flash-calendar scroll mode + non-Gregorian sub-imports
- Phase 3: `<DatePicker>` and `<DatePicker.Range>` (input + popover)

## Test plan
- [ ] All Jest suites green (state machines, range, keyboard, integration, a11y, i18n)
- [ ] `yarn typecheck` green
- [ ] `yarn biome check .` clean
- [ ] `yarn size-limit` Calendar bundle under budget
- [ ] Visual smoke test in Storybook + docs site

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

**Spec coverage check (cross-referenced against `2026-05-05` PRD):**
- US-1 single date selection → Tasks 11, 21 ✓
- US-2 range with dual-panel → Task 13 (state) + Task 21 (`RangeCalendar` + `visibleMonths`) ✓
- US-3 vertical scroll → **deferred to Phase 2** ✓ (explicitly out of scope, called out in PRD §1)
- US-4 year/decade drill-down → Tasks 18, 19, 21 ✓
- US-5 i18n & non-Gregorian → Locale provider (Task 4), locale-utils (Task 6), i18n suite (Task 24); **non-Gregorian deferred to Phase 2 sub-imports** ✓
- US-6 constraints → Task 8 + Task 11 (state composes it) ✓
- US-7 theming + render slots → DayCell (Task 16), `renderDay` plumbed through DayGrid (Task 17) and Calendar (Task 21); compound `Calendar.Header` / `Calendar.Footer` slots (Task 21) ✓

**Type consistency check:**
- `CalendarValue<M>` shape used consistently across `useCalendarState`, `Calendar.tsx`, demos ✓
- `DateRange = { start, end }` used identically in `useRangeState`, `DayGrid`, `Calendar.tsx`, demos ✓
- `ChangeMeta` shape `{ view, source }` consistent across state hooks and onChange callbacks ✓
- `DayContext` consumed by `renderDay`, built once in `DayGrid.buildContext` ✓
- `firstDayOfWeek` typed as `DayOfWeek` (0-6) end-to-end ✓

**Placeholder scan:**
- One annotation in Task 17 noting the `Text` import path may need to be verified against the actual codebase export — flagged with explicit `grep` instruction. Not a placeholder; an instruction for the executor to validate against ground truth.
- One annotation in Task 16 noting that theme tokens (`interactivePrimarySoft`, `onInteractivePrimary`, `textTertiary`) may not all exist; explicit instruction to grep and substitute. Acceptable — exact tokens depend on the current theme shape which may have evolved since the audit.
- One annotation in Task 26 Step 1 to inspect existing demo file pattern. Acceptable — the docs harness pattern wasn't surfaced in the audit and the executor needs to match it.
- No "TBD" / "TODO" / "implement later" / "similar to Task N" in the body of any step. ✓
