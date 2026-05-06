'use client';

import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocale } from '../../i18n/locale';
import { useThemeColors } from '../../theme/use-theme-colors';
import type { CalendarBaseProps, CalendarMode, CalendarValue, CalendarView, DateRange } from './Calendar.types';
import { type DayOfWeek, getFirstDayOfWeek, getWeekendDays } from './state/locale-utils';
import { useCalendarKeyboard } from './state/use-calendar-keyboard';
import { useCalendarState } from './state/use-calendar-state';
import { useRangeState } from './state/use-range-state';
import { DayGrid } from './view/DayGrid';
import { Footer } from './view/Footer';
import { Header } from './view/Header';
import { MonthGrid } from './view/MonthGrid';
import { YearGrid } from './view/YearGrid';

const DEFAULT_VISIBLE_MONTHS = 1;
const DESKTOP_BREAKPOINT = 768;

const useResolvedVisibleMonths = (input: number | 'auto' | undefined): number => {
    // Hooks must be called unconditionally — call useState/useEffect every render.
    const [count, setCount] = useState<number>(() => {
        if (typeof input === 'number') {
            return input;
        }
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
            return DEFAULT_VISIBLE_MONTHS;
        }
        return window.innerWidth >= DESKTOP_BREAKPOINT ? 2 : 1;
    });

    useEffect(() => {
        if (typeof input === 'number') {
            setCount(input);
            return;
        }
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
            setCount(DEFAULT_VISIBLE_MONTHS);
            return;
        }
        const handler = () => setCount(window.innerWidth >= DESKTOP_BREAKPOINT ? 2 : 1);
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [input]);

    return count;
};

const CalendarRoot = <M extends CalendarMode = 'single'>(props: CalendarBaseProps<M>) => {
    const providerLocale = useLocale();
    const locale = props.locale ?? providerLocale;

    if ((props.mode ?? 'single') === 'range') {
        return <RangeCalendar {...(props as CalendarBaseProps<'range'>)} locale={locale} />;
    }
    return <SingleOrMultiCalendar {...(props as CalendarBaseProps<Exclude<CalendarMode, 'range'>>)} locale={locale} />;
};

const SingleOrMultiCalendar = <M extends Exclude<CalendarMode, 'range'>>(
    props: CalendarBaseProps<M> & { locale: string }
) => {
    const { locale, renderDay } = props;
    const colors = useThemeColors();
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

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

    const keyboard = useCalendarKeyboard({
        focusedDate: state.focusedDate,
        moveFocus: state.moveFocus,
        selectDate: state.selectDate,
        setView: state.setView,
        view: state.view,
        firstDayOfWeek,
    });

    const visibleMonths = useResolvedVisibleMonths(props.visibleMonths);
    const months = Array.from({ length: visibleMonths }, (_, i) => state.focusedDate.add({ months: i }));

    const onPrev = () =>
        state.moveFocus(
            state.view === 'year' ? { years: -10 } : state.view === 'month' ? { years: -1 } : { months: -1 }
        );
    const onNext = () =>
        state.moveFocus(state.view === 'year' ? { years: 10 } : state.view === 'month' ? { years: 1 } : { months: 1 });
    const onTitlePress = () => state.setView(state.view === 'day' ? 'month' : state.view === 'month' ? 'year' : 'day');

    return (
        <View
            ref={props.ref}
            {...(props.testID !== undefined ? { testID: props.testID } : {})}
            // @ts-expect-error onKeyDown is supported by react-native-web on View
            onKeyDown={(e: React.KeyboardEvent) => keyboard.onKeyDown(e)}
            style={{
                padding: 16,
                backgroundColor: colors.semantic.background.elevated,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.semantic.border.default,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                alignSelf: 'flex-start',
            }}
        >
            <Header
                visibleMonth={state.focusedDate}
                visibleMonths={months}
                locale={locale}
                view={state.view}
                onPrev={onPrev}
                onNext={onNext}
                onTitlePress={onTitlePress}
            />
            {state.view === 'day' && (
                <View style={{ flexDirection: 'row', gap: 16 }}>
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
                <MonthGrid
                    visibleMonth={state.focusedDate}
                    locale={locale}
                    onSelect={(month) => {
                        state.setFocusedDate(new CalendarDate(state.focusedDate.year, month, 1));
                        state.setView('day');
                    }}
                />
            )}
            {state.view === 'year' && (
                <YearGrid
                    visibleMonth={state.focusedDate}
                    onSelect={(year) => {
                        state.setFocusedDate(new CalendarDate(year, state.focusedDate.month, 1));
                        state.setView('month');
                    }}
                />
            )}
            {props.children ? <Footer>{props.children}</Footer> : null}
        </View>
    );
};

const RangeCalendar = (props: CalendarBaseProps<'range'> & { locale: string }) => {
    const { locale, renderDay } = props;
    const colors = useThemeColors();
    const firstDayOfWeek = props.firstDayOfWeek ?? getFirstDayOfWeek(locale);
    const weekendDays = (props.weekendDays as [DayOfWeek, DayOfWeek] | undefined) ?? getWeekendDays(locale);

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

    const visibleMonths = useResolvedVisibleMonths(props.visibleMonths);
    const months = Array.from({ length: visibleMonths }, (_, i) => focusedDate.add({ months: i }));

    const onPrev = () => {
        const delta = view === 'year' ? { years: -10 } : view === 'month' ? { years: -1 } : { months: -1 };
        setFocusedDate((f) => f.add(delta));
    };
    const onNext = () => {
        const delta = view === 'year' ? { years: 10 } : view === 'month' ? { years: 1 } : { months: 1 };
        setFocusedDate((f) => f.add(delta));
    };
    const onTitlePress = () => setView(view === 'day' ? 'month' : view === 'month' ? 'year' : 'day');

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
        selectDate: (date, _source) => range.selectDate(date, 'keyboard'),
        setView,
        view,
        firstDayOfWeek,
    });

    return (
        <View
            ref={props.ref}
            {...(props.testID !== undefined ? { testID: props.testID } : {})}
            // @ts-expect-error onKeyDown is supported by react-native-web on View
            onKeyDown={(e: React.KeyboardEvent) => keyboard.onKeyDown(e)}
            style={{
                padding: 16,
                backgroundColor: colors.semantic.background.elevated,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.semantic.border.default,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                alignSelf: 'flex-start',
            }}
        >
            <Header
                visibleMonth={focusedDate}
                visibleMonths={months}
                locale={locale}
                view={view}
                onPrev={onPrev}
                onNext={onNext}
                onTitlePress={onTitlePress}
            />
            {view === 'day' && (
                <View style={{ flexDirection: 'row', gap: 16 }}>
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
                <MonthGrid
                    visibleMonth={focusedDate}
                    locale={locale}
                    onSelect={(month) => {
                        setFocusedDate(new CalendarDate(focusedDate.year, month, 1));
                        setView('day');
                    }}
                />
            )}
            {view === 'year' && (
                <YearGrid
                    visibleMonth={focusedDate}
                    onSelect={(year) => {
                        setFocusedDate(new CalendarDate(year, focusedDate.month, 1));
                        setView('month');
                    }}
                />
            )}
            {props.children ? <Footer>{props.children}</Footer> : null}
        </View>
    );
};

export const Calendar = CalendarRoot;
