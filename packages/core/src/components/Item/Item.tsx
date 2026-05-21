'use client';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type ItemProps = {
    /** Leading slot — typically an Icon, Avatar, or image. */
    leading?: ReactNode;
    /** Primary label. Accepts a string or any ReactNode. */
    title: ReactNode;
    /** Secondary label rendered below the title. */
    description?: ReactNode;
    /** Trailing slot — value text, badge, icon, etc. */
    trailing?: ReactNode;
    /** Show a chevron-right arrow at the far end. Useful for navigation rows. */
    chevron?: boolean;
    /** Makes the row tappable. */
    onPress?: () => void;
    disabled?: boolean;
    className?: string;
    testID?: string;
};

/**
 * A generic list row primitive. Composes four horizontal zones:
 * `leading | title + description (stacked) | trailing | chevron`.
 *
 * All zones except `title` are optional. The row becomes tappable
 * when `onPress` is provided.
 *
 * ```tsx
 * <Item
 *   leading={<Avatar src={user.avatar} />}
 *   title={user.name}
 *   description={user.email}
 *   chevron
 *   onPress={() => navigate(`/users/${user.id}`)}
 * />
 * ```
 */
export const Item = ({
    leading,
    title,
    description,
    trailing,
    chevron = false,
    onPress,
    disabled = false,
    className,
    testID,
}: ItemProps) => {
    const colors = useThemeColors();
    const isTappable = onPress !== undefined;

    const rowStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['3']),
        paddingHorizontal: px(colors.spacing['4']),
        minHeight: 52,
        opacity: disabled ? 0.5 : 1,
    };

    const content = (
        <>
            {leading != null ? <View style={{ flexShrink: 0 }}>{leading}</View> : null}

            <View style={{ flex: 1, flexDirection: 'column', gap: 2 }}>
                {typeof title === 'string' ? (
                    <RNText
                        style={{
                            color: colors.semantic.text.default,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                            fontWeight: colors.fontWeight.medium as '500',
                        }}
                        numberOfLines={1}
                    >
                        {title}
                    </RNText>
                ) : (
                    title
                )}

                {description != null ? (
                    typeof description === 'string' ? (
                        <RNText
                            style={{
                                color: colors.semantic.text.muted,
                                fontFamily: colors.fontFamily.body,
                                fontSize: px(colors.fontSize.xs),
                            }}
                            numberOfLines={1}
                        >
                            {description}
                        </RNText>
                    ) : (
                        description
                    )
                ) : null}
            </View>

            {trailing != null ? <View style={{ flexShrink: 0 }}>{trailing}</View> : null}

            {chevron ? (
                <View
                    style={{ flexShrink: 0 }}
                    aria-hidden={true}
                    testID={testID != null ? `${testID}-chevron` : undefined}
                >
                    {/* chevronRight: rotate chevronDown 90° CCW */}
                    <RNText
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={{
                            fontSize: 14,
                            lineHeight: 16,
                            color: colors.semantic.text.muted,
                            // On web rn-web passes style through — transform
                            // with a rotate is the lightest-weight approach
                            // that avoids importing the full SVG icon set.
                            transform: [{ rotate: '-90deg' }],
                        }}
                    >
                        ⌄
                    </RNText>
                </View>
            ) : null}
        </>
    );

    if (isTappable) {
        return (
            <Pressable
                {...(testID !== undefined ? { testID } : {})}
                role="button"
                accessibilityRole="button"
                disabled={disabled}
                onPress={disabled ? undefined : onPress}
                className={cn(
                    'flex-row items-center',
                    disabled ? 'opacity-50' : 'hover:bg-semantic-background-subtle active:bg-semantic-border-default',
                    className
                )}
                style={rowStyle}
            >
                {content}
            </Pressable>
        );
    }

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('flex-row items-center', className)}
            style={rowStyle}
        >
            {content}
        </View>
    );
};
