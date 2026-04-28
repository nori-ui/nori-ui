'use client';

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type AnimatedProperty = 'left' | 'top' | 'right' | 'bottom' | 'translateX' | 'translateY';

export type AnimatedNumberOptions = {
    /**
     * Animation duration in ms. Drives both the web CSS transition and
     * the native reanimated timing function. @defaultValue 180
     */
    duration?: number;
};

const IS_WEB = Platform.OS === 'web';

export function useAnimatedNumber(
    property: AnimatedProperty,
    target: number,
    options: AnimatedNumberOptions = {}
): object {
    const { duration = 180 } = options;
    if (IS_WEB) return webStyle(property, target, duration);
    // biome-ignore lint/correctness/useHookAtTopLevel: IS_WEB is module-init constant; same path every render
    return useReanimatedTiming(property, target, duration);
}

function webStyle(property: AnimatedProperty, target: number, duration: number): object {
    if (property === 'translateX' || property === 'translateY') {
        return {
            transform: [{ [property]: target }],
            transitionProperty: 'transform',
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        };
    }
    return {
        [property]: target,
        transitionProperty: property,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    };
}

// `cubic-bezier(0.16, 1, 0.3, 1)` — a snappy ease-out curve that
// matches the web CSS transition timing exactly. Lets a Switch thumb
// (or any animated number) feel the same on both platforms.
const SNAPPY_EASING = Easing.bezier(0.16, 1, 0.3, 1);

// Reanimated worklets can't reliably serialize closures over computed
// keys (`{ [property]: value }`). Static-key paths per property work
// fine. Six tiny worklets — one per AnimatedProperty — give the plugin
// the static AST it expects without losing the cross-platform API.
function useReanimatedTiming(property: AnimatedProperty, target: number, duration: number): object {
    // biome-ignore lint/correctness/useHookAtTopLevel: branch is module-init constant
    const shared = useSharedValue(target);
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    useEffect(() => {
        shared.value = withTiming(target, { duration, easing: SNAPPY_EASING });
    }, [target, shared, duration]);
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const translateXStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shared.value }],
    }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const translateYStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: shared.value }],
    }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const leftStyle = useAnimatedStyle(() => ({ left: shared.value }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const topStyle = useAnimatedStyle(() => ({ top: shared.value }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const rightStyle = useAnimatedStyle(() => ({ right: shared.value }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const bottomStyle = useAnimatedStyle(() => ({ bottom: shared.value }));
    if (property === 'translateX') return translateXStyle;
    if (property === 'translateY') return translateYStyle;
    if (property === 'left') return leftStyle;
    if (property === 'top') return topStyle;
    if (property === 'right') return rightStyle;
    return bottomStyle;
}
