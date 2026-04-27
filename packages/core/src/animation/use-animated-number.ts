'use client';

import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { getReanimated } from './reanimated-adapter';

export type AnimatedProperty = 'left' | 'top' | 'right' | 'bottom' | 'translateX' | 'translateY';

export type AnimatedNumberOptions = {
    /** Spring stiffness (reanimated path). Ignored by the RN-Animated fallback. @defaultValue 200 */
    stiffness?: number;
    /** Spring damping (reanimated path). @defaultValue 22 */
    damping?: number;
    /** Duration in ms for the RN-Animated fallback AND web CSS transition. @defaultValue 180 */
    duration?: number;
};

// Locked at module init — the engine choice never changes for the lifetime
// of the app, so the hook call order in `useAnimatedNumber` is stable for
// every render of every consuming component.
const IS_WEB = Platform.OS === 'web';
const REANIMATED = IS_WEB ? null : getReanimated();

/**
 * Cross-platform hook that animates a single numeric value (in px) against
 * a fixed style property. Returns a style fragment ready to spread.
 *
 * - Web: returns `{ [property]: target }` plus CSS `transition*`.
 * - Native + reanimated installed: spring on the UI thread.
 * - Native + reanimated NOT installed: smooth `Animated.timing` ease.
 *
 * The component never imports reanimated directly — it's an OPTIONAL peer
 * dep, detected once at module load (see `reanimated-adapter.ts`). The
 * spring path is only taken when the module is actually present.
 *
 * `property` MUST be stable across renders for a given hook instance.
 */
export function useAnimatedNumber(
    property: AnimatedProperty,
    target: number,
    options: AnimatedNumberOptions = {}
): object {
    const { stiffness = 200, damping = 22, duration = 180 } = options;
    if (IS_WEB) {
        // Web path uses no hooks — pure CSS transition style fragment.
        return webStyle(property, target, duration);
    }
    if (REANIMATED) {
        // biome-ignore lint/correctness/useHookAtTopLevel: branch is module-init constant; same path every render
        return useReanimatedSpring(property, target, stiffness, damping);
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: branch is module-init constant; same path every render
    return useRNAnimatedTiming(property, target, duration);
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

// `REANIMATED` is locked at module init so this function is only EVER
// called when reanimated is loaded — its hooks fire on every render. The
// rules-of-hooks lint can't see that constancy (it sees a conditional
// in the dispatcher above and flags the indirect call), so we suppress
// per call site here.
function useReanimatedSpring(property: AnimatedProperty, target: number, stiffness: number, damping: number): object {
    // Non-null asserted: the dispatcher only routes here when REANIMATED
    // resolved at module init. Keeping the assertion local rather than
    // throwing keeps the hook order unconditional below.
    const Reanimated = REANIMATED as NonNullable<typeof REANIMATED>;
    const shared = Reanimated.useSharedValue(target);
    useEffect(() => {
        shared.value = Reanimated.withSpring(target, { stiffness, damping });
    }, [target, shared, stiffness, damping]);
    // Single `useAnimatedStyle` call — branch on the property INSIDE the
    // worklet so the hook count stays at exactly one. The worklet sees
    // `property` as a closed-over constant; reanimated handles the lookup.
    return Reanimated.useAnimatedStyle(() => {
        if (property === 'translateX' || property === 'translateY') {
            return { transform: [{ [property]: shared.value }] as never };
        }
        return { [property]: shared.value };
    });
}

// Same story: only called when reanimated is NOT loaded; the choice is
// locked at module init, so hook count is stable per app lifetime.
function useRNAnimatedTiming(property: AnimatedProperty, target: number, duration: number): object {
    // biome-ignore lint/correctness/useHookAtTopLevel: dispatcher branch is module-init constant; see file header
    const value = useRef(new Animated.Value(target)).current;
    // biome-ignore lint/correctness/useHookAtTopLevel: same
    useEffect(() => {
        Animated.timing(value, { toValue: target, duration, useNativeDriver: false }).start();
    }, [target, value, duration]);
    if (property === 'translateX' || property === 'translateY') {
        return { transform: [{ [property]: value }] };
    }
    return { [property]: value };
}
