'use client';

// Native build (Metro picks this `.ts` over the `.web.ts` sibling
// when present — for monorepo workspaces and any consumer that pre-
// orders `.native.ts` / `.ts` / `.web.ts` resolution properly). Web
// consumers (Next.js etc.) that don't honor the extension split
// should alias `react-native-reanimated` to a noop in their bundler
// config — the IS_WEB early-return below means we never call
// reanimated APIs on web, so a stub satisfies the import.

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type AnimatedProperty = 'left' | 'top' | 'right' | 'bottom' | 'translateX' | 'translateY' | 'opacity' | 'height';

export type AnimatedNumberOptions = {
    /** Animation duration in ms. @defaultValue 180 */
    duration?: number;
};

const IS_WEB = Platform.OS === 'web';

export function useAnimatedNumber(
    property: AnimatedProperty,
    target: number,
    options: AnimatedNumberOptions = {}
): object {
    const { duration = 180 } = options;
    if (IS_WEB) {
        return webStyle(property, target, duration);
    }
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

// `opacity` and `height` aren't transforms or position props but follow
// the exact same animated-shared-value pattern. Adding them here keeps
// the cross-platform API consistent — Accordion content fades + slides
// open with the same easing as a Switch thumb.

// Reanimated worklets can't reliably serialize closures over computed
// keys (`{ [property]: value }`). Static-key paths per property work
// fine. Six tiny worklets — one per AnimatedProperty — give the plugin
// the static AST it expects without losing the cross-platform API.
// The bezier curve mirrors the web CSS transition exactly so a Switch
// thumb feels identical on both platforms.
function useReanimatedTiming(property: AnimatedProperty, target: number, duration: number): object {
    const easing = Easing.bezier(0.16, 1, 0.3, 1);
    // biome-ignore lint/correctness/useHookAtTopLevel: dispatcher branch is module-init constant; this function only runs when IS_WEB is false
    const shared = useSharedValue(target);
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    useEffect(() => {
        shared.value = withTiming(target, { duration, easing });
    }, [target, shared, duration, easing]);
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
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const opacityStyle = useAnimatedStyle(() => ({ opacity: shared.value }));
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    const heightStyle = useAnimatedStyle(() => ({ height: shared.value }));
    if (property === 'translateX') {
        return translateXStyle;
    }
    if (property === 'translateY') {
        return translateYStyle;
    }
    if (property === 'left') {
        return leftStyle;
    }
    if (property === 'top') {
        return topStyle;
    }
    if (property === 'right') {
        return rightStyle;
    }
    if (property === 'bottom') {
        return bottomStyle;
    }
    if (property === 'opacity') {
        return opacityStyle;
    }
    return heightStyle;
}
