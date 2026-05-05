'use client';

import type { CalendarDate } from '@internationalized/date';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeMeta, DateRange } from '../Calendar.types';
import { type Constraints, composeUnavailable } from './constraints';

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

const order = (a: CalendarDate, b: CalendarDate): [CalendarDate, CalendarDate] => (a.compare(b) <= 0 ? [a, b] : [b, a]);

const nightsBetween = (a: CalendarDate, b: CalendarDate): number => {
    const [first, last] = order(a, b);
    return Math.round((last.toDate('UTC').getTime() - first.toDate('UTC').getTime()) / 86400000);
};

export const useRangeState = (props: UseRangeStateProps): UseRangeStateReturn => {
    const [internal, setInternal] = useState<DateRange | null>(props.defaultValue ?? null);
    const isControlled = props.value !== undefined;
    const value = isControlled ? (props.value ?? null) : internal;

    const [hoveredDate, setHoveredDate] = useState<CalendarDate | null>(null);

    const isUnavailable = useMemo(
        () =>
            composeUnavailable({
                ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
                ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
                ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
            }),
        [props.minValue, props.maxValue, props.isDateUnavailable]
    );

    const commit = useCallback(
        (next: DateRange | null, source: ChangeMeta['source']) => {
            if (!isControlled) {
                setInternal(next);
            }
            props.onChange?.(next, { view: 'day', source });
        },
        [isControlled, props.onChange]
    );

    const selectDate = useCallback(
        (date: CalendarDate, source: ChangeMeta['source'] = 'click') => {
            if (isUnavailable(date)) {
                return;
            }

            // No range yet, or both endpoints set → start a fresh selection.
            if (!value || value.end !== null) {
                commit({ start: date, end: null }, source);
                setHoveredDate(null);
                return;
            }

            // We have a pending start, no end yet.
            const nights = nightsBetween(value.start, date);
            if (props.minNights !== undefined && nights < props.minNights) {
                return;
            }
            if (props.maxNights !== undefined && nights > props.maxNights) {
                return;
            }

            const [start, end] = order(value.start, date);
            commit({ start, end }, source);
            setHoveredDate(null);
        },
        [commit, isUnavailable, props.maxNights, props.minNights, value]
    );

    const previewRange = useMemo<DateRange | null>(() => {
        if (!value || value.end !== null || !hoveredDate) {
            return null;
        }
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
