'use client';

/**
 * Shared Table internals — context, types, and compound assembly.
 *
 * Imported by both `Table.web.tsx` and `Table.native.tsx`. The actual
 * render elements (semantic HTML vs. View grid) live in those platform
 * files. This module exports only types, context, and the Object.assign
 * compound builder so both platforms ship an identical API surface.
 */

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableAlign = 'left' | 'center' | 'right';

export type TableProps = {
    /** Alternating row background tinting. */
    striped?: boolean;
    /** Reduced cell padding for dense layouts. */
    compact?: boolean;
    /** Draw borders around all cells. */
    bordered?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export type TableRowProps = {
    /** Visually highlight this row as selected. */
    selected?: boolean;
    /** Press handler — makes the row interactive on both platforms. */
    onPress?: () => void;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export type TableCellProps = {
    /** Horizontal alignment of cell content. @defaultValue 'left' */
    align?: TableAlign;
    /** HTML colspan / native column span (visual only on native). */
    colSpan?: number;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export type TableHeaderCellProps = TableCellProps;

export type TableSectionProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export type TableCaptionProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// ─── Context ──────────────────────────────────────────────────────────────────

export type TableContextValue = {
    striped: boolean;
    compact: boolean;
    bordered: boolean;
    /** Zero-based row index for striped row coloring — incremented per Body row */
    rowIndex: number;
    setRowIndex: (n: number) => void;
};

export const TableContext = createContext<TableContextValue>({
    striped: false,
    compact: false,
    bordered: false,
    rowIndex: 0,
    setRowIndex: () => {},
});

export const useTableContext = (): TableContextValue => useContext(TableContext);

// ─── Compound builder ─────────────────────────────────────────────────────────

/**
 * Attach sub-components to a Root component via `Object.assign` and return
 * the compound. Both `.web.tsx` and `.native.tsx` call this with their
 * platform-specific implementations so consumers get the same dot-notation API.
 */
export function buildTableCompound<
    Root extends React.ComponentType<TableProps>,
    Header extends React.ComponentType<TableSectionProps>,
    Body extends React.ComponentType<TableSectionProps>,
    Footer extends React.ComponentType<TableSectionProps>,
    Row extends React.ComponentType<TableRowProps>,
    HeaderCell extends React.ComponentType<TableHeaderCellProps>,
    Cell extends React.ComponentType<TableCellProps>,
    Caption extends React.ComponentType<TableCaptionProps>,
>(parts: {
    Root: Root;
    Header: Header;
    Body: Body;
    Footer: Footer;
    Row: Row;
    HeaderCell: HeaderCell;
    Cell: Cell;
    Caption: Caption;
}) {
    return Object.assign(parts.Root, {
        Header: parts.Header,
        Body: parts.Body,
        Footer: parts.Footer,
        Row: parts.Row,
        HeaderCell: parts.HeaderCell,
        Cell: parts.Cell,
        Caption: parts.Caption,
    });
}

// needed for the generic parameter above
import type React from 'react';
