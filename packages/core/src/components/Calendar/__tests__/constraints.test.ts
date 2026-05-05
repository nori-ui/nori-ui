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
