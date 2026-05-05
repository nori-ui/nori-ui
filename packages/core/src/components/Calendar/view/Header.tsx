'use client';

import type { CalendarDate } from '@internationalized/date';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../../i18n/use-translation';
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
            style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => {
                const base: ViewStyle = {
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                };
                const transition = {
                    transitionProperty: 'background-color, border-color, transform',
                    transitionDuration: '140ms',
                    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                    outlineStyle: 'none',
                } as unknown as ViewStyle;
                const bg = pressed
                    ? colors.color.primary['200']
                    : hovered
                      ? colors.color.primary['100']
                      : 'transparent';
                const border = focused
                    ? { borderWidth: 2, borderColor: colors.semantic.interactive.primary }
                    : { borderWidth: 0 };
                return [base, transition, { backgroundColor: bg, transform: [{ scale: pressed ? 0.94 : 1 }] }, border];
            }}
        >
            <RNText style={{ color: colors.semantic.text.default, fontSize: 16, lineHeight: 16, fontWeight: '500' }}>
                {children}
            </RNText>
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
                paddingBottom: 10,
            }}
        >
            <NavButton label={t('calendar.header.previous', { defaultValue: 'Previous' })} onPress={onPrev}>
                ‹
            </NavButton>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                onPress={onTitlePress}
                style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => {
                    const base: ViewStyle = {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    };
                    const transition = {
                        transitionProperty: 'background-color, transform',
                        transitionDuration: '140ms',
                        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                        outlineStyle: 'none',
                    } as unknown as ViewStyle;
                    const bg = pressed
                        ? colors.color.primary['200']
                        : hovered
                          ? colors.color.primary['100']
                          : 'transparent';
                    const border = focused
                        ? { borderWidth: 2, borderColor: colors.semantic.interactive.primary }
                        : { borderWidth: 0 };
                    return [
                        base,
                        transition,
                        { backgroundColor: bg, transform: [{ scale: pressed ? 0.97 : 1 }] },
                        border,
                    ];
                }}
            >
                <RNText
                    style={{
                        color: colors.semantic.text.default,
                        fontSize: 15,
                        fontWeight: '600',
                        letterSpacing: -0.1,
                    }}
                >
                    {title}
                </RNText>
                {/* Chevron sibling — hints that the title is interactive (drilldown).
                    Kept as a separate text node so test queries like
                    getByText(/May 2026/) and getByText('2026') still match. */}
                <RNText
                    aria-hidden
                    style={{
                        color: colors.semantic.text.muted,
                        fontSize: 10,
                        opacity: 0.7,
                    }}
                >
                    ▾
                </RNText>
            </Pressable>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>
                ›
            </NavButton>
        </View>
    );
};
