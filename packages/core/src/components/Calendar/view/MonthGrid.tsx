'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { formatMonthNames } from '../state/locale-utils';

type MonthGridProps = {
    visibleMonth: CalendarDate;
    locale: string;
    onSelect: (month: number) => void; // 1..12
};

const ROW_KEYS = ['r0', 'r1', 'r2', 'r3'] as const;

export const MonthGrid = ({ visibleMonth, locale, onSelect }: MonthGridProps) => {
    const colors = useThemeColors();
    const names = formatMonthNames(locale);

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
                    {[0, 1, 2].map((col) => {
                        const idx = row * 3 + col;
                        const monthNumber = idx + 1;
                        const isCurrent = monthNumber === visibleMonth.month;
                        const name = names[idx] ?? '';
                        return (
                            <Pressable
                                key={monthNumber}
                                accessibilityRole="button"
                                accessibilityLabel={name}
                                onPress={() => onSelect(monthNumber)}
                                style={{
                                    paddingHorizontal: px('3'),
                                    paddingVertical: px('2'),
                                    borderRadius: px('2'),
                                    backgroundColor: isCurrent ? colors.semantic.interactive.primary : 'transparent',
                                    minWidth: 70,
                                    alignItems: 'center',
                                }}
                            >
                                <RNText
                                    style={{
                                        color: isCurrent ? colors.semantic.text.inverted : colors.semantic.text.default,
                                    }}
                                >
                                    {name}
                                </RNText>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
