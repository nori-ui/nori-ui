'use client';

import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useLocale } from '../../i18n/locale';
import { useThemeColors } from '../../theme/use-theme-colors';
import type { CalendarBaseProps, CalendarMode, CalendarValue, CalendarView, DateRange } from './Calendar.types';
import { type DayOfWeek, getFirstDayOfWeek, getWeekendDays } from './state/locale-utils';
import { useCalendarKeyboard } from './state/use-calendar-keyboard';
import { useCalendarState } from './state/use-calendar-state';
import { useRangeState } from './state/use-range-state';
import { Caption } from './view/Caption';
import { CELL_SIZE } from './view/DayCell';
import { DayGrid } from './view/DayGrid';
import { Footer } from './view/Footer';
import { MonthGrid } from './view/MonthGrid';
import { YearGrid } from './view/YearGrid';

// Width constants used to compute the calendar's natural content width and
// to pick a responsive `visibleMonths` based on the parent container width.
const GRID_WIDTH = 7 * CELL_SIZE; // single month grid (7 cols)
const MONTH_GAP = 16;
const ARROW_AREA = 32 + 8; // nav button width + gap to first/last grid edge
const SURFACE_PADDING = 16;
const SURFACE_BORDER = 1;
const requiredOuterWidth = (n: number) =>
    2 * (ARROW_AREA + SURFACE_PADDING + SURFACE_BORDER) + n * GRID_WIDTH + (n - 1) * MONTH_GAP;

// Body fade-up on view/month change. The wrapper's `key` flips on every
// navigation (prev/next, drilldown), forcing a fresh mount; FadeIn starts
// at opacity 0 + 4px down, then bumps to 1 / 0 in an effect so the inline
// transition runs. RN-Web honors transition* style props; native ignores.
const FadeIn = ({ children }: { children: ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);
    return (
        <View
            style={
                {
                    opacity: mounted ? 1 : 0,
                    transform: [{ translateY: mounted ? 0 : 4 }],
                    transitionProperty: 'opacity, transform',
                    transitionDuration: '220ms',
                    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                } as ViewStyle
            }
        >
            {children}
        </View>
    );
};

/**
 * Picks a responsive number of visible months from a measured container
 * width. Used when the consumer doesn't pin `visibleMonths`. Falls back
 * to 1 month while measurement is in flight (initial render) so we never
 * overflow on first paint.
 */
const resolveYearRange = (
    input: [number, number] | undefined,
    minValue: import('@internationalized/date').CalendarDate | undefined,
    maxValue: import('@internationalized/date').CalendarDate | undefined,
    focusedYear: number
): [number, number] => {
    if (input) {
        return input;
    }
    if (minValue && maxValue) {
        return [minValue.year, maxValue.year];
    }
    if (minValue) {
        return [minValue.year, Math.max(minValue.year, focusedYear + 10)];
    }
    if (maxValue) {
        return [Math.min(maxValue.year, focusedYear - 100), maxValue.year];
    }
    return [focusedYear - 100, focusedYear + 10];
};

const pickVisibleMonths = (input: number | 'auto' | undefined, measuredWidth: number | null): number => {
    // `visibleMonths` is treated as a *maximum*: when the parent container
    // is too narrow to fit `target` months side-by-side, we drop to the
    // largest count that fits. `auto` defaults to 2.
    const target = typeof input === 'number' ? input : 2;
    if (measuredWidth == null || measuredWidth === 0) {
        // Pre-measurement (e.g. SSR / jsdom). Trust an explicit number;
        // fall back to 1 for `auto` so we don't overflow on first paint.
        return typeof input === 'number' ? input : 1;
    }
    for (let n = target; n >= 1; n--) {
        if (measuredWidth >= requiredOuterWidth(n)) {
            return n;
        }
    }
    return 1;
};

/**
 * Outer wrapper that measures the available container width and renders
 * the actual Calendar root once the measurement is in. Renders nothing on
 * the first paint to avoid the 1-month → 2-month flash; this is one
 * synchronous re-render after layout, imperceptible in practice.
 */
const CalendarRoot = <M extends CalendarMode = 'single'>(props: CalendarBaseProps<M>) => {
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const next = e.nativeEvent.layout.width;
        setContainerWidth((prev) => (prev === next ? prev : next));
    }, []);

    return (
        <View onLayout={onLayout} style={{ width: '100%' }}>
            <CalendarSurface<M> containerWidth={containerWidth ?? 0} {...props} />
        </View>
    );
};

const CalendarSurface = <M extends CalendarMode = 'single'>(
    props: CalendarBaseProps<M> & { containerWidth: number }
) => {
    const providerLocale = useLocale();
    const locale = props.locale ?? providerLocale;

    if ((props.mode ?? 'single') === 'range') {
        return (
            <RangeCalendar
                {...(props as unknown as CalendarBaseProps<'range'> & { containerWidth: number })}
                locale={locale}
            />
        );
    }
    return (
        <SingleOrMultiCalendar
            {...(props as unknown as CalendarBaseProps<Exclude<CalendarMode, 'range'>> & { containerWidth: number })}
            locale={locale}
        />
    );
};

/**
 * Computes both the inner content width (for centering the body) and the
 * outer surface width (for the bordered card). Both depend on
 * visibleMonths only.
 */
const surfaceMetrics = (visibleMonths: number) => {
    const innerWidth = 2 * ARROW_AREA + visibleMonths * GRID_WIDTH + (visibleMonths - 1) * MONTH_GAP;
    return {
        innerWidth,
        // Body grids row width (excludes arrow area)
        gridsRowWidth: visibleMonths * GRID_WIDTH + (visibleMonths - 1) * MONTH_GAP,
    };
};

const SingleOrMultiCalendar = <M extends Exclude<CalendarMode, 'range'>>(
    props: CalendarBaseProps<M> & { locale: string; containerWidth: number }
) => {
    const { locale, renderDay, containerWidth } = props;
    const colors = useThemeColors();
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

    const visibleMonths = pickVisibleMonths(props.visibleMonths, containerWidth);
    const { innerWidth, gridsRowWidth } = surfaceMetrics(visibleMonths);

    // Anchor month: what the user sees. Decoupled from `state.focusedDate`
    // so selecting a day in the rightmost grid does NOT shift the view.
    // Prev/Next buttons mutate this anchor; selectDate does not.
    const state = useCalendarState<M>({
        ...(props.mode !== undefined ? { mode: props.mode } : {}),
        locale,
        ...(props.value !== undefined ? { value: props.value } : {}),
        ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
        ...(props.onChange !== undefined ? { onChange: props.onChange } : {}),
        ...(props.view !== undefined ? { view: props.view } : {}),
        ...(props.defaultView !== undefined ? { defaultView: props.defaultView } : {}),
        ...(props.onViewChange !== undefined ? { onViewChange: props.onViewChange } : {}),
        ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
        ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
        ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
    });

    const [anchor, setAnchor] = useState<CalendarDate>(state.focusedDate);

    // Snap the anchor when the focused date moves OUTSIDE visible months
    // (only triggered by keyboard nav). We must not re-fire when the
    // anchor changes (prev/next), or arrow navigation would snap right
    // back to the focused month. anchorRef gives us the current value
    // without putting `anchor` in the dependency array.
    const anchorRef = useRef(anchor);
    useEffect(() => {
        anchorRef.current = anchor;
    }, [anchor]);
    useEffect(() => {
        const start = anchorRef.current;
        const end = start.add({ months: visibleMonths });
        if (state.focusedDate.compare(start) < 0 || state.focusedDate.compare(end) >= 0) {
            setAnchor(state.focusedDate);
        }
    }, [state.focusedDate, visibleMonths]);

    const months = useMemo(
        () => Array.from({ length: visibleMonths }, (_, i) => anchor.add({ months: i })),
        [anchor, visibleMonths]
    );

    const keyboard = useCalendarKeyboard({
        focusedDate: state.focusedDate,
        moveFocus: state.moveFocus,
        selectDate: state.selectDate,
        setView: state.setView,
        view: state.view,
        firstDayOfWeek,
    });

    const onPrev = () => {
        if (state.view === 'year') {
            setAnchor((a) => a.add({ years: -10 }));
        } else if (state.view === 'month') {
            setAnchor((a) => a.add({ years: -1 }));
        } else {
            setAnchor((a) => a.add({ months: -1 }));
        }
    };
    const onNext = () => {
        if (state.view === 'year') {
            setAnchor((a) => a.add({ years: 10 }));
        } else if (state.view === 'month') {
            setAnchor((a) => a.add({ years: 1 }));
        } else {
            setAnchor((a) => a.add({ months: 1 }));
        }
    };
    const onTitlePress = () => state.setView(state.view === 'day' ? 'month' : state.view === 'month' ? 'year' : 'day');

    return (
        <View
            ref={props.ref}
            {...(props.testID !== undefined ? { testID: props.testID } : {})}
            // @ts-expect-error onKeyDown is supported by react-native-web on View
            onKeyDown={(e: React.KeyboardEvent) => keyboard.onKeyDown(e)}
            style={{
                padding: SURFACE_PADDING,
                backgroundColor: colors.semantic.background.elevated,
                borderRadius: 16,
                borderWidth: SURFACE_BORDER,
                borderColor: colors.semantic.border.default,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                width: innerWidth + 2 * SURFACE_PADDING + 2 * SURFACE_BORDER,
                maxWidth: '100%',
                alignSelf: 'center',
            }}
        >
            <Caption
                months={months}
                locale={locale}
                view={state.view}
                caption={props.caption ?? 'title'}
                gridWidth={GRID_WIDTH}
                monthGap={MONTH_GAP}
                yearRange={resolveYearRange(props.yearRange, props.minValue, props.maxValue, anchor.year)}
                onPrev={onPrev}
                onNext={onNext}
                onTitlePress={onTitlePress}
                onSetMonth={(slot, m) => {
                    const picked = (months[slot] ?? anchor).set({ month: m, day: 1 });
                    // Subtract slot offset so the picked month stays in the
                    // SAME visible slot the user clicked (not the leftmost).
                    setAnchor(picked.subtract({ months: slot }));
                }}
                onSetYear={(slot, y) => {
                    const picked = (months[slot] ?? anchor).set({ year: y, day: 1 });
                    setAnchor(picked.subtract({ months: slot }));
                }}
            >
                {props.children}
            </Caption>
            <FadeIn key={`smc-${state.view}-${anchor.year}-${anchor.month}`}>
                {state.view === 'day' && (
                    <View style={{ flexDirection: 'row', gap: MONTH_GAP, alignSelf: 'center', width: gridsRowWidth }}>
                        {months.map((m) => (
                            <DayGrid<M>
                                key={`${m.year}-${m.month}`}
                                visibleMonth={m}
                                locale={locale}
                                mode={(props.mode ?? 'single') as M}
                                value={state.value as CalendarValue<M>}
                                focusedDate={state.focusedDate}
                                isUnavailable={state.isUnavailable}
                                weekendDays={weekendDays}
                                firstDayOfWeek={firstDayOfWeek}
                                onDayPress={(date) => state.selectDate(date, 'click')}
                                {...(renderDay ? { renderDay } : {})}
                            />
                        ))}
                    </View>
                )}
                {state.view === 'month' && (
                    <View style={{ alignItems: 'center' }}>
                        <MonthGrid
                            visibleMonth={anchor}
                            locale={locale}
                            availableWidth={gridsRowWidth}
                            onSelect={(month) => {
                                setAnchor(new CalendarDate(anchor.year, month, 1));
                                state.setView('day');
                            }}
                        />
                    </View>
                )}
                {state.view === 'year' && (
                    <View style={{ alignItems: 'center' }}>
                        <YearGrid
                            visibleMonth={anchor}
                            availableWidth={gridsRowWidth}
                            onSelect={(year) => {
                                setAnchor(new CalendarDate(year, anchor.month, 1));
                                state.setView('month');
                            }}
                        />
                    </View>
                )}
                {props.children && (props.caption ?? 'title') !== 'custom' ? <Footer>{props.children}</Footer> : null}
            </FadeIn>
        </View>
    );
};

const RangeCalendar = (props: CalendarBaseProps<'range'> & { locale: string; containerWidth: number }) => {
    const { locale, renderDay, containerWidth } = props;
    const colors = useThemeColors();
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

    const visibleMonths = pickVisibleMonths(props.visibleMonths, containerWidth);
    const { innerWidth, gridsRowWidth } = surfaceMetrics(visibleMonths);

    const range = useRangeState({
        ...(props.value !== undefined ? { value: props.value } : {}),
        ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
        ...(props.onChange !== undefined ? { onChange: props.onChange } : {}),
        ...(props.minValue !== undefined ? { minValue: props.minValue } : {}),
        ...(props.maxValue !== undefined ? { maxValue: props.maxValue } : {}),
        ...(props.isDateUnavailable !== undefined ? { isDateUnavailable: props.isDateUnavailable } : {}),
        ...(props.minNights !== undefined ? { minNights: props.minNights } : {}),
        ...(props.maxNights !== undefined ? { maxNights: props.maxNights } : {}),
    });

    const initialFocus = range.value?.start ?? today(getLocalTimeZone());
    const [focusedDate, setFocusedDate] = useState<CalendarDate>(initialFocus);
    const [anchor, setAnchor] = useState<CalendarDate>(initialFocus);

    const [internalView, setInternalView] = useState<CalendarView>(props.defaultView ?? 'day');
    const isViewControlled = props.view !== undefined;
    const view: CalendarView = isViewControlled ? (props.view as CalendarView) : internalView;
    const setView = useCallback(
        (next: CalendarView) => {
            if (!isViewControlled) {
                setInternalView(next);
            }
            props.onViewChange?.(next);
        },
        [isViewControlled, props.onViewChange]
    );

    const months = useMemo(
        () => Array.from({ length: visibleMonths }, (_, i) => anchor.add({ months: i })),
        [anchor, visibleMonths]
    );

    const keyboard = useCalendarKeyboard({
        focusedDate,
        moveFocus: (delta) =>
            setFocusedDate((f) => {
                let next = f;
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
                return next;
            }),
        selectDate: (date) => range.selectDate(date, 'keyboard'),
        setView,
        view,
        firstDayOfWeek,
    });

    const onPrev = () => {
        if (view === 'year') {
            setAnchor((a) => a.add({ years: -10 }));
        } else if (view === 'month') {
            setAnchor((a) => a.add({ years: -1 }));
        } else {
            setAnchor((a) => a.add({ months: -1 }));
        }
    };
    const onNext = () => {
        if (view === 'year') {
            setAnchor((a) => a.add({ years: 10 }));
        } else if (view === 'month') {
            setAnchor((a) => a.add({ years: 1 }));
        } else {
            setAnchor((a) => a.add({ months: 1 }));
        }
    };
    const [drilldownSlot, setDrilldownSlot] = useState(0);
    const onTitlePress = (clicked: CalendarDate) => {
        const slot = months.findIndex((m) => m.year === clicked.year && m.month === clicked.month);
        setDrilldownSlot(slot >= 0 ? slot : 0);
        if (clicked.compare(anchor) !== 0) {
            setAnchor(clicked);
        }
        setView(view === 'day' ? 'month' : view === 'month' ? 'year' : 'day');
    };

    return (
        <View
            ref={props.ref}
            {...(props.testID !== undefined ? { testID: props.testID } : {})}
            // @ts-expect-error onKeyDown is supported by react-native-web on View
            onKeyDown={(e: React.KeyboardEvent) => keyboard.onKeyDown(e)}
            style={{
                padding: SURFACE_PADDING,
                backgroundColor: colors.semantic.background.elevated,
                borderRadius: 16,
                borderWidth: SURFACE_BORDER,
                borderColor: colors.semantic.border.default,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                width: innerWidth + 2 * SURFACE_PADDING + 2 * SURFACE_BORDER,
                maxWidth: '100%',
                alignSelf: 'center',
            }}
        >
            <Caption
                months={months}
                locale={locale}
                view={view}
                caption={props.caption ?? 'title'}
                gridWidth={GRID_WIDTH}
                monthGap={MONTH_GAP}
                yearRange={resolveYearRange(props.yearRange, props.minValue, props.maxValue, anchor.year)}
                onPrev={onPrev}
                onNext={onNext}
                onTitlePress={onTitlePress}
                onSetMonth={(slot, m) => {
                    const picked = (months[slot] ?? anchor).set({ month: m, day: 1 });
                    // Subtract slot offset so the picked month stays in the
                    // SAME visible slot the user clicked (not the leftmost).
                    setAnchor(picked.subtract({ months: slot }));
                }}
                onSetYear={(slot, y) => {
                    const picked = (months[slot] ?? anchor).set({ year: y, day: 1 });
                    setAnchor(picked.subtract({ months: slot }));
                }}
            >
                {props.children}
            </Caption>
            <FadeIn key={`range-${view}-${anchor.year}-${anchor.month}`}>
                {view === 'day' && (
                    <View style={{ flexDirection: 'row', gap: MONTH_GAP, alignSelf: 'center', width: gridsRowWidth }}>
                        {months.map((m) => (
                            <DayGrid<'range'>
                                key={`${m.year}-${m.month}`}
                                visibleMonth={m}
                                locale={locale}
                                mode="range"
                                value={range.value as DateRange | null}
                                previewRange={range.previewRange}
                                focusedDate={focusedDate}
                                isUnavailable={range.isUnavailable}
                                weekendDays={weekendDays}
                                firstDayOfWeek={firstDayOfWeek}
                                onDayPress={(date) => range.selectDate(date)}
                                onDayHover={(date) => range.setHoveredDate(date)}
                                {...(renderDay ? { renderDay } : {})}
                            />
                        ))}
                    </View>
                )}
                {view === 'month' && (
                    <View style={{ alignItems: 'center' }}>
                        <MonthGrid
                            visibleMonth={anchor}
                            locale={locale}
                            availableWidth={gridsRowWidth}
                            onSelect={(month) => {
                                const picked = new CalendarDate(anchor.year, month, 1);
                                setAnchor(picked.subtract({ months: drilldownSlot }));
                                setView('day');
                            }}
                        />
                    </View>
                )}
                {view === 'year' && (
                    <View style={{ alignItems: 'center' }}>
                        <YearGrid
                            visibleMonth={anchor}
                            availableWidth={gridsRowWidth}
                            onSelect={(year) => {
                                const picked = new CalendarDate(year, anchor.month, 1);
                                setAnchor(picked.subtract({ months: drilldownSlot }));
                                setView('month');
                            }}
                        />
                    </View>
                )}
                {props.children && (props.caption ?? 'title') !== 'custom' ? <Footer>{props.children}</Footer> : null}
            </FadeIn>
        </View>
    );
};

export const Calendar = CalendarRoot;
