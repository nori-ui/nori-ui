'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';

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

    return (
        <View style={{ width: 7 * 36, paddingVertical: px('2') }}>
            {ROW_KEYS.map((rowKey, row) => (
                <View
                    key={rowKey}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        marginBottom: px('1'),
                    }}
                >
                    {[0, 1, 2, 3].map((col) => {
                        const year = years[row * 4 + col];
                        if (year === undefined) {
                            return null;
                        }
                        const isCurrent = year === visibleMonth.year;
                        return (
                            <Pressable
                                key={year}
                                accessibilityRole="button"
                                accessibilityLabel={String(year)}
                                onPress={() => onSelect(year)}
                                style={{
                                    paddingHorizontal: px('3'),
                                    paddingVertical: px('2'),
                                    borderRadius: px('2'),
                                    backgroundColor: isCurrent ? colors.semantic.interactive.primary : 'transparent',
                                    minWidth: 50,
                                    alignItems: 'center',
                                }}
                            >
                                <RNText
                                    style={{
                                        color: isCurrent ? colors.semantic.text.inverted : colors.semantic.text.default,
                                    }}
                                >
                                    {year}
                                </RNText>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
