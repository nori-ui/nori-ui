'use client';

import type { CalendarDate } from '@internationalized/date';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { formatMonthNames } from '../state/locale-utils';
import { CELL_SIZE } from './DayCell';

type MonthGridProps = {
    visibleMonth: CalendarDate;
    locale: string;
    onSelect: (month: number) => void; // 1..12
};

const ROW_KEYS = ['r0', 'r1', 'r2', 'r3'] as const;

export const MonthGrid = ({ visibleMonth, locale, onSelect }: MonthGridProps) => {
    const colors = useThemeColors();
    const names = formatMonthNames(locale);
    const gridWidth = 7 * CELL_SIZE;
    const cellHeight = 56;

    return (
        <View style={{ width: gridWidth, paddingVertical: 8 }}>
            {ROW_KEYS.map((rowKey, row) => (
                <View key={rowKey} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    {[0, 1, 2].map((col) => {
                        const idx = row * 3 + col;
                        const monthNumber = idx + 1;
                        const isCurrent = monthNumber === visibleMonth.month;
                        const name = names[idx] ?? '';
                        return (
                            <View key={monthNumber} style={{ flex: 1, paddingHorizontal: 2 }}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={name}
                                    onPress={() => onSelect(monthNumber)}
                                    style={({
                                        pressed,
                                        hovered,
                                        focused,
                                    }: {
                                        pressed: boolean;
                                        hovered?: boolean;
                                        focused?: boolean;
                                    }) => {
                                        const base: ViewStyle = {
                                            height: cellHeight,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 10,
                                        };
                                        const transition = {
                                            transitionProperty: 'background-color, transform, border-color',
                                            transitionDuration: '140ms',
                                            transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                                            outlineStyle: 'none',
                                        } as unknown as ViewStyle;
                                        let bg: string;
                                        if (isCurrent) {
                                            bg = pressed
                                                ? colors.semantic.interactive.primaryPressed
                                                : hovered
                                                  ? colors.semantic.interactive.primaryHover
                                                  : colors.semantic.interactive.primary;
                                        } else if (pressed) {
                                            bg = colors.color.primary['200'];
                                        } else if (hovered) {
                                            bg = colors.color.primary['100'];
                                        } else {
                                            bg = 'transparent';
                                        }
                                        const border =
                                            focused && !isCurrent
                                                ? { borderWidth: 2, borderColor: colors.semantic.interactive.primary }
                                                : { borderWidth: 0 };
                                        return [
                                            base,
                                            transition,
                                            { backgroundColor: bg, transform: [{ scale: pressed ? 0.96 : 1 }] },
                                            border,
                                        ];
                                    }}
                                >
                                    <RNText
                                        style={{
                                            color: isCurrent
                                                ? colors.semantic.text.inverted
                                                : colors.semantic.text.default,
                                            fontSize: 14,
                                            fontWeight: isCurrent ? '600' : '500',
                                        }}
                                    >
                                        {name}
                                    </RNText>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
