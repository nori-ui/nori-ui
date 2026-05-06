'use client';

import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, today } from '@internationalized/date';
import { useCallback, useMemo, useState } from 'react';
import type { CalendarMode, CalendarValue, CalendarView, ChangeMeta } from '../Calendar.types';
import { type Constraints, composeUnavailable } from './constraints';

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
    if (!value) {
        return fallback;
    }
    if (mode === 'single') {
        return (value as CalendarDate | null) ?? fallback;
    }
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
        if (props.value !== undefined) {
            return props.value;
        }
        if (props.defaultValue !== undefined) {
            return props.defaultValue;
        }
        return (mode === 'multiple' ? [] : null) as CalendarValue<M>;
    });
    const isControlled = props.value !== undefined;
    const value = isControlled ? (props.value as CalendarValue<M>) : internalValue;

    const [internalView, setInternalView] = useState<CalendarView>(props.defaultView ?? 'day');
    const isViewControlled = props.view !== undefined;
    const view = isViewControlled ? (props.view as CalendarView) : internalView;

    const [focusedDate, setFocusedDate] = useState<CalendarDate>(() => initialFocus(mode, value, fallback));

    const isUnavailable = useMemo(
        () =>
            composeUnavailable({
                ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
                ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
                ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
            }),
        [props.minValue, props.maxValue, props.isDateUnavailable]
    );

    const setView = useCallback(
        (next: CalendarView) => {
            if (!isViewControlled) {
                setInternalView(next);
            }
            props.onViewChange?.(next);
        },
        [isViewControlled, props.onViewChange]
    );

    const moveFocus = useCallback(
        (delta: FocusDelta) => {
            setFocusedDate((cur) => {
                let next = cur;
                if (delta.days) {
                    next = next.add({ days: delta.days });
                }
                if (delta.weeks) {
                    next = next.add({ weeks: delta.weeks });
                }
                if (delta.months) {
                    next = next.add({ months: delta.months });
                }
                if (delta.years) {
                    next = next.add({ years: delta.years });
                }
                if (!isUnavailable(next)) {
                    return next;
                }
                // Target is disabled — scan in the direction of motion for
                // the next available date. Cap at ~100 days so a wide
                // disabled range doesn't loop forever; if nothing's
                // available within the cap, leave focus where it was.
                const totalDelta =
                    (delta.days ?? 0) + (delta.weeks ?? 0) * 7 + (delta.months ?? 0) * 30 + (delta.years ?? 0) * 365;
                const sign = totalDelta >= 0 ? 1 : -1;
                for (let i = 1; i <= 100; i++) {
                    const candidate = next.add({ days: sign * i });
                    if (!isUnavailable(candidate)) {
                        return candidate;
                    }
                }
                return cur;
            });
        },
        [isUnavailable]
    );

    const selectDate = useCallback(
        (date: CalendarDate, source: ChangeMeta['source']) => {
            if (isUnavailable(date)) {
                return;
            }
            const meta: ChangeMeta = { view, source };
            let next: CalendarValue<M>;
            if (mode === 'single') {
                next = date as CalendarValue<M>;
            } else if (mode === 'multiple') {
                const arr = (value as CalendarDate[]) ?? [];
                const exists = arr.some((d) => d.compare(date) === 0);
                next = (exists ? arr.filter((d) => d.compare(date) !== 0) : [...arr, date]) as CalendarValue<M>;
            } else {
                // range mode is delegated to useRangeState
                return;
            }
            if (!isControlled) {
                setInternalValue(next);
            }
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
