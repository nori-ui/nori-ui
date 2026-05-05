import { CalendarDate } from '@internationalized/date';
import { act, renderHook } from '@testing-library/react';
import { useRangeState } from '../state/use-range-state';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('useRangeState', () => {
    it('first click sets pending start with end=null', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange }));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: null });
        expect(onChange).toHaveBeenCalledWith({ start: d(2026, 5, 5), end: null }, expect.any(Object));
    });

    it('second click commits the range, ordered ascending', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange }));
        act(() => result.current.selectDate(d(2026, 5, 10)));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 10) });
    });

    it('third click starts a new range', () => {
        const { result } = renderHook(() => useRangeState({}));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        act(() => result.current.selectDate(d(2026, 5, 10)));
        act(() => result.current.selectDate(d(2026, 5, 20)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 20), end: null });
    });

    it('hover preview reflects pending state, not committed', () => {
        const { result } = renderHook(() => useRangeState({}));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        act(() => result.current.setHoveredDate(d(2026, 5, 8)));
        expect(result.current.previewRange).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 8) });
        act(() => result.current.selectDate(d(2026, 5, 10)));
        expect(result.current.previewRange).toBeNull();
    });

    it('respects minNights — selection below minimum is rejected', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useRangeState({ onChange, minNights: 3 }));
        act(() => result.current.selectDate(d(2026, 5, 5)));
        act(() => result.current.selectDate(d(2026, 5, 6)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: null });
        act(() => result.current.selectDate(d(2026, 5, 8)));
        expect(result.current.value).toEqual({ start: d(2026, 5, 5), end: d(2026, 5, 8) });
    });
});
