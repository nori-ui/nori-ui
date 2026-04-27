'use client';

/**
 * Optional reanimated adapter.
 *
 * `react-native-reanimated` is listed as an OPTIONAL peer dependency. When a
 * consumer installs it (and runs the babel plugin so `worklet`s compile),
 * components in this library will reach for spring-driven animations on
 * native; otherwise they fall back to react-native's built-in `Animated`
 * (smooth) or to a snap (instant) — never to crashing.
 *
 * Detection happens once at module init via a try/catch around require().
 * Metro tolerates this pattern (try/catch'd require is the recipe used by
 * Tamagui, Restyle, Skia for the same situation). When the module is not
 * installed Metro will print one "Unable to resolve" warning during bundle
 * — that's the only consumer-visible cost; either silence it via a Metro
 * resolver or live with it.
 *
 * Web doesn't go through this adapter — components use CSS transitions
 * directly there, which work without any extra dep.
 */

// Type-only import — has no runtime cost and the types are reachable even
// when reanimated isn't installed because TypeScript resolves `import type`
// purely structurally.
import type * as Reanimated from 'react-native-reanimated';

type ReanimatedModule = typeof Reanimated;

let cached: ReanimatedModule | null | undefined;

function tryLoad(): ReanimatedModule | null {
    if (cached !== undefined) return cached;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        const mod = require('react-native-reanimated') as ReanimatedModule;
        // Some Expo Go / web bundles ship a partial export — sanity-check
        // that the surface we actually need is callable. If it isn't, treat
        // it as "not available" so callers fall back gracefully.
        if (typeof mod.useSharedValue !== 'function' || typeof mod.withSpring !== 'function') {
            cached = null;
            return null;
        }
        cached = mod;
        return mod;
    } catch {
        cached = null;
        return null;
    }
}

/**
 * Returns the loaded `react-native-reanimated` module, or `null` when the
 * consumer hasn't installed it. Cached after first call.
 *
 * Use this when you want spring physics on native and you're prepared to
 * fall back. For most components, prefer the higher-level hooks below.
 */
export function getReanimated(): ReanimatedModule | null {
    return tryLoad();
}

/** True iff `react-native-reanimated` resolves AND exposes its core API. */
export const isReanimatedAvailable = (): boolean => getReanimated() !== null;

/**
 * Test seam — lets the adapter's behavior be forced for unit tests of the
 * components that consume it. Pass `null` to simulate "not installed",
 * pass a stub module to simulate "installed". Pass `undefined` to clear
 * and re-detect on next access.
 */
export function __setReanimatedForTest(value: ReanimatedModule | null | undefined): void {
    cached = value;
}
