'use client';

import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, startOfMonth, today } from '@internationalized/date';
import { type ReactNode, useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import type { CalendarMode, CalendarValue, DateRange, DayContext } from '../Calendar.types';
import { type DayOfWeek, formatWeekdayNames, getFirstDayOfWeek } from '../state/locale-utils';
import { DayCell } from './DayCell';

type DayGridProps<M extends CalendarMode> = {
    visibleMonth: CalendarDate;
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
    if (!range?.end) {
        return false;
    }
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

// Stable row keys for the 6-row grid — never reorder, never change count.
const ROW_KEYS = ['row-0', 'row-1', 'row-2', 'row-3', 'row-4', 'row-5'] as const;

export const DayGrid = <M extends CalendarMode>(props: DayGridProps<M>) => {
    const {
        visibleMonth,
        locale,
        mode,
        value,
        previewRange,
        focusedDate,
        isUnavailable,
        weekendDays,
        firstDayOfWeek,
        onDayPress,
        onDayHover,
        renderDay,
    } = props;

    const fdow = firstDayOfWeek ?? getFirstDayOfWeek(locale);

    const cells = useMemo<CalendarDate[]>(() => {
        const start = startOfMonth(visibleMonth);
        const startDow = start.toDate('UTC').getUTCDay() as DayOfWeek;
        const back = (startDow - fdow + 7) % 7;
        const first = start.subtract({ days: back });
        const total = 42; // 6 rows × 7 — handles all month layouts
        return Array.from({ length: total }, (_, i) => first.add({ days: i }));
    }, [visibleMonth, fdow]);

    const weekdayNames = useMemo(() => formatWeekdayNames(locale), [locale]);
    const todayDate = useMemo(() => today(getLocalTimeZone()), []);

    return (
        <View role="grid" style={{ width: 7 * 36 }}>
            <View role="row" style={{ flexDirection: 'row' }}>
                {weekdayNames.map((name) => (
                    // Weekday short-names are unique within a locale (7 distinct values).
                    <View key={name} style={{ width: 36, alignItems: 'center' }}>
                        <View style={{ paddingVertical: 4 }}>
                            <RNText style={{ fontSize: 12, opacity: 0.7 }}>{name}</RNText>
                        </View>
                    </View>
                ))}
            </View>
            {ROW_KEYS.map((rowKey, row) => (
                <View key={rowKey} role="row" style={{ flexDirection: 'row' }}>
                    {cells.slice(row * 7, row * 7 + 7).map((date) => {
                        const ctx = buildContext(date, {
                            visibleMonth,
                            mode,
                            value,
                            ...(previewRange !== undefined ? { previewRange } : {}),
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
                                {...(onDayHover
                                    ? {
                                          onHoverIn: () => onDayHover(date),
                                          onHoverOut: () => onDayHover(null),
                                      }
                                    : {})}
                                {...(renderDay ? { renderDay } : {})}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
