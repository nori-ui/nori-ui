import { CalendarDate } from '@internationalized/date';
import { act, renderHook } from '@testing-library/react';
import { useCalendarState } from '../state/use-calendar-state';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('useCalendarState — single mode', () => {
    it('exposes initial focusedDate from defaultValue', () => {
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', defaultValue: d(2026, 5, 5), locale: 'en-US' })
        );
        expect(result.current.focusedDate.day).toBe(5);
        expect(result.current.value).toEqual(d(2026, 5, 5));
    });

    it('selecting a date updates value and fires onChange with meta', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useCalendarState({ mode: 'single', onChange, locale: 'en-US' }));
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        expect(result.current.value).toEqual(d(2026, 5, 10));
        expect(onChange).toHaveBeenCalledWith(d(2026, 5, 10), { view: 'day', source: 'click' });
    });

    it('respects controlled value', () => {
        const onChange = jest.fn();
        const { result, rerender } = renderHook(
            ({ value }) => useCalendarState({ mode: 'single', value, onChange, locale: 'en-US' }),
            { initialProps: { value: d(2026, 5, 5) as CalendarDate | null } }
        );
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        expect(result.current.value).toEqual(d(2026, 5, 5));
        expect(onChange).toHaveBeenCalledWith(d(2026, 5, 10), expect.objectContaining({ view: 'day' }));
        rerender({ value: d(2026, 5, 10) });
        expect(result.current.value).toEqual(d(2026, 5, 10));
    });

    it('refuses to select unavailable dates', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({
                mode: 'single',
                onChange,
                locale: 'en-US',
                isDateUnavailable: (date) => date.day === 7,
            })
        );
        act(() => result.current.selectDate(d(2026, 5, 7), 'click'));
        expect(result.current.value).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('useCalendarState — multiple mode', () => {
    it('toggles dates in/out of value array', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'multiple', defaultValue: [], onChange, locale: 'en-US' })
        );
        act(() => result.current.selectDate(d(2026, 5, 5), 'click'));
        act(() => result.current.selectDate(d(2026, 5, 10), 'click'));
        expect(result.current.value).toEqual([d(2026, 5, 5), d(2026, 5, 10)]);
        act(() => result.current.selectDate(d(2026, 5, 5), 'click'));
        expect(result.current.value).toEqual([d(2026, 5, 10)]);
    });
});

describe('useCalendarState — view drill-down', () => {
    it('changes view via setView', () => {
        const onViewChange = jest.fn();
        const { result } = renderHook(() => useCalendarState({ mode: 'single', onViewChange, locale: 'en-US' }));
        expect(result.current.view).toBe('day');
        act(() => result.current.setView('month'));
        expect(result.current.view).toBe('month');
        expect(onViewChange).toHaveBeenCalledWith('month');
    });
});

describe('useCalendarState — focus arithmetic', () => {
    it('moveFocus by days/weeks/months/years', () => {
        const { result } = renderHook(() =>
            useCalendarState({ mode: 'single', defaultValue: d(2026, 5, 15), locale: 'en-US' })
        );
        act(() => result.current.moveFocus({ days: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 5, 16));
        act(() => result.current.moveFocus({ weeks: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 5, 23));
        act(() => result.current.moveFocus({ months: 1 }));
        expect(result.current.focusedDate).toEqual(d(2026, 6, 23));
        act(() => result.current.moveFocus({ years: -1 }));
        expect(result.current.focusedDate).toEqual(d(2025, 6, 23));
    });
});

describe('useCalendarState — constraint updates', () => {
    it('isUnavailable reflects updated minValue/maxValue/isDateUnavailable across rerenders', () => {
        const { result, rerender } = renderHook(
            ({ minValue }: { minValue?: CalendarDate }) =>
                useCalendarState({ mode: 'single', locale: 'en-US', ...(minValue ? { minValue } : {}) }),
            { initialProps: {} as { minValue?: CalendarDate } }
        );
        // Initially nothing is unavailable.
        expect(result.current.isUnavailable(d(2026, 5, 1))).toBe(false);
        // After tightening minValue, the earlier date should become unavailable.
        rerender({ minValue: d(2026, 5, 5) });
        expect(result.current.isUnavailable(d(2026, 5, 1))).toBe(true);
        expect(result.current.isUnavailable(d(2026, 5, 5))).toBe(false);
    });
});
