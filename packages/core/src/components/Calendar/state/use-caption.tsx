'use client';

import type { CalendarDate } from '@internationalized/date';
import { createContext, type ReactNode, useContext } from 'react';

export type CaptionOption = {
    value: number;
    label: string;
    disabled: boolean;
};

export type CaptionContextValue = {
    /** Currently displayed month, 1..12. */
    month: number;
    /** Currently displayed year. */
    year: number;
    visibleMonth: CalendarDate;
    /** All months a, optional disabled flag derived from min/max + isDateUnavailable. */
    monthOptions: ReadonlyArray<CaptionOption>;
    /** Years inside `yearRange`, optional disabled flag. */
    yearOptions: ReadonlyArray<CaptionOption>;
    /** Set the displayed month, 1..12. */
    setMonth: (month: number) => void;
    /** Set the displayed year. */
    setYear: (year: number) => void;
    /** Move to the previous month/year/decade depending on the current view. */
    goPrev: () => void;
    /** Move to the next month/year/decade depending on the current view. */
    goNext: () => void;
};

const CaptionContext = createContext<CaptionContextValue | null>(null);
CaptionContext.displayName = 'CalendarCaptionContext';

export type CaptionProviderProps = {
    value: CaptionContextValue;
    children?: ReactNode;
};

export const CaptionProvider = ({ value, children }: CaptionProviderProps) => (
    <CaptionContext.Provider value={value}>{children}</CaptionContext.Provider>
);

/**
 * Returns the current caption state and setters for a Calendar. Use inside
 * a custom `Calendar.Caption` slot to render your own dropdowns / nav.
 *
 * @throws if called outside a Calendar with `caption="custom"`.
 */
export const useCalendarCaption = (): CaptionContextValue => {
    const ctx = useContext(CaptionContext);
    if (!ctx) {
        throw new Error('useCalendarCaption must be used inside <Calendar.Caption>.');
    }
    return ctx;
};
