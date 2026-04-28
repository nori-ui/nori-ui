'use client';

/**
 * Reanimated adapter — re-exports the subset of `react-native-reanimated`
 * the lib uses internally.
 *
 * Reanimated is a REQUIRED peer dep and the import here is **static**,
 * so the consumer's babel `react-native-worklets/plugin` can follow the
 * import binding statically and mark our `useAnimatedStyle(() => …)`
 * callbacks as worklets. That tracking only works on static `import`
 * bindings; a dynamic `require()` breaks the chain — the worklets
 * transform fails silently and reanimated 4 crashes at runtime with
 * "Cannot add new property '_tracking'" or "set the key 'current' …
 * immutable and has been frozen".
 *
 * Consumers MUST:
 *   1. install `react-native-reanimated` (>= 4.3) + `react-native-worklets`
 *   2. add `'react-native-worklets/plugin'` to `babel.config.js`
 *   3. add a babel `overrides` block that applies the same plugin to
 *      `node_modules/@nori-ui/core/dist/**`, so the marker attaches to
 *      our pre-bundled `useAnimatedStyle` callbacks too
 *
 * See `getting-started` docs for the exact snippet. Without these, the
 * lib's animated primitives crash on first render.
 */
import * as Reanimated from 'react-native-reanimated';

let cached: typeof Reanimated = Reanimated;

/**
 * Returns the bundled `react-native-reanimated` module. Test code can
 * substitute a stub via `__setReanimatedForTest` so jest doesn't load
 * the real reanimated runtime (which has its own native-side setup).
 */
export function getReanimated(): typeof Reanimated {
    return cached;
}

/**
 * Test seam — lets the adapter return a stub instead of the real
 * reanimated module. Pass the original `Reanimated` namespace (or
 * `undefined` to reset) to restore.
 */
export function __setReanimatedForTest(value: typeof Reanimated | undefined): void {
    cached = value ?? Reanimated;
}
