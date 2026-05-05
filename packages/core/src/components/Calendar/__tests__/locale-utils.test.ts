import { CalendarDate } from '@internationalized/date';
import { formatMonthYearTitle, formatWeekdayNames, getFirstDayOfWeek, getWeekendDays } from '../state/locale-utils';

describe('getFirstDayOfWeek', () => {
    it.each([
        ['en-US', 0], // Sunday
        ['de-DE', 1], // Monday
        ['fr-FR', 1], // Monday
        ['ar-SA', 0], // Sunday — CLDR (post-2013 Saudi calendar reform)
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
