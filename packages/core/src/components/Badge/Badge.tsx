'use client';

import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type BadgeAppearance = 'solid' | 'outline' | 'soft';

export type BadgeProps = {
    /**
     * Semantic color of the badge.
     * @defaultValue 'neutral'
     */
    tone?: BadgeTone;
    /**
     * Visual treatment.
     *  - `soft` (default) — tinted background with darker tone-colored text. Modern, calm.
     *  - `solid` — filled tone background, white text. Loud, used sparingly.
     *  - `outline` — border in tone, transparent background, tone-colored text.
     * @defaultValue 'soft'
     */
    appearance?: BadgeAppearance;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// Layout-only base; theme-driven dimensions are merged inside the
// component so a custom theme reshapes the badge.
const BASE_CONTAINER_LAYOUT: ViewStyle = {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2, // component-density literal — not from theme (no 2px spacing token)
    borderWidth: 1,
    borderColor: 'transparent',
};

/**
 * Compact pill for status, counts, or labels. Use sparingly — every badge
 * draws the eye, so a row of five is no longer a row of badges.
 *
 * Tone palettes flip with the active color scheme — light mode uses the
 * familiar pastel scale (Tailwind 50/200/800), dark mode uses the deep
 * 950/700/100 scale so a soft success badge reads as a calm tinted chip
 * on either surface, never as a glaring pastel on a dark page.
 */
export function Badge({ tone = 'neutral', appearance = 'soft', children, className, testID }: BadgeProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const invertedText = colors.semantic.text.inverted;

    let palette: {
        soft: { bg: string; fg: string };
        solid: { bg: string; fg: string };
        outline: { border: string; fg: string };
    };
    if (tone === 'neutral') {
        palette = {
            soft: isDark
                ? { bg: colors.color.neutral['800'], fg: colors.color.neutral['100'] }
                : { bg: colors.color.neutral['100'], fg: colors.color.neutral['700'] },
            solid: {
                bg: isDark ? colors.color.neutral['200'] : colors.color.neutral['700'],
                fg: isDark ? colors.color.neutral['900'] : invertedText,
            },
            outline: {
                border: isDark ? colors.color.neutral['600'] : colors.color.neutral['300'],
                fg: isDark ? colors.color.neutral['100'] : colors.color.neutral['700'],
            },
        };
    } else if (tone === 'primary') {
        palette = {
            soft: isDark
                ? { bg: colors.color.primary['900'], fg: colors.color.primary['200'] }
                : { bg: colors.color.primary['100'], fg: colors.color.primary['800'] },
            solid: {
                bg: isDark ? colors.color.primary['400'] : colors.color.primary['600'],
                fg: isDark ? colors.color.primary['900'] : invertedText,
            },
            outline: {
                border: isDark ? colors.color.primary['400'] : colors.color.primary['300'],
                fg: isDark ? colors.color.primary['200'] : colors.color.primary['700'],
            },
        };
    } else if (tone === 'success') {
        palette = {
            soft: isDark ? { bg: '#14532d', fg: '#bbf7d0' } : { bg: '#dcfce7', fg: '#166534' },
            solid: { bg: colors.color.success, fg: invertedText },
            outline: { border: colors.color.success, fg: isDark ? '#bbf7d0' : '#166534' },
        };
    } else if (tone === 'warning') {
        palette = {
            soft: isDark ? { bg: '#78350f', fg: '#fde68a' } : { bg: '#fef3c7', fg: '#92400e' },
            solid: { bg: colors.color.warning, fg: invertedText },
            outline: { border: colors.color.warning, fg: isDark ? '#fde68a' : '#92400e' },
        };
    } else {
        palette = {
            soft: isDark ? { bg: '#7f1d1d', fg: '#fecaca' } : { bg: '#fee2e2', fg: '#991b1b' },
            solid: { bg: colors.color.danger, fg: invertedText },
            outline: { border: colors.color.danger, fg: isDark ? '#fecaca' : '#991b1b' },
        };
    }

    const baseContainer: ViewStyle = {
        ...BASE_CONTAINER_LAYOUT,
        gap: px(colors.spacing['1']),
        paddingHorizontal: px(colors.spacing['2']),
        borderRadius: px(colors.radius.full),
    };
    const containerStyle: ViewStyle = (() => {
        if (appearance === 'solid') {
            return { ...baseContainer, backgroundColor: palette.solid.bg };
        }
        if (appearance === 'outline') {
            return { ...baseContainer, backgroundColor: 'transparent', borderColor: palette.outline.border };
        }
        return { ...baseContainer, backgroundColor: palette.soft.bg };
    })();
    const textColor = (() => {
        if (appearance === 'solid') {
            return palette.solid.fg;
        }
        if (appearance === 'outline') {
            return palette.outline.fg;
        }
        return palette.soft.fg;
    })();
    const baseText: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.xs),
        fontWeight: colors.fontWeight.medium as '500',
        lineHeight: px(colors.fontSize.xs) * Number(colors.lineHeight.normal),
    };
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('inline-flex flex-row items-center gap-1 rounded-full px-2 py-0.5 border', className)}
            style={containerStyle}
        >
            <RNText style={{ ...baseText, color: textColor }}>{children}</RNText>
        </View>
    );
}
