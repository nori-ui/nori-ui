import type { CalendarDate } from '@internationalized/date';

export type Constraints = {
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;
};

const cmp = (a: CalendarDate, b: CalendarDate): number => a.compare(b);

export const isOutOfRange = (date: CalendarDate, bounds: Pick<Constraints, 'minValue' | 'maxValue'> = {}): boolean => {
    if (bounds.minValue && cmp(date, bounds.minValue) < 0) {
        return true;
    }
    if (bounds.maxValue && cmp(date, bounds.maxValue) > 0) {
        return true;
    }
    return false;
};

/**
 * Returns a single predicate that combines minValue/maxValue bounds and
 * a user-provided `isDateUnavailable`. The composed function is what every
 * view layer (DayCell, keyboard nav focus skip, scroll list) consults.
 */
export const composeUnavailable =
    (c: Constraints) =>
    (date: CalendarDate): boolean => {
        if (isOutOfRange(date, c)) {
            return true;
        }
        if (c.isDateUnavailable?.(date)) {
            return true;
        }
        return false;
    };
