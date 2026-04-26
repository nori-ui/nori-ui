'use client';

import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';
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
    const opacity = useRef(new Animated.Value(PULSE_MAX)).current;

    useEffect(() => {
        if (isStatic) return;
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

    const baseStyle: ViewStyle = {
        width,
        height,
        borderRadius: radius === 'full' ? 9999 : radius,
        backgroundColor: colors.semantic.background.subtle,
    };

    return (
        <Animated.View
            {...(testID !== undefined ? { testID } : {})}
            aria-hidden={true}
            accessibilityElementsHidden
            importantForAccessibility="no"
            className={cn('bg-neutral-200 dark:bg-neutral-800', className)}
            style={[baseStyle, isStatic ? null : { opacity }, style]}
        />
    );
}
