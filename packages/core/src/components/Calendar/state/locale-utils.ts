import type { CalendarDate } from '@internationalized/date';

/**
 * Day of week index where 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * Matches `Date.prototype.getDay()` semantics.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The weekday a calendar week begins on for the given locale, per CLDR.
 * Examples: en-US → 0 (Sun), de-DE → 1 (Mon), fa-IR → 6 (Sat).
 *
 * Trusts `Intl.Locale#getWeekInfo` as the authoritative source. Falls back
 * to a small lookup only when CLDR data is unavailable (e.g. Hermes on
 * Android with bundled ICU gaps).
 */
export const getFirstDayOfWeek = (locale: string): DayOfWeek => {
    try {
        // biome-ignore lint/suspicious/noExplicitAny: weekInfo is in the spec but TS lib types lag
        const loc = new Intl.Locale(locale) as any;
        const info = loc.getWeekInfo?.() ?? loc.weekInfo;
        if (typeof info?.firstDay === 'number') {
            // CLDR uses 1=Mon..7=Sun; convert to 0=Sun..6=Sat.
            return (info.firstDay === 7 ? 0 : info.firstDay) as DayOfWeek;
        }
    } catch {
        // fall through
    }
    // Fallback for environments without CLDR weekInfo (e.g. some Hermes builds).
    return FIRST_DAY_FALLBACK[locale] ?? FIRST_DAY_FALLBACK[locale.split('-')[0] ?? ''] ?? 1;
};

/**
 * Last-resort lookup when `Intl.Locale#getWeekInfo` is unavailable. Values
 * are 0=Sun..6=Sat. Keep small — only enough to keep the calendar usable
 * if the runtime has no CLDR data at all.
 */
const FIRST_DAY_FALLBACK: Record<string, DayOfWeek> = {
    en: 0,
    'en-US': 0,
    'en-CA': 0,
    'en-GB': 1,
    'en-AU': 1,
    de: 1,
    fr: 1,
    ja: 0,
    ar: 0,
    he: 0,
    fa: 6,
};

/**
 * The two days CLDR considers weekend in this locale (e.g. [6, 0] for
 * en-US = Sat+Sun; [5, 6] for ar-SA = Fri+Sat).
 *
 * Falls back to a small lookup when `Intl.Locale#getWeekInfo` is unavailable
 * (notably Hermes Android in some configurations).
 */
export const getWeekendDays = (locale: string): [DayOfWeek, DayOfWeek] => {
    try {
        // biome-ignore lint/suspicious/noExplicitAny: weekInfo is in the spec but TS lib types lag
        const loc = new Intl.Locale(locale) as any;
        const info = loc.getWeekInfo?.() ?? loc.weekInfo;
        if (info?.weekend && Array.isArray(info.weekend) && info.weekend.length === 2) {
            // CLDR uses 1=Mon..7=Sun; convert to 0=Sun..6=Sat.
            const [a, b] = info.weekend.map((d: number) => (d === 7 ? 0 : d) as DayOfWeek);
            return [a, b];
        }
    } catch {
        // fall through
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
    'fa-IR': [4, 5],
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

/** "May 2026" / "Mai 2026" / "mai 2026" — for the calendar header. */
export const formatMonthYearTitle = (date: CalendarDate, locale: string): string => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    return fmt.format(date.toDate('UTC'));
};

/** Twelve full month names in the active locale. */
export const formatMonthNames = (locale: string): string[] => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(Date.UTC(2026, m, 15))));
};

/** "May 5, 2026" — for screen-reader announcements of the focused date. */
export const formatFullDate = (date: CalendarDate, locale: string): string => {
    const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
    return fmt.format(date.toDate('UTC'));
};
