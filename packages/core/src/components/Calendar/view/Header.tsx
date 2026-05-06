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
    /** The focused month (used when no `visibleMonths` array is given). */
    visibleMonth: CalendarDate;
    /**
     * Full array of months displayed when in day view. When length > 1,
     * the header renders one centered title per month — the first is a
     * drilldown trigger, the rest are inert labels. Falls back to
     * `[visibleMonth]` if omitted.
     */
    visibleMonths?: CalendarDate[];
    locale: string;
    view: CalendarView;
    onPrev: () => void;
    onNext: () => void;
    onTitlePress: () => void;
};

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
    const interactive = !!onPress;
    if (!interactive) {
        // Inert label — no Pressable, just centered text.
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

export const Header = ({ visibleMonth, visibleMonths, locale, view, onPrev, onNext, onTitlePress }: HeaderProps) => {
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

    // Multi-month day view: render one title per visible month, evenly distributed.
    const monthsToTitle = view === 'day' && visibleMonths && visibleMonths.length > 1 ? visibleMonths : null;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingBottom: 10,
            }}
        >
            <NavButton label={t('calendar.header.previous', { defaultValue: 'Previous' })} onPress={onPrev}>
                ‹
            </NavButton>
            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                }}
            >
                {monthsToTitle ? (
                    monthsToTitle.map((m, i) => (
                        <TitleButton
                            key={`${m.year}-${m.month}`}
                            text={titleText(m)}
                            ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                            // First month is the drilldown trigger; the rest are inert labels.
                            {...(i === 0 ? { onPress: onTitlePress } : {})}
                            drilldown={i === 0}
                        />
                    ))
                ) : (
                    <TitleButton
                        text={titleText(visibleMonth)}
                        ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                        onPress={onTitlePress}
                        drilldown
                    />
                )}
            </View>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>
                ›
            </NavButton>
        </View>
    );
};
