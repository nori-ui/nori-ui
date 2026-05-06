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
};

export const CELL_SIZE = 40;

export const DayCell = ({ ctx, onPress, onHoverIn, onHoverOut, renderDay }: DayCellProps) => {
    const colors = useThemeColors();

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
            accessibilityState={{ disabled: ctx.isUnavailable }}
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
            {...(dataState ? { 'data-state': dataState } : {})}
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
