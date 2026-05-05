'use client';

import type { CalendarDate } from '@internationalized/date';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../../i18n/use-translation';
import { px } from '../../../theme/px';
import { useThemeColors } from '../../../theme/use-theme-colors';
import type { CalendarView } from '../Calendar.types';
import { formatMonthYearTitle } from '../state/locale-utils';

type HeaderProps = {
    visibleMonth: CalendarDate;
    locale: string;
    view: CalendarView;
    onPrev: () => void;
    onNext: () => void;
    onTitlePress: () => void;
};

const NavButton = ({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) => {
    const colors = useThemeColors();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: px('2'),
            }}
        >
            <RNText style={{ color: colors.semantic.text.default, fontSize: 18 }}>{children}</RNText>
        </Pressable>
    );
};

export const Header = ({ visibleMonth, locale, view, onPrev, onNext, onTitlePress }: HeaderProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();

    const title = (() => {
        if (view === 'day') {
            return formatMonthYearTitle(visibleMonth, locale);
        }
        if (view === 'month') {
            return String(visibleMonth.year);
        }
        const start = visibleMonth.year - (visibleMonth.year % 10);
        return `${start} – ${start + 11}`;
    })();

    const titleAriaKey =
        view === 'day'
            ? 'calendar.header.openMonthView'
            : view === 'month'
              ? 'calendar.header.openYearView'
              : 'calendar.header.openDayView';

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: px('2'),
            }}
        >
            <NavButton label={t('calendar.header.previous', { defaultValue: 'Previous' })} onPress={onPrev}>
                ‹
            </NavButton>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                onPress={onTitlePress}
                style={{
                    paddingHorizontal: px('3'),
                    paddingVertical: px('2'),
                    borderRadius: px('2'),
                }}
            >
                <RNText style={{ color: colors.semantic.text.default, fontSize: 16, fontWeight: '600' }}>
                    {title}
                </RNText>
            </Pressable>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>
                ›
            </NavButton>
        </View>
    );
};
