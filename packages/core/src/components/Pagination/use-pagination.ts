'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

export type PaginationItemType = 'page' | 'prev' | 'next' | 'first' | 'last' | 'ellipsis';

/**
 * One slot in the rendered pagination row, as produced by `usePagination`.
 * `page` is set on `'page'` items only; ellipsis carries no number.
 */
export type PaginationItemDescriptor = {
    type: PaginationItemType;
    page?: number;
    selected?: boolean;
    disabled?: boolean;
};

export type UsePaginationArgs = {
    /** Controlled current page (1-indexed). Omit for uncontrolled. */
    page?: number;
    /** Initial page when uncontrolled (1-indexed). @defaultValue 1 */
    defaultPage?: number;
    /** Total number of pages. */
    pageCount: number;
    /** Pages on each side of the current page. @defaultValue 1 */
    siblingCount?: number;
    /** Pages always visible at start/end. @defaultValue 1 */
    boundaryCount?: number;
    /** Include first/last items in the `pages` list. @defaultValue false */
    showFirstLast?: boolean;
    /** Include prev/next items in the `pages` list. @defaultValue true */
    showPrevNext?: boolean;
    /** Fired on every page change. */
    onPageChange?: (page: number) => void;
};

export type UsePaginationReturn = {
    /** Current page (1-indexed), clamped to [1, max(1, pageCount)]. */
    page: number;
    /** Item descriptors in render order. */
    pages: ReadonlyArray<PaginationItemDescriptor>;
    canPrev: boolean;
    canNext: boolean;
    goToPage: (page: number) => void;
    prev: () => void;
    next: () => void;
    first: () => void;
    last: () => void;
};

const range = (from: number, to: number): number[] => {
    if (to < from) {
        return [];
    }
    const out = new Array<number>(to - from + 1);
    for (let i = 0; i < out.length; i += 1) {
        out[i] = from + i;
    }
    return out;
};

/**
 * Headless pagination math + state. Returns the items to render and the
 * actions that drive them — without a single DOM/RN element. Use this
 * directly for fully custom paginators, or let `<Pagination>` use it
 * internally.
 *
 * The math mirrors MUI's `usePagination` algorithm so its behavior is
 * predictable for anyone who has used the React ecosystem before.
 *
 * @example
 * const p = usePagination({ pageCount: 12, defaultPage: 3 });
 * p.pages.map((item) => …);
 */
export function usePagination(args: UsePaginationArgs): UsePaginationReturn {
    const {
        page: controlledPage,
        defaultPage = 1,
        pageCount,
        siblingCount = 1,
        boundaryCount = 1,
        showFirstLast = false,
        showPrevNext = true,
        onPageChange,
    } = args;

    const isControlled = controlledPage !== undefined;
    const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage);

    // Latest-callback ref so `goToPage` can stay referentially stable.
    const onChangeRef = useRef(onPageChange);
    onChangeRef.current = onPageChange;

    const safePageCount = Math.max(1, Math.floor(pageCount));
    const rawPage = isControlled ? (controlledPage as number) : uncontrolledPage;
    const currentPage = Math.min(Math.max(1, Math.floor(rawPage)), safePageCount);

    const goToPage = useCallback(
        (next: number) => {
            const clamped = Math.min(Math.max(1, Math.floor(next)), Math.max(1, Math.floor(pageCount)));
            if (!isControlled) {
                setUncontrolledPage(clamped);
            }
            onChangeRef.current?.(clamped);
        },
        [isControlled, pageCount]
    );

    const prev = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
    const next = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
    const first = useCallback(() => goToPage(1), [goToPage]);
    const last = useCallback(() => goToPage(safePageCount), [goToPage, safePageCount]);

    const pages = useMemo<ReadonlyArray<PaginationItemDescriptor>>(() => {
        const items: PaginationItemDescriptor[] = [];
        const safeSibling = Math.max(0, Math.floor(siblingCount));
        const safeBoundary = Math.max(0, Math.floor(boundaryCount));

        // First / Prev
        if (showFirstLast) {
            items.push({ type: 'first', disabled: currentPage <= 1 });
        }
        if (showPrevNext) {
            items.push({ type: 'prev', disabled: currentPage <= 1 });
        }

        // Page numbers + ellipses
        const startPages = range(1, Math.min(safeBoundary, safePageCount));
        const endPages = range(Math.max(safePageCount - safeBoundary + 1, safeBoundary + 1), safePageCount);

        const siblingsStart = Math.max(
            Math.min(currentPage - safeSibling, safePageCount - safeBoundary - safeSibling * 2 - 1),
            safeBoundary + 2
        );
        const siblingsEnd = Math.min(
            Math.max(currentPage + safeSibling, safeBoundary + safeSibling * 2 + 2),
            endPages.length > 0 ? endPages[0]! - 2 : safePageCount - 1
        );

        const middle: Array<number | 'ellipsis'> = [];
        // Start ellipsis
        if (siblingsStart > safeBoundary + 2) {
            middle.push('ellipsis');
        } else if (safeBoundary + 1 < safePageCount - safeBoundary) {
            middle.push(safeBoundary + 1);
        }
        // Middle pages
        for (const p of range(siblingsStart, siblingsEnd)) {
            middle.push(p);
        }
        // End ellipsis
        if (siblingsEnd < safePageCount - safeBoundary - 1) {
            middle.push('ellipsis');
        } else if (safePageCount - safeBoundary > safeBoundary) {
            middle.push(safePageCount - safeBoundary);
        }

        const seen = new Set<number>();
        const pushPage = (n: number) => {
            if (n < 1 || n > safePageCount || seen.has(n)) {
                return;
            }
            seen.add(n);
            items.push({ type: 'page', page: n, selected: n === currentPage });
        };

        for (const n of startPages) {
            pushPage(n);
        }
        for (const m of middle) {
            if (m === 'ellipsis') {
                items.push({ type: 'ellipsis' });
            } else {
                pushPage(m);
            }
        }
        for (const n of endPages) {
            pushPage(n);
        }

        // Next / Last
        if (showPrevNext) {
            items.push({ type: 'next', disabled: currentPage >= safePageCount });
        }
        if (showFirstLast) {
            items.push({ type: 'last', disabled: currentPage >= safePageCount });
        }

        return items;
    }, [currentPage, safePageCount, siblingCount, boundaryCount, showFirstLast, showPrevNext]);

    return {
        page: currentPage,
        pages,
        canPrev: currentPage > 1,
        canNext: currentPage < safePageCount,
        goToPage,
        prev,
        next,
        first,
        last,
    };
}
