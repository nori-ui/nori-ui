'use client';

// Web-only build of `useAnimatedNumber`. Webpack / Next.js / Vite
// pick this file (over the default `.ts`) because of the `.web.ts`
// extension — the same convention `react-native-web` uses.
//
// Crucially, this file does NOT import `react-native-reanimated`.
// Reanimated 4 pulls in RN-internal native paths at module load time
// (e.g. `react-native/Libraries/Renderer/shims/ReactFabric`) that web
// bundlers can't resolve. Keeping reanimated out of the web bundle
// avoids that whole class of resolution failure and shaves a few
// hundred KB off the docs-site JS.
//
// Web animation is pure CSS transition — same easing curve and
// duration the native side targets via `Easing.bezier(0.16, 1, 0.3, 1)`
// + `withTiming(180)` so primitives feel identical across platforms.

export type AnimatedProperty = 'left' | 'top' | 'right' | 'bottom' | 'translateX' | 'translateY' | 'opacity' | 'height';

export type AnimatedNumberOptions = {
    /** Animation duration in ms. @defaultValue 180 */
    duration?: number;
};

export function useAnimatedNumber(
    property: AnimatedProperty,
    target: number,
    options: AnimatedNumberOptions = {}
): object {
    const { duration = 180 } = options;
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
