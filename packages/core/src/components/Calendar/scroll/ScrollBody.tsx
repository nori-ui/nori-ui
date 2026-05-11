import type { CalendarDate } from '@internationalized/date';
import type { ReactElement, ReactNode } from 'react';
import type { CalendarMode, CalendarValue, ChangeMeta, DateRange, DayContext } from '../Calendar.types';
import type { DayOfWeek } from '../state/locale-utils';

export type ScrollBodyProps<M extends CalendarMode> = {
    mode: M;
    locale: string;
    focusedDate: CalendarDate;
    onFocusedMonthChange: (anchor: CalendarDate, meta: ChangeMeta) => void;
    value: CalendarValue<M>;
    onSelectDate: (date: CalendarDate) => void;

    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;

    showWeekNumbers?: boolean;
    highlightToday?: boolean;
    firstDayOfWeek: DayOfWeek;
    weekendDays: [DayOfWeek, DayOfWeek];

    renderDay?: (ctx: DayContext) => ReactNode;

    /** Range-only; undefined for single/multiple. */
    previewRange?: DateRange | null;
};

// Platform-extension fallback. Metro (native) picks `.native.tsx`; Vite/Webpack
// (web) pick `.web.tsx`. Reaching this default means the bundler config is
// broken — fail loudly rather than silently mounting an empty body.
export const ScrollBody = <M extends CalendarMode>(_props: ScrollBodyProps<M>): ReactElement => {
    throw new Error(
        '[Calendar] ScrollBody: no platform implementation resolved. ' +
            'Ensure your bundler honors *.web.tsx / *.native.tsx extensions.'
    );
};
