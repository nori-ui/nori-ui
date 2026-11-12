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
    testID?: string;
};

/**
 * Inline keyboard key hint. Use inside prose or UI labels to indicate a
 * keyboard shortcut.
 *
 * ```tsx
 * <Text>Press <Kbd>⌘K</Kbd> to open the command palette.</Text>
 * ```
 *
 * On web it renders a semantic `<kbd>` element; on native, where no such
 * element exists, a styled `<Text>`. The visual treatment is identical: small
 * monospace text in a pill with a subtle border.
 */
export const Kbd = ({ children, className, testID }: KbdProps) => {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';

    const bgColor = isDark ? colors.color.neutral['800'] : colors.color.neutral['100'];
    const borderColor = isDark ? colors.color.neutral['600'] : colors.color.neutral['300'];
    const textColor = isDark ? colors.color.neutral['200'] : colors.color.neutral['700'];

    const classes = cn(
        'inline-flex flex-row items-center rounded-sm border px-1 py-0.5',
        isDark
            ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
            : 'bg-neutral-100 border-neutral-300 text-neutral-700',
        className
    );
    const fontSize = px(colors.fontSize.xs);
    const lineHeight = fontSize * Number(colors.lineHeight.normal);
    const fontFamily = colors.fontFamily.mono ?? 'monospace';

    // react-native-web has no role that maps to <kbd>, so the element is
    // rendered directly. The platform check keeps the DOM tag off native.
    if (Platform.OS === 'web') {
        return (
            <kbd
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                className={classes}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: px(colors.radius.sm),
                    padding: `2px ${px(colors.spacing['1'])}px`,
                    // Subtle bottom shadow gives the classic key look.
                    boxShadow: `0 1px 0 ${borderColor}`,
                    color: textColor,
                    fontFamily,
                    fontSize,
                    fontWeight: colors.fontWeight.medium,
                    lineHeight: `${lineHeight}px`,
                }}
            >
                {children}
            </kbd>
        );
    }

    const containerStyle: ViewStyle = {
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
    };

    const textStyle: TextStyle = {
        color: textColor,
        fontFamily,
        fontSize,
        fontWeight: colors.fontWeight.medium as '500',
        lineHeight,
    };

    return (
        <View {...(testID !== undefined ? { testID } : {})} className={classes} style={containerStyle}>
            <RNText style={textStyle}>{children}</RNText>
        </View>
    );
};
