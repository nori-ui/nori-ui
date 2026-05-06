'use client';

import type { CalendarDate } from '@internationalized/date';
import { type ReactNode, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../../i18n/use-translation';
import { useThemeColors } from '../../../theme/use-theme-colors';
import { Select } from '../../Select';
import type { CalendarCaption, CalendarView } from '../Calendar.types';
import { formatMonthNames, formatMonthYearTitle } from '../state/locale-utils';
import { type CaptionContextValue, type CaptionOption, CaptionProvider } from '../state/use-caption';

const ARROW_BUTTON_GAP = 8;

type CaptionProps = {
    /** All visible months, leftmost first. Always length-1 for non-day views. */
    months: ReadonlyArray<CalendarDate>;
    locale: string;
    view: CalendarView;
    caption: CalendarCaption;
    /** Width of one month grid; titles align centered above each grid. */
    gridWidth: number;
    monthGap: number;
    /** Year-dropdown bounds. */
    yearRange: [min: number, max: number];
    /** Constraint for disabling out-of-bounds options. */
    isMonthDisabled?: (year: number, month: number) => boolean;
    isYearDisabled?: (year: number) => boolean;
    onPrev: () => void;
    onNext: () => void;
    onTitlePress: (clicked: CalendarDate) => void;
    /** Mutate the anchor month for a specific visible month index. */
    onSetMonth: (slotIndex: number, month: number) => void;
    onSetYear: (slotIndex: number, year: number) => void;
    /** Children for `caption="custom"` mode. */
    children?: ReactNode;
};

type NavButtonProps = {
    label: string;
    onPress: () => void;
    children: ReactNode;
};

const NavButton = ({ label, onPress, children }: NavButtonProps) => {
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
                <RNText aria-hidden style={{ color: colors.semantic.text.muted, fontSize: 10, opacity: 0.7 }}>
                    ▾
                </RNText>
            ) : null}
        </Pressable>
    );
};

export const Caption = ({
    months,
    locale,
    view,
    caption,
    gridWidth,
    monthGap,
    yearRange,
    isMonthDisabled,
    isYearDisabled,
    onPrev,
    onNext,
    onTitlePress,
    onSetMonth,
    onSetYear,
    children,
}: CaptionProps) => {
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

    // Title row width — sized to the visible grids so titles align over them.
    const showMultiTitles = view === 'day' && months.length > 1;
    const titleRowWidth = showMultiTitles ? months.length * gridWidth + (months.length - 1) * monthGap : gridWidth;

    // Month and year option lists — used by the dropdown / custom modes.
    const monthNames = useMemo(() => formatMonthNames(locale), [locale]);

    // Custom mode: provide the context for slot consumers and render their JSX.
    // We use `months[0]` (focused leftmost month) for context — when consumers
    // need per-month dropdowns they can compose multiple `Calendar.Caption`s.
    const focused = months[0] ?? undefined;
    if (!focused) {
        return null;
    }
    const ctxValue: CaptionContextValue = {
        month: focused.month,
        year: focused.year,
        visibleMonth: focused,
        monthOptions: monthNames.map((label, i) => ({
            value: i + 1,
            label,
            disabled: isMonthDisabled?.(focused.year, i + 1) ?? false,
        })),
        yearOptions: Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => ({
            value: yearRange[0] + i,
            label: String(yearRange[0] + i),
            disabled: isYearDisabled?.(yearRange[0] + i) ?? false,
        })),
        setMonth: (m) => onSetMonth(0, m),
        setYear: (y) => onSetYear(0, y),
        goPrev: onPrev,
        goNext: onNext,
    };

    if (caption === 'custom') {
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
                <CaptionProvider value={ctxValue}>{children}</CaptionProvider>
            </View>
        );
    }

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
                {showMultiTitles ? (
                    months.map((m, i) => (
                        <View key={`${m.year}-${m.month}`} style={{ width: gridWidth, alignItems: 'center' }}>
                            {caption === 'dropdown' && view === 'day' ? (
                                <DropdownPair
                                    month={m.month}
                                    year={m.year}
                                    monthOptions={monthNames.map((label, j) => ({
                                        value: j + 1,
                                        label,
                                        disabled: isMonthDisabled?.(m.year, j + 1) ?? false,
                                    }))}
                                    yearOptions={makeYearOptions(yearRange, isYearDisabled)}
                                    onMonthChange={(next) => onSetMonth(i, next)}
                                    onYearChange={(next) => onSetYear(i, next)}
                                />
                            ) : (
                                <TitleButton
                                    text={titleText(m)}
                                    ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                                    onPress={() => onTitlePress(m)}
                                    drilldown
                                />
                            )}
                        </View>
                    ))
                ) : (
                    <View style={{ width: gridWidth, alignItems: 'center' }}>
                        {caption === 'dropdown' && view === 'day' ? (
                            <DropdownPair
                                month={focused.month}
                                year={focused.year}
                                monthOptions={monthNames.map((label, j) => ({
                                    value: j + 1,
                                    label,
                                    disabled: isMonthDisabled?.(focused.year, j + 1) ?? false,
                                }))}
                                yearOptions={makeYearOptions(yearRange, isYearDisabled)}
                                onMonthChange={(next) => onSetMonth(0, next)}
                                onYearChange={(next) => onSetYear(0, next)}
                            />
                        ) : (
                            <TitleButton
                                text={titleText(focused)}
                                ariaLabel={t(titleAriaKey, { defaultValue: 'Change view' })}
                                onPress={() => onTitlePress(focused)}
                                drilldown
                            />
                        )}
                    </View>
                )}
            </View>
            <NavButton label={t('calendar.header.next', { defaultValue: 'Next' })} onPress={onNext}>
                ›
            </NavButton>
        </View>
    );
};

const makeYearOptions = (
    yearRange: [number, number],
    isYearDisabled?: (year: number) => boolean
): ReadonlyArray<CaptionOption> =>
    Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => ({
        value: yearRange[0] + i,
        label: String(yearRange[0] + i),
        disabled: isYearDisabled?.(yearRange[0] + i) ?? false,
    }));

type DropdownPairProps = {
    month: number;
    year: number;
    monthOptions: ReadonlyArray<CaptionOption>;
    yearOptions: ReadonlyArray<CaptionOption>;
    onMonthChange: (m: number) => void;
    onYearChange: (y: number) => void;
};

const DropdownPair = ({ month, year, monthOptions, yearOptions, onMonthChange, onYearChange }: DropdownPairProps) => {
    return (
        <View style={{ flexDirection: 'row', gap: 6 }}>
            <Select
                value={String(month)}
                onChange={(v) => onMonthChange(Number(v))}
                options={monthOptions.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                    disabled: o.disabled,
                }))}
                aria-label="Month"
                searchable={false}
            />
            <Select
                value={String(year)}
                onChange={(v) => onYearChange(Number(v))}
                options={yearOptions.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                    disabled: o.disabled,
                }))}
                aria-label="Year"
                searchable={false}
            />
        </View>
    );
};
