'use client';

/**
 * Web Table implementation — uses semantic HTML table elements for full
 * accessibility. Metro never resolves this file; Vite / Next.js pick it up
 * via the `.web.tsx` extension.
 */

import type { KeyboardEvent } from 'react';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import {
    buildTableCompound,
    IndexedRows,
    type TableCaptionProps,
    type TableCellProps,
    TableContext,
    type TableContextValue,
    type TableHeaderCellProps,
    type TableProps,
    type TableRowProps,
    type TableSectionProps,
    useTableContext,
} from './Table.shared';

// ─── Root ─────────────────────────────────────────────────────────────────────

const TableRoot = ({ striped = false, compact = false, bordered = false, children, className, testID }: TableProps) => {
    const ctxValue: TableContextValue = {
        striped,
        compact,
        bordered,
        rowIndex: 0,
        setRowIndex: () => {},
    };
    return (
        <TableContext.Provider value={ctxValue}>
            <div className={cn('w-full overflow-auto', className)}>
                <table
                    className={cn(
                        'w-full caption-bottom text-sm',
                        bordered && 'border border-semantic-border-default',
                        className
                    )}
                    {...(testID !== undefined ? { 'data-testid': testID } : {})}
                >
                    {children}
                </table>
            </div>
        </TableContext.Provider>
    );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const TableHeader = ({ children, className, testID }: TableSectionProps) => (
    <thead
        className={cn('[&_tr]:border-b [&_tr]:border-semantic-border-default', className)}
        {...(testID !== undefined ? { 'data-testid': testID } : {})}
    >
        {children}
    </thead>
);

// ─── Body ─────────────────────────────────────────────────────────────────────

const TableBody = ({ children, className, testID }: TableSectionProps) => (
    <tbody
        className={cn('[&_tr:last-child]:border-0', className)}
        {...(testID !== undefined ? { 'data-testid': testID } : {})}
    >
        <IndexedRows>{children}</IndexedRows>
    </tbody>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

const TableFooter = ({ children, className, testID }: TableSectionProps) => (
    <tfoot
        className={cn('border-t border-semantic-border-default font-medium', className)}
        {...(testID !== undefined ? { 'data-testid': testID } : {})}
    >
        {children}
    </tfoot>
);

// ─── Row ──────────────────────────────────────────────────────────────────────

const TableRow = ({ selected = false, onPress, children, className, testID }: TableRowProps) => {
    const colors = useThemeColors();
    const { striped, rowIndex } = useTableContext();
    const tinted = selected || (striped && rowIndex % 2 === 1);

    const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
        // Keys pressed inside a nested control (a checkbox, a link) belong to that control.
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPress?.();
        }
    };

    return (
        // The row keeps its implicit `row` role: `role="button"` would detach
        // the cells from the table for assistive technology.
        <tr
            className={cn(
                'border-b border-semantic-border-default transition-colors',
                onPress &&
                    'cursor-pointer hover:bg-semantic-background-subtle focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-semantic-interactive-primary',
                selected && 'bg-semantic-background-subtle',
                className
            )}
            style={tinted ? { backgroundColor: colors.semantic.background.subtle } : undefined}
            {...(onPress ? { tabIndex: 0, onClick: () => onPress(), onKeyDown: handleKeyDown } : {})}
            {...(testID !== undefined ? { 'data-testid': testID } : {})}
        >
            {children}
        </tr>
    );
};

// ─── HeaderCell ───────────────────────────────────────────────────────────────

const TableHeaderCell = ({ align = 'left', colSpan, children, className, testID }: TableHeaderCellProps) => {
    const { compact, bordered } = useTableContext();
    return (
        <th
            className={cn(
                'px-4 font-medium text-semantic-text-muted',
                compact ? 'h-8' : 'h-10',
                bordered && 'border border-semantic-border-default',
                align === 'right' && 'text-right',
                align === 'center' && 'text-center',
                align === 'left' && 'text-left',
                className
            )}
            colSpan={colSpan}
            {...(testID !== undefined ? { 'data-testid': testID } : {})}
        >
            {children}
        </th>
    );
};

// ─── Cell ─────────────────────────────────────────────────────────────────────

const TableCell = ({ align = 'left', colSpan, children, className, testID }: TableCellProps) => {
    const { compact, bordered } = useTableContext();
    return (
        <td
            className={cn(
                'align-middle',
                compact ? 'px-4 py-2' : 'p-4',
                bordered && 'border border-semantic-border-default',
                align === 'right' && 'text-right',
                align === 'center' && 'text-center',
                align === 'left' && 'text-left',
                className
            )}
            colSpan={colSpan}
            {...(testID !== undefined ? { 'data-testid': testID } : {})}
        >
            {children}
        </td>
    );
};

// ─── Caption ──────────────────────────────────────────────────────────────────

const TableCaption = ({ children, className, testID }: TableCaptionProps) => (
    <caption
        className={cn('mt-4 text-sm text-semantic-text-muted', className)}
        {...(testID !== undefined ? { 'data-testid': testID } : {})}
    >
        {children}
    </caption>
);

// ─── Compound export ──────────────────────────────────────────────────────────

export const Table = buildTableCompound({
    Root: TableRoot,
    Header: TableHeader,
    Body: TableBody,
    Footer: TableFooter,
    Row: TableRow,
    HeaderCell: TableHeaderCell,
    Cell: TableCell,
    Caption: TableCaption,
});

export type {
    TableAlign,
    TableCaptionProps,
    TableCellProps,
    TableHeaderCellProps,
    TableProps,
    TableRowProps,
    TableSectionProps,
} from './Table.shared';
