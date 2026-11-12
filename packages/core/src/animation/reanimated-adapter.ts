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
 * Consumers MUST, on native:
 *   1. install `react-native-reanimated` (>= 4.3) and
 *      `react-native-worklets` (>= 0.8)
 *   2. have `react-native-worklets/plugin` in the Babel config Metro uses.
 *      In an Expo app this needs no manual step: `babel-preset-expo` adds
 *      the plugin when `react-native-worklets` is installed, and
 *      `nativewind/babel` includes it too. A bare React Native app adds
 *      the plugin to `babel.config.js` itself.
 *
 * No Babel `overrides` block for `node_modules/@nori-ui/core` is needed.
 * Metro resolves this package through the `react-native` export condition
 * to `src/`, and it applies the project Babel config to every file it
 * bundles, `node_modules` included, so the worklet transform reaches the
 * `useAnimatedStyle` callbacks here.
 *
 * On web (Next.js + webpack) the consumer aliases `react-native-reanimated`
 * to a stub; the library never calls a reanimated API there.
 *
 * See the `getting-started` docs for the full setup. Without the plugin,
 * the lib's animated primitives crash on first render.
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
