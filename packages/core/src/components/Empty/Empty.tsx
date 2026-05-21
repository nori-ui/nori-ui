'use client';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type EmptyProps = {
    /** Optional icon or illustration rendered above the title. */
    icon?: ReactNode;
    /** Required heading text. */
    title: string;
    /** Optional secondary description below the title. */
    description?: string;
    /** Optional action slot — typically a `<Button>`. */
    action?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Empty-state container for zero-results views, onboarding prompts, and error
 * placeholders. Renders a centered column: optional icon → title → optional
 * description → optional action.
 *
 * ```tsx
 * <Empty
 *   icon={<MyIcon size={48} />}
 *   title="No results found"
 *   description="Try adjusting your search or filters."
 *   action={<Button onPress={onReset}>Clear filters</Button>}
 * />
 * ```
 */
export const Empty = ({ icon, title, description, action, className, testID }: EmptyProps) => {
    const colors = useThemeColors();

    const containerStyle: ViewStyle = {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['8']),
        paddingHorizontal: px(colors.spacing['4']),
    };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('flex-col items-center justify-center gap-3 py-8 px-4', className)}
            style={containerStyle}
        >
            {icon != null ? <View style={{ marginBottom: px(colors.spacing['1']) }}>{icon}</View> : null}

            <RNText
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.md),
                    fontWeight: colors.fontWeight.semibold as '600',
                    textAlign: 'center',
                }}
            >
                {title}
            </RNText>

            {description != null ? (
                <RNText
                    style={{
                        color: colors.semantic.text.muted,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                        textAlign: 'center',
                    }}
                >
                    {description}
                </RNText>
            ) : null}

            {action != null ? <View style={{ marginTop: px(colors.spacing['1']) }}>{action}</View> : null}
        </View>
    );
};
