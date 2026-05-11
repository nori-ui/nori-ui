'use client';

import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useThemeColors } from '../../../theme/use-theme-colors';
import type { DayContext } from '../Calendar.types';

export type DayCellProps = {
    ctx: DayContext;
    onPress: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
    /** When provided, the slot wins over default day rendering. */
    renderDay?: (ctx: DayContext) => ReactNode;
    /**
     * BCP-47 locale used to format the accessibility label
     * (e.g. "Friday, May 8, 2026"). Falls back to undefined (runtime default)
     * if not provided.
     */
    locale?: string;
};

export const CELL_SIZE = 40;

/**
 * Module-scope cache of Intl.DateTimeFormat instances keyed by locale.
 * Prior to caching, each DayCell instantiated a new formatter per render
 * (~420+ instantiations per scroll burst in scroll mode). The cache is
 * unbounded but the live locale set is also bounded — typically 1–2
 * entries per app — so no LRU is needed.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();
const RUNTIME_DEFAULT_LOCALE_KEY = '__default__';

const getDayFormatter = (locale: string | undefined): Intl.DateTimeFormat | null => {
    const key = locale ?? RUNTIME_DEFAULT_LOCALE_KEY;
    const cached = formatterCache.get(key);
    if (cached) return cached;
    try {
        const fmt = new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        });
        formatterCache.set(key, fmt);
        return fmt;
    } catch {
        return null;
    }
};

/**
 * Builds the day cell's accessibility label. Format:
 *   "{weekday}, {Month} {day}, {year}" + optional state suffixes,
 * e.g. "Friday, May 8, 2026, today, selected".
 *
 * Kept module-local so view tests / Profiler harnesses can match it
 * with a regex without depending on Intl output for the suffix.
 *
 * KNOWN LIMITATION: State suffixes ("today", "selected", "in range",
 * "unavailable") are hardcoded English. Non-English locales get
 * mixed-language output (e.g. "2026年5月8日金曜日, today"). Proper
 * fix routes these through the project's i18n provider; tracked as
 * a follow-up to be addressed alongside the broader i18n sweep.
 *
 * TODO(i18n): localize state suffixes.
 */
const formatDayLabel = (ctx: DayContext, locale?: string): string => {
    const jsDate = new Date(Date.UTC(ctx.date.year, ctx.date.month - 1, ctx.date.day));
    const fmt = getDayFormatter(locale);
    const base = fmt
        ? fmt.format(jsDate)
        : // Fallback if the runtime rejects the locale tag.
          `${ctx.date.month}/${ctx.date.day}/${ctx.date.year}`;

    const suffixes: string[] = [];
    if (ctx.isToday) suffixes.push('today');
    if (ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd) suffixes.push('selected');
    if (ctx.isInRange && !ctx.isRangeStart && !ctx.isRangeEnd) suffixes.push('in range');
    if (ctx.isUnavailable) suffixes.push('unavailable');

    return suffixes.length > 0 ? `${base}, ${suffixes.join(', ')}` : base;
};

export const DayCell = ({ ctx, onPress, onHoverIn, onHoverOut, renderDay, locale }: DayCellProps) => {
    const colors = useThemeColors();
    const accessibilityLabel = formatDayLabel(ctx, locale);

    const isSelectedLike = ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd;

    // Range middle / preview cells get a flat background drawn by the
    // gridcell wrapper in DayGrid (so adjacent cells visually connect).
    // The DayCell itself is transparent in that case.
    const isInsideRange = ctx.isInRange || ctx.isInPreviewRange;
    const isRangeMiddle = isInsideRange && !isSelectedLike;

    const dataState = ctx.isSelected
        ? 'selected'
        : ctx.isRangeStart
          ? 'range-start'
          : ctx.isRangeEnd
            ? 'range-end'
            : ctx.isInPreviewRange
              ? 'preview'
              : ctx.isInRange
                ? 'in-range'
                : undefined;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: ctx.isUnavailable, selected: isSelectedLike }}
            disabled={ctx.isUnavailable}
            onPress={onPress}
            {...(onHoverIn ? { onHoverIn } : {})}
            {...(onHoverOut ? { onHoverOut } : {})}
            style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => {
                const base: ViewStyle = {
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999, // perfect circle for endpoints/selected
                    position: 'relative',
                };

                if (ctx.isUnavailable) {
                    return [base, { opacity: 0.28 }];
                }

                let backgroundColor: string | undefined;
                let transform: ViewStyle['transform'];
                let borderWidth: number | undefined;
                let borderColor: string | undefined;

                if (isSelectedLike) {
                    backgroundColor = colors.semantic.interactive.primary;
                    if (pressed) {
                        backgroundColor = colors.semantic.interactive.primaryPressed;
                    } else if (hovered) {
                        backgroundColor = colors.semantic.interactive.primaryHover;
                    }
                    transform = [{ scale: pressed ? 0.94 : 1 }];
                } else if (isRangeMiddle) {
                    // Sits ON TOP of the gridcell range fill. Keep transparent
                    // so the bar reads continuous across cells. On hover we
                    // brighten with a soft circular halo.
                    backgroundColor = hovered ? colors.color.primary['200'] : 'transparent';
                    transform = [{ scale: pressed ? 0.94 : 1 }];
                } else {
                    // Idle / hover / focus on a non-selected non-range cell.
                    if (pressed) {
                        backgroundColor = colors.color.primary['200'];
                    } else if (hovered) {
                        backgroundColor = colors.color.primary['100'];
                    } else {
                        backgroundColor = 'transparent';
                    }
                    transform = [{ scale: pressed ? 0.94 : 1 }];
                }

                if ((ctx.isFocused || focused) && !isSelectedLike) {
                    borderWidth = 2;
                    borderColor = colors.semantic.interactive.primary;
                }

                // RN-Web honors these as CSS transitions; native ignores silently.
                const transition: ViewStyle = {
                    transitionProperty: 'background-color, transform, border-color, opacity',
                    transitionDuration: '140ms',
                    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                    outlineStyle: 'none',
                } as unknown as ViewStyle;

                return [
                    base,
                    transition,
                    {
                        backgroundColor,
                        ...(transform ? { transform } : {}),
                        ...(borderWidth ? { borderWidth, borderColor } : {}),
                    },
                ];
            }}
            {...({
                dataSet: {
                    dayKey: `${ctx.date.year}-${ctx.date.month}-${ctx.date.day}`,
                    ...(dataState ? { state: dataState } : {}),
                },
            } as unknown as { dataSet: Record<string, string> })}
        >
            {renderDay ? (
                renderDay(ctx)
            ) : (
                <>
                    <RNText
                        style={
                            {
                                color: isSelectedLike
                                    ? colors.semantic.text.inverted
                                    : ctx.isOutsideMonth
                                      ? colors.semantic.text.muted
                                      : colors.semantic.text.default,
                                fontSize: 14,
                                fontWeight: ctx.isToday ? '600' : '400',
                                opacity: ctx.isOutsideMonth ? 0.55 : 1,
                                transitionProperty: 'color',
                                transitionDuration: '140ms',
                            } as unknown as TextStyle
                        }
                    >
                        {ctx.date.day}
                    </RNText>
                    {/* Today indicator: a 4px dot below the number, primary-colored,
                        becomes white when the cell is selected. Subtler than a ring
                        and never causes layout shift. */}
                    {ctx.isToday ? (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 5,
                                width: 4,
                                height: 4,
                                borderRadius: 999,
                                backgroundColor: isSelectedLike
                                    ? colors.semantic.text.inverted
                                    : colors.semantic.interactive.primary,
                            }}
                        />
                    ) : null}
                </>
            )}
        </Pressable>
    );
};
