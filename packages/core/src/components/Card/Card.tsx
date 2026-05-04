'use client';

import type { ReactNode } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// Layout-only bases; theme-driven dimensions are merged inside each
// component below so a custom theme reshapes the card.
const SURFACE_LAYOUT_BASE: ViewStyle = {
    borderWidth: 1,
    overflow: 'hidden',
};

const HEADER_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'column',
};
const CONTENT_LAYOUT_BASE: ViewStyle = {};
const FOOTER_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
};

export type CardProps = Omit<ViewProps, 'children'> & {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Container surface for grouping related content. Pair with `Card.Header`,
 * `Card.Title`, `Card.Description`, `Card.Content`, and `Card.Footer` for
 * the conventional layout, or use any children directly.
 */
const CardRoot = ({ children, className, style, ...rest }: CardProps) => {
    const colors = useThemeColors();
    return (
        <View
            {...rest}
            className={cn(
                'rounded-xl border border-semantic-border-default bg-semantic-background-elevated',
                className
            )}
            style={[
                SURFACE_LAYOUT_BASE,
                {
                    borderRadius: px(colors.radius.xl),
                    backgroundColor: colors.semantic.background.elevated,
                    borderColor: colors.semantic.border.default,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};

export type CardSectionProps = Omit<ViewProps, 'children'> & {
    children?: ReactNode;
    className?: string;
};

/** Header section — sits flush with the card top with comfortable padding. */
const CardHeader = ({ children, className, style, ...rest }: CardSectionProps) => {
    const colors = useThemeColors();
    const headerStyle: ViewStyle = {
        ...HEADER_LAYOUT_BASE,
        paddingHorizontal: px(colors.spacing['6']),
        paddingTop: px(colors.spacing['5']),
        paddingBottom: px(colors.spacing['3']),
        gap: px(colors.spacing['1']),
    };
    return (
        <View {...rest} className={cn('flex-col gap-1 px-6 pt-5 pb-3', className)} style={[headerStyle, style]}>
            {children}
        </View>
    );
};

/** Body content — for arbitrary content between header and footer. */
const CardContent = ({ children, className, style, ...rest }: CardSectionProps) => {
    const colors = useThemeColors();
    const contentStyle: ViewStyle = {
        ...CONTENT_LAYOUT_BASE,
        paddingHorizontal: px(colors.spacing['6']),
        paddingVertical: px(colors.spacing['4']),
    };
    // Auto-wrap raw string children in <Text>. RN refuses to render a
    // bare string inside a View in dev, and on rn-web it silently slips
    // through using whatever ambient color the surface has — which is
    // wrong in dark mode. Wrapping here matches the pattern other Card
    // subcomponents already follow.
    const wrapped =
        typeof children === 'string' ? (
            <RNText
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.md),
                    lineHeight: px(colors.fontSize.md) * Number(colors.lineHeight.normal),
                }}
            >
                {children}
            </RNText>
        ) : (
            children
        );
    return (
        <View {...rest} className={cn('px-6 py-4', className)} style={[contentStyle, style]}>
            {wrapped}
        </View>
    );
};

/** Footer with a top border and a row of actions (typically Buttons). */
const CardFooter = ({ children, className, style, ...rest }: CardSectionProps) => {
    const colors = useThemeColors();
    const footerStyle: ViewStyle = {
        ...FOOTER_LAYOUT_BASE,
        paddingHorizontal: px(colors.spacing['6']),
        paddingTop: px(colors.spacing['3']),
        paddingBottom: px(colors.spacing['5']),
        gap: px(colors.spacing['2']),
    };
    return (
        <View
            {...rest}
            className={cn(
                'flex-row items-center gap-2 px-6 pt-3 pb-5 border-t border-semantic-border-default',
                className
            )}
            style={[footerStyle, { borderTopColor: colors.semantic.border.default }, style]}
        >
            {children}
        </View>
    );
};

export type CardTextProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/** Card title — heading-weight text. Renders as a heading on web. */
const CardTitle = ({ children, className, testID }: CardTextProps) => {
    const colors = useThemeColors();
    return (
        <RNText
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="header"
            role="heading"
            aria-level={3}
            className={cn('text-lg font-semibold text-semantic-text-default', className)}
            style={{
                color: colors.semantic.text.default,
                fontFamily: colors.fontFamily.display,
                fontSize: px(colors.fontSize.lg),
                fontWeight: colors.fontWeight.semibold as '600',
            }}
        >
            {children}
        </RNText>
    );
};

/** Muted subtitle that pairs with Card.Title. */
const CardDescription = ({ children, className, testID }: CardTextProps) => {
    const colors = useThemeColors();
    return (
        <RNText
            {...(testID !== undefined ? { testID } : {})}
            className={cn('text-sm text-semantic-text-muted', className)}
            style={{
                color: colors.semantic.text.muted,
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
            }}
        >
            {children}
        </RNText>
    );
};

/**
 * Public `Card` value — the root function plus its `.Header`, `.Title`,
 * `.Description`, `.Content`, and `.Footer` static members. `Object.assign`
 * produces a value whose inferred type carries the static properties, so
 * `.d.ts` consumers can write `<Card.Header>` without a separate import.
 */
export const Card = Object.assign(CardRoot, {
    Header: CardHeader,
    Title: CardTitle,
    Description: CardDescription,
    Content: CardContent,
    Footer: CardFooter,
});
