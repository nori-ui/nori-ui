'use client';

/**
 * DataTable — convenience wrapper around Table that renders rows from a
 * `columns` + `data` array, with in-memory sort and client-side pagination.
 *
 * Deferred to v2:
 * - Server-side data (custom `onSort` / `onPaginate` callbacks)
 * - Filtering, row selection, expanding rows
 * - Column resizing, sticky headers
 * - Variable-width columns on native (v1 uses equal flex)
 */

import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { usePagination } from '../Pagination/use-pagination';
import { Table } from '../Table/Table';
import type { TableAlign } from '../Table/Table.shared';

// ─── Column definition ────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export type SortState = {
    id: string;
    direction: SortDirection;
};

export type Column<T> = {
    /** Unique column identifier. Used as the sort key. */
    id: string;
    /** Content rendered in the header cell. */
    header: ReactNode;
    /** Render function for a data row. Receives the full row value. */
    cell: (row: T) => ReactNode;
    /** Enable click-to-sort on this column. @defaultValue false */
    sortable?: boolean;
    /** Horizontal alignment of cell content. @defaultValue 'left' */
    align?: TableAlign;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type DataTableProps<T extends object> = {
    /** Row data array. */
    data: T[];
    /** Column definitions. */
    columns: Column<T>[];
    /**
     * Number of rows per page.
     * @defaultValue 10
     */
    pageSize?: number;
    /**
     * Initial sort state. Must reference a `sortable` column id.
     */
    defaultSort?: SortState;
    /**
     * Called when a row is pressed (native) or clicked (web).
     */
    onRowPress?: (row: T) => void;
    /** Content shown when `data` is empty. @defaultValue "No data" */
    emptyState?: ReactNode;
    /** Alternating row background tinting. */
    striped?: boolean;
    /** Reduce cell padding. */
    compact?: boolean;
    /** Draw borders around cells. */
    bordered?: boolean;
    className?: string;
    testID?: string;
};

// ─── Sort helpers ─────────────────────────────────────────────────────────────

function sortData<T extends object>(data: T[], sort: SortState | null): T[] {
    if (!sort) {
        return data;
    }
    const key = sort.id as keyof T;
    return [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av == null && bv == null) {
            return 0;
        }
        if (av == null) {
            return 1;
        }
        if (bv == null) {
            return -1;
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.direction === 'asc' ? cmp : -cmp;
    });
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIndicator({ direction }: { direction?: SortDirection }) {
    if (direction === undefined) {
        return <span style={{ marginLeft: 4, opacity: 0.3 }}>⇅</span>;
    }
    return <span style={{ marginLeft: 4 }}>{direction === 'asc' ? '↑' : '↓'}</span>;
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
    data,
    columns,
    pageSize = 10,
    defaultSort,
    onRowPress,
    emptyState,
    striped,
    compact,
    bordered,
    testID,
    className,
}: DataTableProps<T>) {
    const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);

    const sorted = useMemo(() => sortData(data, sort), [data, sort]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const { page, goToPage, canPrev, canNext } = usePagination({ pageCount, defaultPage: 1 });

    const pageSlice = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, page, pageSize]);

    const handleSort = (colId: string) => {
        setSort((prev) => {
            if (prev?.id !== colId) {
                goToPage(1);
                return { id: colId, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { id: colId, direction: 'desc' };
            }
            goToPage(1);
            return null;
        });
    };

    // Build table props without spreading undefined into exactOptionalPropertyTypes
    const tableProps: {
        striped?: boolean;
        compact?: boolean;
        bordered?: boolean;
        testID?: string;
        className?: string;
    } = {};
    if (striped !== undefined) {
        tableProps.striped = striped;
    }
    if (compact !== undefined) {
        tableProps.compact = compact;
    }
    if (bordered !== undefined) {
        tableProps.bordered = bordered;
    }
    if (testID !== undefined) {
        tableProps.testID = testID;
    }
    if (className !== undefined) {
        tableProps.className = className;
    }

    return (
        <View style={{ width: '100%' }}>
            <Table {...tableProps}>
                <Table.Header>
                    <Table.Row>
                        {columns.map((col) => {
                            const align = col.align;
                            return (
                                <Table.HeaderCell key={col.id} {...(align !== undefined ? { align } : {})}>
                                    {col.sortable ? (
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Sort by ${col.id}`}
                                            aria-label={`Sort by ${col.id}`}
                                            onPress={() => handleSort(col.id)}
                                            style={{ flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            {typeof col.header === 'string' ? (
                                                <RNText>{col.header}</RNText>
                                            ) : (
                                                col.header
                                            )}
                                            <SortIndicator
                                                {...(sort?.id === col.id ? { direction: sort.direction } : {})}
                                            />
                                        </Pressable>
                                    ) : (
                                        col.header
                                    )}
                                </Table.HeaderCell>
                            );
                        })}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {pageSlice.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={columns.length}>
                                <EmptyState>{emptyState ?? 'No data'}</EmptyState>
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        pageSlice.map((row, i) => (
                            <Table.Row
                                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no guaranteed stable id in v1; v2 will add keyExtractor
                                key={i}
                                {...(onRowPress !== undefined ? { onPress: () => onRowPress(row) } : {})}
                            >
                                {columns.map((col) => {
                                    const colAlign = col.align;
                                    return (
                                        <Table.Cell
                                            key={col.id}
                                            {...(colAlign !== undefined ? { align: colAlign } : {})}
                                        >
                                            {col.cell(row)}
                                        </Table.Cell>
                                    );
                                })}
                            </Table.Row>
                        ))
                    )}
                </Table.Body>
            </Table>

            {/* Pagination controls — only shown when there is more than one page */}
            {pageCount > 1 && (
                <PaginationControls
                    page={page}
                    pageCount={pageCount}
                    canPrev={canPrev}
                    canNext={canNext}
                    goToPage={goToPage}
                />
            )}
        </View>
    );
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            {typeof children === 'string' ? (
                <RNText style={{ color: '#888', fontSize: 14 }}>{children}</RNText>
            ) : (
                children
            )}
        </View>
    );
}

function PaginationControls({
    page,
    pageCount,
    canPrev,
    canNext,
    goToPage,
}: {
    page: number;
    pageCount: number;
    canPrev: boolean;
    canNext: boolean;
    goToPage: (p: number) => void;
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingVertical: 8,
                gap: 8,
            }}
        >
            <Pressable
                onPress={canPrev ? () => goToPage(page - 1) : undefined}
                accessibilityRole="button"
                accessibilityLabel="Previous page"
                aria-label="Previous page"
                aria-disabled={!canPrev}
                style={{ opacity: canPrev ? 1 : 0.4, paddingHorizontal: 8 }}
            >
                <RNText style={{ fontSize: 14 }}>‹ Prev</RNText>
            </Pressable>
            <RNText style={{ fontSize: 14 }} aria-live="polite">
                {page} / {pageCount}
            </RNText>
            <Pressable
                onPress={canNext ? () => goToPage(page + 1) : undefined}
                accessibilityRole="button"
                accessibilityLabel="Next page"
                aria-label="Next page"
                aria-disabled={!canNext}
                style={{ opacity: canNext ? 1 : 0.4, paddingHorizontal: 8 }}
            >
                <RNText style={{ fontSize: 14 }}>Next ›</RNText>
            </Pressable>
        </View>
    );
}
