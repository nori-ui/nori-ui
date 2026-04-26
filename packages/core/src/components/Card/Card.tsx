'use client';

import type { ReactNode } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// Surface: elevated background on a neutral page, subtle 1px border, sm
// shadow, 12px radius. The shadow is intentionally restrained — Cards are
// content containers, not floating overlays. Overlays (Dialog, Toast) get
// the heavier shadow scale.
const SURFACE_BASE: ViewStyle = {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
};

const HEADER_STYLE: ViewStyle = {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'column',
    gap: 4,
};
const CONTENT_STYLE: ViewStyle = {
    paddingHorizontal: 24,
    paddingVertical: 16,
};
const FOOTER_BASE: ViewStyle = {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
};

export type CardProps = Omit<ViewProps, 'children'> & {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Container surface for grouping related content. Pair with `CardHeader`,
 * `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` for the
 * conventional layout, or use any children directly.
 */
export function Card({ children, className, style, ...rest }: CardProps) {
    const colors = useThemeColors();
    return (
        <View
            {...rest}
            className={cn(
                'rounded-xl border border-semantic-border-default bg-semantic-background-elevated',
                className
            )}
            style={[
                SURFACE_BASE,
                {
                    backgroundColor: colors.semantic.background.elevated,
                    borderColor: colors.semantic.border.default,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

export type CardSectionProps = Omit<ViewProps, 'children'> & {
    children?: ReactNode;
    className?: string;
};

/** Header section — sits flush with the card top with comfortable padding. */
export function CardHeader({ children, className, style, ...rest }: CardSectionProps) {
    return (
        <View {...rest} className={cn('flex-col gap-1 px-6 pt-5 pb-3', className)} style={[HEADER_STYLE, style]}>
            {children}
        </View>
    );
}

/** Body content — for arbitrary content between header and footer. */
export function CardContent({ children, className, style, ...rest }: CardSectionProps) {
    return (
        <View {...rest} className={cn('px-6 py-4', className)} style={[CONTENT_STYLE, style]}>
            {children}
        </View>
    );
}

/** Footer with a top border and a row of actions (typically Buttons). */
export function CardFooter({ children, className, style, ...rest }: CardSectionProps) {
    const colors = useThemeColors();
    return (
        <View
            {...rest}
            className={cn(
                'flex-row items-center gap-2 px-6 pt-3 pb-5 border-t border-semantic-border-default',
                className
            )}
            style={[FOOTER_BASE, { borderTopColor: colors.semantic.border.default }, style]}
        >
            {children}
        </View>
    );
}

export type CardTextProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/** Card title — heading-weight text. Renders as a heading on web. */
export function CardTitle({ children, className, testID }: CardTextProps) {
    const colors = useThemeColors();
    return (
        <RNText
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="header"
            role="heading"
            aria-level={3}
            className={cn('text-lg font-semibold text-semantic-text-default', className)}
            style={{ color: colors.semantic.text.default, fontSize: 18, fontWeight: '600' }}
        >
            {children}
        </RNText>
    );
}

/** Muted subtitle that pairs with CardTitle. */
export function CardDescription({ children, className, testID }: CardTextProps) {
    const colors = useThemeColors();
    return (
        <RNText
            {...(testID !== undefined ? { testID } : {})}
            className={cn('text-sm text-semantic-text-muted', className)}
            style={{ color: colors.semantic.text.muted, fontSize: 14 }}
        >
            {children}
        </RNText>
    );
}
