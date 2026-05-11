'use client';

import type { CalendarDate } from '@internationalized/date';
import { useMemo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { CalendarMode } from '../Calendar.types';
import { SCROLL_FUTURE_MONTHS, SCROLL_PAST_MONTHS } from './constants';
import type { ScrollBodyProps } from './ScrollBody';

/**
 * Minimal prop surface we use from `@marceloterreiro/flash-calendar`'s
 * `Calendar.List`. The real component accepts many more props (theme, day
 * renderers, etc.); we lean on its sensible defaults for the v1 wrapper.
 */
type FlashCalendarListProps = {
    calendarInitialMonthId: string;
    calendarPastScrollRangeInMonths: number;
    calendarFutureScrollRangeInMonths: number;
    onCalendarDayPress?: (id: string) => void;
};

let cachedCalendarList: ComponentType<FlashCalendarListProps> | null = null;
let resolveAttempted = false;

const resolveCalendarList = (): ComponentType<FlashCalendarListProps> => {
    if (cachedCalendarList) return cachedCalendarList;
    if (resolveAttempted && !cachedCalendarList) {
        throw new Error(
            '[Calendar] behavior="scroll" requires @marceloterreiro/flash-calendar. ' +
                'Install it as a peer dependency: yarn add @marceloterreiro/flash-calendar'
        );
    }
    resolveAttempted = true;
    try {
        // Lazy require so consumers that don't use behavior="scroll" never pay
        // for (or need to install) the peer dep at runtime.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('@marceloterreiro/flash-calendar') as {
            Calendar?: { List?: ComponentType<FlashCalendarListProps> };
        };
        const List = mod?.Calendar?.List;
        if (!List) {
            throw new Error('flash-calendar did not export Calendar.List');
        }
        cachedCalendarList = List;
        return List;
    } catch {
        throw new Error(
            '[Calendar] behavior="scroll" requires @marceloterreiro/flash-calendar. ' +
                'Install it as a peer dependency: yarn add @marceloterreiro/flash-calendar'
        );
    }
};

const monthIdFromDate = (d: CalendarDate): string =>
    `${d.year}-${String(d.month).padStart(2, '0')}-01`;

export const ScrollBody = <M extends CalendarMode>(props: ScrollBodyProps<M>): ReactElement => {
    const CalendarList = resolveCalendarList();
    const initialMonthId = useMemo(() => monthIdFromDate(props.focusedDate), [props.focusedDate]);

    const onDayPress = (id: string): void => {
        const parts = id.split('-');
        const yStr = parts[0];
        const mStr = parts[1];
        const dStr = parts[2];
        if (!yStr || !mStr || !dStr) return;
        const y = Number.parseInt(yStr, 10);
        const m = Number.parseInt(mStr, 10);
        const dd = Number.parseInt(dStr, 10);
        if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(dd)) return;
        const date = props.focusedDate.set({ year: y, month: m, day: dd });
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
