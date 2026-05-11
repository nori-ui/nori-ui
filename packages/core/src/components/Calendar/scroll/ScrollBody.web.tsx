'use client';

import type { CalendarDate } from '@internationalized/date';
import { type ReactElement, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { CalendarMode } from '../Calendar.types';
import { DayGrid } from '../view/DayGrid';
import { SCROLL_FUTURE_MONTHS, SCROLL_PAST_MONTHS } from './constants';
import type { ScrollBodyProps } from './ScrollBody';

const buildMonthList = (anchor: CalendarDate, past: number, future: number): CalendarDate[] => {
    const out: CalendarDate[] = [];
    for (let i = -past; i <= future; i += 1) {
        out.push(anchor.add({ months: i }));
    }
    return out;
};

const monthIso = (m: CalendarDate): string => `${m.year}-${String(m.month).padStart(2, '0')}`;

export const ScrollBody = <M extends CalendarMode>(props: ScrollBodyProps<M>): ReactElement => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const months = useMemo(
        () => buildMonthList(props.focusedDate.set({ day: 1 }), SCROLL_PAST_MONTHS, SCROLL_FUTURE_MONTHS),
        [props.focusedDate]
    );

    const onFocusedMonthChange = props.onFocusedMonthChange;
    const focusedDate = props.focusedDate;

    useEffect(() => {
        const root = containerRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') {
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                const top = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (!top) {
                    return;
                }
                const iso = (top.target as HTMLElement).dataset.monthIso;
                if (!iso) {
                    return;
                }
                const [yRaw, mRaw] = iso.split('-');
                const y = Number.parseInt(yRaw ?? '', 10);
                const m = Number.parseInt(mRaw ?? '', 10);
                if (!Number.isFinite(y) || !Number.isFinite(m)) {
                    return;
                }
                onFocusedMonthChange(focusedDate.set({ year: y, month: m, day: 1 }), {
                    view: 'day',
                    source: 'scroll',
                });
            },
            { root, threshold: [0, 0.5, 1] }
        );
        root.querySelectorAll<HTMLElement>('[data-month-panel]').forEach((el) => {
            io.observe(el);
        });
        return () => io.disconnect();
    }, [onFocusedMonthChange, focusedDate]);

    const focusedMonthKey = monthIso(props.focusedDate);

    // Scroll the focused-month panel into view on mount and whenever the
    // focused month key changes. Intentionally no dep array — when consumers
    // swap the calendar via `defaultValue` (mount-shaped change), the effect
    // should still surface the target panel even if the derived key string
    // happens to compare equal.
    useEffect(() => {
        const root = containerRef.current;
        if (!root) {
            return;
        }
        const target = root.querySelector<HTMLElement>(`[data-month-iso="${focusedMonthKey}"]`);
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    const buildIsUnavailable = (): ((date: CalendarDate) => boolean) => {
        const minV = props.minValue;
        const maxV = props.maxValue;
        const fn = props.isDateUnavailable;
        return (date: CalendarDate) => {
            if (minV && date.compare(minV) < 0) {
                return true;
            }
            if (maxV && date.compare(maxV) > 0) {
                return true;
            }
            return fn ? fn(date) : false;
        };
    };
    const isUnavailable = buildIsUnavailable();

    // We mix both `dataSet` (which RN-Web turns into `data-*` attributes in
    // a real browser bundle) and raw `data-*` props (which our jest-side
    // react-native mock forwards verbatim to the underlying DOM tag). Both
    // shapes converge on the same DOM attribute, so production and tests
    // see identical selectors.
    const containerExtra = {
        dataSet: { scrollContainer: '' },
        'data-scroll-container': '',
    } as unknown as Record<string, unknown>;

    return (
        <View
            ref={containerRef as unknown as React.Ref<View>}
            style={{ height: 480, overflow: 'scroll' as const }}
            {...containerExtra}
        >
            {months.map((m) => {
                const iso = monthIso(m);
                const rowExtra = {
                    dataSet: { scrollRow: '' },
                    'data-scroll-row': '',
                } as unknown as Record<string, unknown>;
                const panelExtra = {
                    dataSet: {
                        monthIso: iso,
                        monthPanel: '',
                        focusedMonth: iso === focusedMonthKey ? 'true' : 'false',
                    },
                    'data-month-iso': iso,
                    'data-month-panel': '',
                    'data-focused-month': iso === focusedMonthKey ? 'true' : 'false',
                } as unknown as Record<string, unknown>;
                return (
                    <View key={iso} {...rowExtra}>
                        <View {...panelExtra}>
                            <DayGrid
                                visibleMonth={m}
                                locale={props.locale}
                                mode={props.mode}
                                value={props.value}
                                focusedDate={props.focusedDate}
                                isUnavailable={isUnavailable}
                                weekendDays={props.weekendDays}
                                firstDayOfWeek={props.firstDayOfWeek}
                                onDayPress={props.onSelectDate}
                                {...(props.previewRange !== undefined ? { previewRange: props.previewRange } : {})}
                                {...(props.renderDay !== undefined ? { renderDay: props.renderDay } : {})}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
};
