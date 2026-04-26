import { theme } from '@nori-ui/tokens';
import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
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

// Token-derived palette per tone. Soft = light shade of the tone for the
// background, dark shade for the text. Solid = saturated bg + white text.
// Outline = transparent bg + saturated border + tone text.
const TONE_PALETTE: Record<
    BadgeTone,
    { soft: { bg: string; fg: string }; solid: { bg: string; fg: string }; outline: { border: string; fg: string } }
> = {
    neutral: {
        soft: { bg: theme.color.neutral['100'], fg: theme.color.neutral['700'] },
        solid: { bg: theme.color.neutral['700'], fg: '#ffffff' },
        outline: { border: theme.color.neutral['300'], fg: theme.color.neutral['700'] },
    },
    primary: {
        soft: { bg: theme.color.primary['100'], fg: theme.color.primary['800'] },
        solid: { bg: theme.color.primary['600'], fg: '#ffffff' },
        outline: { border: theme.color.primary['300'], fg: theme.color.primary['700'] },
    },
    success: {
        soft: { bg: '#dcfce7', fg: '#166534' },
        solid: { bg: theme.color.success, fg: '#ffffff' },
        outline: { border: theme.color.success, fg: '#166534' },
    },
    warning: {
        soft: { bg: '#fef3c7', fg: '#92400e' },
        solid: { bg: theme.color.warning, fg: '#ffffff' },
        outline: { border: theme.color.warning, fg: '#92400e' },
    },
    danger: {
        soft: { bg: '#fee2e2', fg: '#991b1b' },
        solid: { bg: theme.color.danger, fg: '#ffffff' },
        outline: { border: theme.color.danger, fg: '#991b1b' },
    },
};

const BASE_CONTAINER: ViewStyle = {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'transparent',
};

const BASE_TEXT: TextStyle = {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
};

/**
 * Compact pill for status, counts, or labels. Use sparingly — every badge
 * draws the eye, so a row of five is no longer a row of badges.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Badge({ tone = 'neutral', appearance = 'soft', children, className, testID }: BadgeProps) {
    const palette = TONE_PALETTE[tone];
    const containerStyle: ViewStyle = (() => {
        if (appearance === 'solid') {
            return { ...BASE_CONTAINER, backgroundColor: palette.solid.bg };
        }
        if (appearance === 'outline') {
            return { ...BASE_CONTAINER, backgroundColor: 'transparent', borderColor: palette.outline.border };
        }
        return { ...BASE_CONTAINER, backgroundColor: palette.soft.bg };
    })();
    const textColor = (() => {
        if (appearance === 'solid') return palette.solid.fg;
        if (appearance === 'outline') return palette.outline.fg;
        return palette.soft.fg;
    })();
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('inline-flex flex-row items-center gap-1 rounded-full px-2 py-0.5 border', className)}
            style={containerStyle}
        >
            <RNText style={{ ...BASE_TEXT, color: textColor }}>{children}</RNText>
        </View>
    );
}
