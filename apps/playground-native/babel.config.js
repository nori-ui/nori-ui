const path = require('node:path');

// Reanimated 4's worklet markers must be attached to every file that
// calls `useAnimatedStyle` / `useSharedValue` / `withSpring` — the babel
// plugin can't run on a file it never sees, and babel skips node_modules
// by default. So we explicitly opt four locations in:
//   1. The playground's own source (the top-level `plugins`).
//   2. `@nori-ui/core/dist` — our lib's pre-bundled animation code,
//      consumed by direct `@nori-ui/core` imports.
//   3. `@nori-ui/core/src` — consumed by the `@nori-ui/core/stories`
//      barrel via the `react-native` package.json condition. Stories
//      load components from source through the CSF loader's
//      `require.context`, so any reanimated callsite in src/ also
//      needs the worklets transform.
//   4. `react-native-css-interop` — its `cssInterop()` wrapper builds
//      an `useAnimatedStyle` call internally to interpolate className →
//      style on every RN primitive. Without the marker, reanimated 4
//      crashes at first render with "set the key 'current' with the
//      value 'undefined' on an object that is meant to be immutable".
//
// Without all four matches, runtime fails before any nori-ui component
// can render.

const NORI_CORE_DIST = path.resolve(__dirname, '../../packages/core/dist');
const NORI_CORE_SRC = path.resolve(__dirname, '../../packages/core/src');
const RN_CSS_INTEROP = path.resolve(__dirname, '../../node_modules/react-native-css-interop');

module.exports = (api) => {
    api.cache(true);
    return {
        presets: [
            // unstable_transformImportMeta polyfills `import.meta` for Hermes.
            // The CSF loader's bundler module uses `import.meta.glob` (Vite path)
            // and Hermes can't parse it natively; the preset rewrites the
            // expression to a runtime-safe shape during transform.
            ['babel-preset-expo', { jsxImportSource: 'nativewind', unstable_transformImportMeta: true }],
            'nativewind/babel',
        ],
        plugins: ['react-native-worklets/plugin'],
        overrides: [
            {
                test: (filename) =>
                    typeof filename === 'string' &&
                    (filename.startsWith(NORI_CORE_DIST) ||
                        filename.startsWith(NORI_CORE_SRC) ||
                        filename.startsWith(RN_CSS_INTEROP)),
                plugins: ['react-native-worklets/plugin'],
            },
        ],
    };
};
