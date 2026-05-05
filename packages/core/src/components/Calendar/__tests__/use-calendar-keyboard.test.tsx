import { CalendarDate } from '@internationalized/date';
import { renderHook } from '@testing-library/react';
import { useCalendarKeyboard } from '../state/use-calendar-keyboard';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

const fakeEvent = (key: string, shiftKey = false) =>
    ({
        key,
        shiftKey,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    }) as unknown as React.KeyboardEvent;

describe('useCalendarKeyboard — RAC contract', () => {
    const baseState = {
        focusedDate: d(2026, 5, 15),
        moveFocus: jest.fn(),
        selectDate: jest.fn(),
        setView: jest.fn(),
        view: 'day' as const,
    };

    beforeEach(() => {
        baseState.moveFocus.mockClear();
        baseState.selectDate.mockClear();
        baseState.setView.mockClear();
    });

    it('ArrowRight moves focus +1 day', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowRight'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: 1 });
    });

    it('ArrowLeft moves focus -1 day', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowLeft'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: -1 });
    });

    it('ArrowDown moves focus +1 week', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowDown'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ weeks: 1 });
    });

    it('ArrowUp moves focus -1 week', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('ArrowUp'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ weeks: -1 });
    });

    it('PageDown moves focus +1 month', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageDown'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ months: 1 });
    });

    it('PageUp moves focus -1 month', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageUp'));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ months: -1 });
    });

    it('Shift+PageDown moves focus +1 year', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageDown', true));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ years: 1 });
    });

    it('Shift+PageUp moves focus -1 year', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('PageUp', true));
        expect(baseState.moveFocus).toHaveBeenCalledWith({ years: -1 });
    });

    it('Enter selects the focused date with source=keyboard', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent('Enter'));
        expect(baseState.selectDate).toHaveBeenCalledWith(d(2026, 5, 15), 'keyboard');
    });

    it('Space selects the focused date', () => {
        const { result } = renderHook(() => useCalendarKeyboard(baseState));
        result.current.onKeyDown(fakeEvent(' '));
        expect(baseState.selectDate).toHaveBeenCalledWith(d(2026, 5, 15), 'keyboard');
    });

    it('Home moves to start of week, End to end of week (using firstDayOfWeek=0)', () => {
        const { result } = renderHook(() => useCalendarKeyboard({ ...baseState, firstDayOfWeek: 0 }));
        result.current.onKeyDown(fakeEvent('Home'));
        // 2026-05-15 is a Friday → start of week (Sun) is May 10.
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: -5 });
        baseState.moveFocus.mockClear();
        result.current.onKeyDown(fakeEvent('End'));
        // End of week (Sat) is May 16.
        expect(baseState.moveFocus).toHaveBeenCalledWith({ days: 1 });
    });
});
