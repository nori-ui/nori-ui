'use client';

import type { CalendarDate } from '@internationalized/date';
import { useCallback } from 'react';
import type { CalendarView, ChangeMeta } from '../Calendar.types';
import type { DayOfWeek } from './locale-utils';
import type { FocusDelta } from './use-calendar-state';

export type UseCalendarKeyboardProps = {
    focusedDate: CalendarDate;
    moveFocus: (delta: FocusDelta) => void;
    selectDate: (date: CalendarDate, source: ChangeMeta['source']) => void;
    setView: (view: CalendarView) => void;
    view: CalendarView;
    /** Default 0 (Sunday). Used by Home/End to compute week boundaries. */
    firstDayOfWeek?: DayOfWeek;
};

export const useCalendarKeyboard = (props: UseCalendarKeyboardProps) => {
    const { focusedDate, moveFocus, selectDate, firstDayOfWeek = 0 } = props;

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            const focusedDow = focusedDate.toDate('UTC').getUTCDay() as DayOfWeek;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    moveFocus({ days: -1 });
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    moveFocus({ days: 1 });
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    moveFocus({ weeks: -1 });
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    moveFocus({ weeks: 1 });
                    return;
                case 'PageUp':
                    event.preventDefault();
                    moveFocus(event.shiftKey ? { years: -1 } : { months: -1 });
                    return;
                case 'PageDown':
                    event.preventDefault();
                    moveFocus(event.shiftKey ? { years: 1 } : { months: 1 });
                    return;
                case 'Home': {
                    event.preventDefault();
                    const back = (focusedDow - firstDayOfWeek + 7) % 7;
                    moveFocus({ days: -back });
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    const back = (focusedDow - firstDayOfWeek + 7) % 7;
                    const forward = 6 - back;
                    moveFocus({ days: forward });
                    return;
                }
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    selectDate(focusedDate, 'keyboard');
                    return;
                default:
                    return;
            }
        },
        [focusedDate, firstDayOfWeek, moveFocus, selectDate]
    );

    return { onKeyDown };
};
