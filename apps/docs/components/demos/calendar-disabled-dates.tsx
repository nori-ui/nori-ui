import type { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

/**
 * Demonstrates `isDateUnavailable` — a synchronous predicate the
 * Calendar consults for every cell. Use it to disable arbitrary date
 * sets (weekends, holidays, server-fetched blocked ranges, etc.).
 *
 * This example: disables every weekend AND a 5-day "blackout" range.
 */
const blackoutStart = new Date();
blackoutStart.setDate(blackoutStart.getDate() + 7);
const blackoutEnd = new Date();
blackoutEnd.setDate(blackoutEnd.getDate() + 12);

const isInBlackout = (date: CalendarDate): boolean => {
    const d = date.toDate('UTC').getTime();
    return (
        d >= Date.UTC(blackoutStart.getFullYear(), blackoutStart.getMonth(), blackoutStart.getDate()) &&
        d <= Date.UTC(blackoutEnd.getFullYear(), blackoutEnd.getMonth(), blackoutEnd.getDate())
    );
};

const isWeekend = (date: CalendarDate): boolean => {
    const dow = date.toDate('UTC').getUTCDay();
    return dow === 0 || dow === 6;
};

export default function CalendarDisabledDates() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    return (
        <Calendar
            value={value}
            onChange={(v) => setValue(v)}
            isDateUnavailable={(d) => isWeekend(d) || isInBlackout(d)}
        />
    );
}
