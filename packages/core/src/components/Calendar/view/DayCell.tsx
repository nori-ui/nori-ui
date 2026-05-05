'use client';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';
import { px } from '../../../theme/px';
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

const SIZE = 36;

export const DayCell = ({ ctx, onPress, onHoverIn, onHoverOut, renderDay }: DayCellProps) => {
    const colors = useThemeColors();

    const baseStyle: ViewStyle = {
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px('2'),
    };

    const isSelectedLike = ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd;
    const stateStyle: ViewStyle = (() => {
        if (ctx.isUnavailable) {
            return { opacity: 0.4 };
        }
        if (isSelectedLike) {
            return { backgroundColor: colors.semantic.interactive.primary };
        }
        if (ctx.isInRange || ctx.isInPreviewRange) {
            return { backgroundColor: colors.color.primary['100'] };
        }
        return {};
    })();

    const todayRingStyle: ViewStyle =
        ctx.isToday && !isSelectedLike ? { borderWidth: 1, borderColor: colors.semantic.interactive.primary } : {};

    const textColor = isSelectedLike
        ? colors.semantic.text.inverted
        : ctx.isOutsideMonth
          ? colors.semantic.text.muted
          : colors.semantic.text.default;

    const dataState = ctx.isSelected
        ? 'selected'
        : ctx.isInPreviewRange
          ? 'preview'
          : ctx.isInRange
            ? 'in-range'
            : undefined;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{
                selected: isSelectedLike,
                disabled: ctx.isUnavailable,
            }}
            disabled={ctx.isUnavailable}
            onPress={onPress}
            {...(onHoverIn ? { onHoverIn } : {})}
            {...(onHoverOut ? { onHoverOut } : {})}
            style={[baseStyle, stateStyle, todayRingStyle]}
            {...(dataState ? { 'data-state': dataState } : {})}
        >
            {renderDay ? (
                renderDay(ctx)
            ) : (
                <RNText style={{ color: textColor, fontWeight: ctx.isToday ? '600' : '400' }}>{ctx.date.day}</RNText>
            )}
        </Pressable>
    );
};
