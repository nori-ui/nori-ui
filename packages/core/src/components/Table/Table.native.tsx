'use client';

/**
 * Native Table implementation — uses View flex-grid for iOS/Android.
 * Metro resolves `.native.tsx` over `.tsx`, so this file wins on native builds.
 *
 * Layout: each Row is `flexDirection: 'row'`. Cells get equal flex weight
 * (flex: 1) in v1. Variable-width columns via explicit `width` props are a v2
 * improvement. Header/Body/Footer/Caption are structural wrappers only.
 */

import { useCallback, useState } from 'react';
import { Pressable, Text as RNText, ScrollView, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
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
    useTableContext,
} from './Table.shared';

// ─── Root ─────────────────────────────────────────────────────────────────────

const TableRoot = ({ striped = false, compact = false, bordered = false, children, testID }: TableProps) => {
    const colors = useThemeColors();
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
            <ScrollView horizontal testID={testID}>
                <View
                    style={{
                        borderWidth: bordered ? 1 : 0,
                        borderColor: colors.semantic.border.default,
                        borderRadius: px(colors.radius.md),
                    }}
                >
                    {children}
                </View>
            </ScrollView>
        </TableContext.Provider>
    );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const TableHeader = ({ children, testID }: TableSectionProps) => {
    const colors = useThemeColors();
    return (
        <View
            testID={testID}
            style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.semantic.border.default,
            }}
        >
            {children}
        </View>
    );
};

// ─── Body ─────────────────────────────────────────────────────────────────────

const TableBody = ({ children, testID }: TableSectionProps) => <View testID={testID}>{children}</View>;

// ─── Footer ───────────────────────────────────────────────────────────────────

const TableFooter = ({ children, testID }: TableSectionProps) => {
    const colors = useThemeColors();
    return (
        <View
            testID={testID}
            style={{
                borderTopWidth: 1,
                borderTopColor: colors.semantic.border.default,
            }}
        >
            {children}
        </View>
    );
};

// ─── Row ──────────────────────────────────────────────────────────────────────

const TableRow = ({ selected = false, onPress, children, testID }: TableRowProps) => {
    const colors = useThemeColors();
    const { compact } = useTableContext();

    const handlePress = useCallback(() => {
        onPress?.();
    }, [onPress]);

    const rowContent = (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: selected ? colors.semantic.background.subtle : undefined,
                paddingVertical: compact ? px(colors.spacing['1']) : px(colors.spacing['3']),
                borderBottomWidth: 1,
                borderBottomColor: colors.semantic.border.default,
            }}
            testID={testID}
        >
            {children}
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                })}
            >
                {rowContent}
            </Pressable>
        );
    }

    return rowContent;
};

// ─── HeaderCell ───────────────────────────────────────────────────────────────

const TableHeaderCell = ({ align = 'left', children, testID }: TableHeaderCellProps) => {
    const colors = useThemeColors();
    const { compact } = useTableContext();
    return (
        <View
            testID={testID}
            style={{
                flex: 1,
                paddingHorizontal: px(colors.spacing['4']),
                paddingVertical: compact ? px(colors.spacing['1']) : px(colors.spacing['2']),
                alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
            }}
        >
            <RNText
                style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.semantic.text.muted,
                }}
            >
                {children}
            </RNText>
        </View>
    );
};

// ─── Cell ─────────────────────────────────────────────────────────────────────

const TableCell = ({ align = 'left', children, testID }: TableCellProps) => {
    const colors = useThemeColors();
    const { compact } = useTableContext();
    return (
        <View
            testID={testID}
            style={{
                flex: 1,
                paddingHorizontal: px(colors.spacing['4']),
                paddingVertical: compact ? px(colors.spacing['1']) : px(colors.spacing['3']),
                alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
            }}
        >
            {typeof children === 'string' || typeof children === 'number' ? (
                <RNText style={{ fontSize: 14, color: colors.semantic.text.default }}>{children}</RNText>
            ) : (
                children
            )}
        </View>
    );
};

// ─── Caption ──────────────────────────────────────────────────────────────────

const TableCaption = ({ children, testID }: TableCaptionProps) => {
    const colors = useThemeColors();
    return (
        <View testID={testID} style={{ paddingTop: px(colors.spacing['3']), alignItems: 'center' }}>
            <RNText style={{ fontSize: 12, color: colors.semantic.text.muted }}>{children}</RNText>
        </View>
    );
};

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
