import { act, renderHook } from '@testing-library/react';
import { type PaginationItemDescriptor, usePagination } from '../use-pagination';

const summarize = (pages: ReadonlyArray<PaginationItemDescriptor>): string =>
    pages
        .map((p) => {
            if (p.type === 'page') {
                return `${p.selected ? '[' : ''}${p.page}${p.selected ? ']' : ''}`;
            }
            if (p.type === 'ellipsis') {
                return '…';
            }
            return p.type[0]!.toUpperCase();
        })
        .join(' ');

describe('usePagination — page generation', () => {
    it('renders all pages when total fits within sibling+boundary window', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 5, page: 3 }));
        expect(summarize(result.current.pages)).toBe('P 1 2 [3] 4 5 N');
    });

    it('shows leading ellipsis when current page is far from the start', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 20, page: 12 }));
        // boundary=1, sibling=1 → 1 … 11 [12] 13 … 20
        expect(summarize(result.current.pages)).toBe('P 1 … 11 [12] 13 … 20 N');
    });

    it('shows only trailing ellipsis when near the start', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 20, page: 2 }));
        expect(summarize(result.current.pages)).toBe('P 1 [2] 3 4 5 … 20 N');
    });

    it('shows only leading ellipsis when near the end', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 20, page: 19 }));
        expect(summarize(result.current.pages)).toBe('P 1 … 16 17 18 [19] 20 N');
    });

    it('respects siblingCount=2 and boundaryCount=2', () => {
        const { result } = renderHook(() =>
            usePagination({ pageCount: 30, page: 15, siblingCount: 2, boundaryCount: 2 })
        );
        // 1 2 … 13 14 [15] 16 17 … 29 30
        expect(summarize(result.current.pages)).toBe('P 1 2 … 13 14 [15] 16 17 … 29 30 N');
    });

    it('renders single-page state without errors', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 1, page: 1 }));
        expect(summarize(result.current.pages)).toBe('P [1] N');
        expect(result.current.canPrev).toBe(false);
        expect(result.current.canNext).toBe(false);
    });

    it('clamps an out-of-range controlled page into [1, pageCount]', () => {
        const { result, rerender } = renderHook(({ p }) => usePagination({ pageCount: 5, page: p }), {
            initialProps: { p: 99 },
        });
        expect(result.current.page).toBe(5);
        rerender({ p: -3 });
        expect(result.current.page).toBe(1);
    });

    it('handles pageCount of 0 by treating it as 1', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 0 }));
        expect(result.current.page).toBe(1);
        expect(result.current.canPrev).toBe(false);
        expect(result.current.canNext).toBe(false);
    });

    it('emits first/last items when showFirstLast is true', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 5, page: 3, showFirstLast: true }));
        expect(summarize(result.current.pages)).toBe('F P 1 2 [3] 4 5 N L');
    });

    it('omits prev/next when showPrevNext is false', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 3, page: 1, showPrevNext: false }));
        expect(summarize(result.current.pages)).toBe('[1] 2 3');
    });
});

describe('usePagination — controlled / uncontrolled state', () => {
    it('starts uncontrolled at defaultPage and updates via goToPage', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => usePagination({ pageCount: 10, defaultPage: 4, onPageChange: onChange }));
        expect(result.current.page).toBe(4);
        act(() => result.current.next());
        expect(result.current.page).toBe(5);
        expect(onChange).toHaveBeenLastCalledWith(5);
    });

    it('does not mutate internal state in controlled mode but still fires onPageChange', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => usePagination({ pageCount: 10, page: 2, onPageChange: onChange }));
        act(() => result.current.next());
        // Controlled — page only changes when the parent passes a new `page` prop.
        expect(result.current.page).toBe(2);
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('clamps prev at 1 and next at pageCount', () => {
        const { result } = renderHook(() => usePagination({ pageCount: 3, defaultPage: 1 }));
        act(() => result.current.prev());
        expect(result.current.page).toBe(1);
        act(() => result.current.last());
        expect(result.current.page).toBe(3);
        act(() => result.current.next());
        expect(result.current.page).toBe(3);
    });
});
