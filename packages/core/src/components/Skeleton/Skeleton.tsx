'use client';

import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type SkeletonProps = {
    /** Width — number of px or any RN dimension string. Default `100%`. */
    width?: number | `${number}%` | 'auto';
    /** Height — number of px. Default 16. */
    height?: number;
    /**
     * Border radius. Defaults to `theme.radius.md` (6px). Use `'full'`
     * (= 9999px) for circular skeletons (avatars).
     */
    radius?: number | 'full';
    /** Disable the pulse — useful when stacking many skeletons in a list. */
    static?: boolean;
    className?: string;
    style?: ViewStyle;
    testID?: string;
};

const PULSE_DURATION_MS = 900;
const PULSE_MIN = 0.55;
const PULSE_MAX = 1;

/**
 * Subtle loading placeholder. Pulses between full and 55% opacity to signal
 * "content is loading here, in this shape" without flashing or distracting.
 *
 * Uses RN `Animated` for the opacity loop — works on web and native with
 * the same code. Respects the `static` prop when you want to skip the
 * animation (e.g. when stacking many skeletons in a long list).
 */
export function Skeleton({
    width = '100%' as const,
    height = 16,
    radius = 6,
    static: isStatic = false,
    className,
    style,
    testID,
}: SkeletonProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const opacity = useRef(new Animated.Value(PULSE_MAX)).current;

    useEffect(() => {
        if (isStatic) {
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: PULSE_MIN,
                    duration: PULSE_DURATION_MS,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: PULSE_MAX,
                    duration: PULSE_DURATION_MS,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => {
            loop.stop();
        };
    }, [isStatic, opacity]);

    // Skeleton intentionally uses a stronger neutral than the generic
    // semantic.background.subtle. The previous subtle-bg skeleton washed
    // out against the warm-paper page background — barely a hint of a
    // placeholder. A loading state must read as "something will appear
    // here", not "page barely loading."
    //
    // On dark we step the other direction (neutral.700 ≈ #3f3f46) so the
    // skeleton is clearly lighter than the page bg (#18181b) without being
    // a glaring grey block.
    const baseStyle: ViewStyle = {
        width,
        height,
        borderRadius: radius === 'full' ? 9999 : radius,
        backgroundColor: isDark ? colors.color.neutral['700'] : colors.color.neutral['200'],
    };

    return (
        <Animated.View
            {...(testID !== undefined ? { testID } : {})}
            aria-hidden={true}
            accessibilityElementsHidden
            importantForAccessibility="no"
            className={cn('bg-neutral-200 dark:bg-neutral-700', className)}
            style={[baseStyle, isStatic ? null : { opacity }, style]}
        />
    );
}
