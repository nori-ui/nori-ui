'use client';

import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Platform, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type KbdProps = {
    children?: ReactNode;
    className?: string;
};

/**
 * Inline keyboard key hint. Use inside prose or UI labels to indicate a
 * keyboard shortcut.
 *
 * ```tsx
 * <Text>Press <Kbd>⌘K</Kbd> to open the command palette.</Text>
 * ```
 *
 * On web it renders a semantic `<kbd>` element (via rn-web's `accessibilityRole`
 * mapping). On native it renders a styled `<Text>`. The visual treatment is
 * identical: small monospace text in a pill with a subtle border.
 */
export const Kbd = ({ children, className }: KbdProps) => {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';

    const bgColor = isDark ? colors.color.neutral['800'] : colors.color.neutral['100'];
    const borderColor = isDark ? colors.color.neutral['600'] : colors.color.neutral['300'];
    const textColor = isDark ? colors.color.neutral['200'] : colors.color.neutral['700'];

    const containerStyle: ViewStyle = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor,
        borderRadius: px(colors.radius.sm),
        paddingHorizontal: px(colors.spacing['1']),
        paddingVertical: 2,
        // Subtle bottom shadow gives the classic key look.
        ...(Platform.OS === 'web'
            ? ({
                  boxShadow: `0 1px 0 ${borderColor}`,
                  display: 'inline-flex',
              } as object)
            : {}),
    };

    const textStyle: TextStyle = {
        color: textColor,
        // Monospace font for key labels.
        fontFamily: colors.fontFamily.mono ?? 'monospace',
        fontSize: px(colors.fontSize.xs),
        fontWeight: colors.fontWeight.medium as '500',
        lineHeight: px(colors.fontSize.xs) * Number(colors.lineHeight.normal),
    };

    // On web, map to the semantic <kbd> element via accessibilityRole.
    // react-native-web renders role="term" as <dfn> and doesn't have a
    // dedicated kbd mapping, so we use a raw className + aria approach.
    // The 'none' role avoids a superfluous ARIA landmark while keeping
    // the native <kbd> tag in the DOM (set via `aria-label` / class).
    const extraWebProps =
        Platform.OS === 'web'
            ? ({
                  // rn-web: 'none' skips the role attribute so the outer
                  // View is just a plain <div>; we rely on the inner
                  // <span> with data-kbd for semantic annotation.
                  accessibilityRole: 'none' as const,
              } as object)
            : {};

    return (
        <View
            {...extraWebProps}
            className={cn(
                'inline-flex flex-row items-center rounded-sm border px-1 py-0.5',
                isDark
                    ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-700',
                className
            )}
            style={containerStyle}
        >
            {/* On web, data-kbd is used for CSS targeting / semantics.
                On native this attribute is silently ignored. */}
            <RNText
                {...(Platform.OS === 'web' ? ({ 'data-kbd': '' } as object) : {})}
                accessibilityRole="none"
                style={textStyle}
            >
                {children}
            </RNText>
        </View>
    );
};
