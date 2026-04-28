const path = require('node:path');

// Reanimated 4's worklet markers must be attached to every file that
// calls `useAnimatedStyle` / `useSharedValue` / `withSpring` — the babel
// plugin can't run on a file it never sees, and babel skips node_modules
// by default. So we explicitly opt three locations in:
//   1. The playground's own source (the top-level `plugins`).
//   2. `@nori-ui/core/dist` — our lib's pre-bundled animation code.
//   3. `react-native-css-interop` — its `cssInterop()` wrapper builds
//      an `useAnimatedStyle` call internally to interpolate className →
//      style on every RN primitive. Without the marker, reanimated 4
//      crashes at first render with "set the key 'current' with the
//      value 'undefined' on an object that is meant to be immutable".
//
// Without all three matches, runtime fails before any nori-ui component
// can render.

const NORI_CORE_DIST = path.resolve(__dirname, '../../packages/core/dist');
const RN_CSS_INTEROP = path.resolve(__dirname, '../../node_modules/react-native-css-interop');

module.exports = (api) => {
    api.cache(true);
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
        plugins: ['react-native-worklets/plugin'],
        overrides: [
            {
                test: (filename) =>
                    typeof filename === 'string' &&
                    (filename.startsWith(NORI_CORE_DIST) || filename.startsWith(RN_CSS_INTEROP)),
                plugins: ['react-native-worklets/plugin'],
            },
        ],
    };
};
