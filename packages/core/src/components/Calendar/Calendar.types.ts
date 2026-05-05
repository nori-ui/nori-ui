import type { CalendarDate } from '@internationalized/date';
import type { ReactNode, Ref } from 'react';
import type { View as RNView } from 'react-native';
import type { DayOfWeek } from './state/locale-utils';

export type CalendarMode = 'single' | 'range' | 'multiple';
export type CalendarView = 'day' | 'month' | 'year';
export type CalendarBehavior = 'paged' | 'scroll';

export type DateRange = { start: CalendarDate; end: CalendarDate | null };

export type CalendarValue<M extends CalendarMode> = M extends 'single'
    ? CalendarDate | null
    : M extends 'range'
      ? DateRange | null
      : M extends 'multiple'
        ? CalendarDate[]
        : never;

export type ChangeMeta = {
    view: CalendarView;
    source: 'click' | 'keyboard' | 'scroll';
};

export type DayContext = {
    date: CalendarDate;
    isOutsideMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
    isInRange: boolean;
    isInPreviewRange: boolean;
    isUnavailable: boolean;
    isFocused: boolean;
    isWeekend: boolean;
};

export type CalendarSlots = {
    /** Custom renderer for a single day cell. Receives full state. */
    renderDay?: (ctx: DayContext) => ReactNode;
};

export type CalendarBaseProps<M extends CalendarMode = 'single'> = {
    mode?: M;
    value?: CalendarValue<M>;
    defaultValue?: CalendarValue<M>;
    onChange?: (value: CalendarValue<M>, meta: ChangeMeta) => void;

    view?: CalendarView;
    defaultView?: CalendarView;
    onViewChange?: (view: CalendarView) => void;

    /** Default 'paged' on web, 'scroll' on native (Phase 2). */
    behavior?: CalendarBehavior;
    /** Number of calendar months side-by-side. `'auto'` = 2 on ≥768px, else 1. */
    visibleMonths?: number | 'auto';

    /** Inclusive minimum selectable date. */
    minValue?: CalendarDate;
    /** Inclusive maximum selectable date. */
    maxValue?: CalendarDate;
    /** Predicate marking a date unavailable (cannot be focused or selected). */
    isDateUnavailable?: (date: CalendarDate) => boolean;

    /** Override locale firstDayOfWeek (0=Sun..6=Sat). */
    firstDayOfWeek?: DayOfWeek;
    /** Override locale weekend marking. */
    weekendDays?: DayOfWeek[];
    /** Render the ISO week number column. */
    showWeekNumbers?: boolean;
    /** Highlight today's cell. @defaultValue true */
    highlightToday?: boolean;

    /** Override `NoriProvider.locale`. */
    locale?: string;

    /** Range mode only — minimum nights between start and end. */
    minNights?: number;
    /** Range mode only — maximum nights between start and end. */
    maxNights?: number;

    /** Custom renderer for a single day cell. */
    renderDay?: (ctx: DayContext) => ReactNode;

    /** Test id for the root element. */
    testID?: string;
    className?: string;
    ref?: Ref<RNView>;
    children?: ReactNode;
};

export type CalendarProps<M extends CalendarMode = 'single'> = CalendarBaseProps<M>;
