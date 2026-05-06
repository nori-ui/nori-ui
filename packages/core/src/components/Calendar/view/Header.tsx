'use client';

import type { CalendarDate } from '@internationalized/date';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../../i18n/use-translation';
import { useThemeColors } from '../../../theme/use-theme-colors';
import type { CalendarView } from '../Calendar.types';
import { formatMonthYearTitle } from '../state/locale-utils';

type HeaderProps = {
    visibleMonth: CalendarDate;
    /** Day-view multi-month title array. When length > 1, one centered
     *  title is rendered over each visible grid; the first is the
     *  drilldown trigger. */
    visibleMonths?: CalendarDate[];
    locale: string;
    view: CalendarView;
    /** Width of a single month grid; titles are centered over these slots. */
    gridWidth: number;
    /** Gap between month grids; mirrored in the title row so titles align. */
    monthGap: number;
    onPrev: () => void;
    onNext: () => void;
    /** Fires with the CalendarDate of the clicked title (the focused month
     *  in single-month mode, or the specific clicked month in multi-month). */
    onTitlePress: (clicked: CalendarDate) => void;
};

const ARROW_BUTTON_GAP = 8;

const NavButton = ({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) => {
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

const TitleButton = ({
    text,
    ariaLabel,
    onPress,
    drilldown,
}: {
    text: string;
    ariaLabel: string;
    onPress?: () => void;
    drilldown: boolean;
}) => {
    const colors = useThemeColors();
    if (!onPress) {
        return (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' }}>
                <RNText
                    style={{
                        color: colors.semantic.text.default,
                        fontSize: 15,
                        fontWeight: '600',
                        letterSpacing: -0.1,
                    }}
                >
                    {text}
                </RNText>
            </View>
        );
    }
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={ariaLabel}
            onPress={onPress}
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
                return [base, transition, { backgroundColor: bg, transform: [{ scale: pressed ? 0.97 : 1 }] }, border];
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
                {text}
            </RNText>
            {drilldown ? (
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
            ) : null}
        </Pressable>
    );
};

export const Header = ({
    visibleMonth,
    visibleMonths,
    locale,
    view,
    gridWidth,
    monthGap,
    onPrev,
    onNext,
    onTitlePress,
}: HeaderProps) => {
    const { t } = useTranslation();

    const titleText = (m: CalendarDate) => {
        if (view === 'day') {
            return formatMonthYearTitle(m, locale);
        }
        if (view === 'month') {
            return String(m.year);
        }
        const start = m.year - (m.year % 10);
        return `${start} – ${start + 11}`;
    };

    const titleAriaKey =
        view === 'day'
            ? 'calendar.header.openMonthView'
            : view === 'month'
              ? 'calendar.header.openYearView'
              : 'calendar.header.openDayView';

    const monthsToTitle = view === 'day' && visibleMonths && visibleMonths.length > 1 ? visibleMonths : null;
    const titleRowWidth = monthsToTitle
        ? monthsToTitle.length * gridWidth + (monthsToTitle.length - 1) * monthGap
        : gridWidth;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingBottom: 10,
                gap: ARROW_BUTTON_GAP,
                alignSelf: 'center',
            }}
        >
            <NavButton label={t('calendar.header.previous', { defaultValue: 'Previous' })} onPress={onPrev}>
                ‹
            </NavButton>
            <View style={{ flexDirection: 'row', gap: monthGap, width: titleRowWidth }}>
                {monthsToTitle ? (
                    monthsToTitle.map((m) => (
                        <View key={`${m.year}-${m.month}`} style={{ width: gridWidth, alignItems: 'center' }}>
                            <TitleButton
                                text={titleText(m)}
                                ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                                onPress={() => onTitlePress(m)}
                                drilldown
                            />
                        </View>
                    ))
                ) : (
                    <View style={{ width: gridWidth, alignItems: 'center' }}>
                        <TitleButton
                            text={titleText(visibleMonth)}
                            ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                            onPress={() => onTitlePress(visibleMonth)}
                            drilldown
                        />
                    </View>
                )}
            </View>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>
                ›
            </NavButton>
        </View>
    );
};
