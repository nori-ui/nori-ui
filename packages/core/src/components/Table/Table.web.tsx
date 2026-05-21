'use client';

/**
 * Web Table implementation — uses semantic HTML table elements for full
 * accessibility. Metro never resolves this file; Vite / Next.js pick it up
 * via the `.web.tsx` extension.
 */

import { useCallback, useState } from 'react';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import {
    buildTableCompound,
    type TableCaptionProps,
    type TableCellProps,
    TableContext,
    type TableContextValue,
    type TableHeaderCellProps,
    type TableProps,
    type TableRowProps,
    type TableSectionProps,
} from './Table.shared';

// ─── Root ─────────────────────────────────────────────────────────────────────

const TableRoot = ({ striped = false, compact = false, bordered = false, children, className, testID }: TableProps) => {
    const [rowIndex, setRowIndex] = useState(0);
    const ctxValue: TableContextValue = {
        striped,
        compact,
        bordered,
        rowIndex,
        setRowIndex,
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
        {children}
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
    const handleClick = useCallback(() => {
        onPress?.();
    }, [onPress]);

    return (
        <tr
            className={cn(
                'border-b border-semantic-border-default transition-colors',
                onPress && 'cursor-pointer hover:bg-semantic-background-subtle',
                selected && 'bg-semantic-background-subtle',
                className
            )}
            style={selected ? { backgroundColor: colors.semantic.background.subtle } : undefined}
            onClick={onPress ? handleClick : undefined}
            {...(testID !== undefined ? { 'data-testid': testID } : {})}
        >
            {children}
        </tr>
    );
};

// ─── HeaderCell ───────────────────────────────────────────────────────────────

const TableHeaderCell = ({ align = 'left', colSpan, children, className, testID }: TableHeaderCellProps) => (
    <th
        className={cn(
            'h-10 px-4 font-medium text-semantic-text-secondary',
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

// ─── Cell ─────────────────────────────────────────────────────────────────────

const TableCell = ({ align = 'left', colSpan, children, className, testID }: TableCellProps) => (
    <td
        className={cn(
            'p-4 align-middle',
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

// ─── Caption ──────────────────────────────────────────────────────────────────

const TableCaption = ({ children, className, testID }: TableCaptionProps) => (
    <caption
        className={cn('mt-4 text-sm text-semantic-text-secondary', className)}
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
