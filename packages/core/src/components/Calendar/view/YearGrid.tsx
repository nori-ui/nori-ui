'use client';

import type { CalendarDate } from '@internationalized/date';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { CELL_SIZE } from './DayCell';

type YearGridProps = {
    visibleMonth: CalendarDate;
    onSelect: (year: number) => void;
};

const ROW_KEYS = ['r0', 'r1', 'r2'] as const;

export const YearGrid = ({ visibleMonth, onSelect }: YearGridProps) => {
    const colors = useThemeColors();
    const decadeStart = visibleMonth.year - (visibleMonth.year % 10);
    // Show 12 cells: 1 from previous decade, the 10 of this decade, 1 from next.
    const years = Array.from({ length: 12 }, (_, i) => decadeStart + i - 1);
    const gridWidth = 7 * CELL_SIZE;
    const cellHeight = 60;

    return (
        <View style={{ width: gridWidth, paddingVertical: 8 }}>
            {ROW_KEYS.map((rowKey, row) => (
                <View key={rowKey} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    {[0, 1, 2, 3].map((col) => {
                        const year = years[row * 4 + col];
                        if (year === undefined) {
                            return null;
                        }
                        const isCurrent = year === visibleMonth.year;
                        const isAdjacentDecade = year < decadeStart || year >= decadeStart + 10;
                        return (
                            <View key={year} style={{ flex: 1, paddingHorizontal: 2 }}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={String(year)}
                                    onPress={() => onSelect(year)}
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
                                            opacity: isAdjacentDecade ? 0.45 : 1,
                                        }}
                                    >
                                        {year}
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
