import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Alias react-native → react-native-web so imports from `nori-ui` and
// `lucide-react-native` resolve to web-compatible components.
export default defineConfig({
    // `jsxImportSource: 'nativewind'` pivots React's automatic JSX runtime to
    // NativeWind's wrapper so className on RN primitives flows through
    // react-native-css-interop instead of being swallowed by RN-Web's
    // internal CSS-in-JS StyleSheet system.
    plugins: [react({ jsxImportSource: 'nativewind' })],
    // Some RN-ecosystem packages (react-native-worklets, parts of
    // reanimated) read `process.env.NODE_ENV` / `process.env.JEST_WORKER_ID`
    // at module-evaluation time. Vite doesn't shim arbitrary `process.*`
    // accesses on the browser target, so without these defines the page
    // dies with `ReferenceError: process is not defined` before any
    // playground story can render.
    define: {
        // The RN bundler injects a handful of globals that vite doesn't;
        // RN-ecosystem packages (reanimated, worklets, css-interop) crash
        // at module-evaluation time without them. Map each to a browser-
        // friendly equivalent.
        'process.env': '{}',
        __DEV__: 'true',
        global: 'globalThis',
    },
    resolve: {
        // Pick `source` over `import` for `@nori-ui/core/stories` so Vite's
        // `import.meta.glob` runs against the live `src/components/` tree
        // and discovers every `*.stories.tsx`. Without this, Vite consumes
        // the tsup-built dist/stories/index.js and the glob (already
        // executed at lib-build time, against an empty fs) returns nothing.
        conditions: ['source', 'browser', 'module', 'import', 'default'],
        // Prefer `.web.*` over the bare extensions — Metro/Expo's
        // platform-split convention. Without this, Vite reads
        // `animated-view.ts` (which exports reanimated's `Animated.View`)
        // instead of `animated-view.web.ts` (a plain RN `View`), and the
        // first time any story renders an `AnimatedView`, reanimated's
        // web parser chokes on our `cubic-bezier(...)` transition strings
        // and unmounts the entire React tree — causing every `getByTestId`
        // in Playwright to fail with "element(s) not found".
        extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
        alias: [
            // Specific overrides MUST come before the wildcard `react-native/*` so they win.
            // codegenNativeComponent is RN-codegen only — stub it on web.
            {
                find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
                replacement: path.resolve(__dirname, 'src/shims/codegenNativeComponent.js'),
            },
            // ReactFabric is the native fabric renderer — react-native-web has no
            // equivalent. react-native-reanimated eagerly requires it; stub it.
            {
                find: /^react-native\/Libraries\/Renderer\/shims\/ReactFabric$/,
                replacement: path.resolve(__dirname, 'src/shims/ReactFabric.js'),
            },
            // Augmented react-native — re-exports react-native-web plus
            // stubs for the native-only APIs reanimated et al. import
            // (TurboModuleRegistry, etc.). Must come before the bare
            // react-native → react-native-web alias.
            {
                find: /^react-native$/,
                replacement: path.resolve(__dirname, 'src/shims/react-native-rn-stubs.js'),
            },
            { find: /^react-native\/(.*)$/, replacement: 'react-native-web/$1' },
        ],
    },
    server: {
        port: 5173,
    },
    optimizeDeps: {
        // Workspace `@nori-ui/*` packages are intentionally NOT prebundled.
        // The `source` condition in resolve.conditions points at
        // `packages/core/src/...` so vite's normal HMR pipeline reads the
        // live source. Esbuild's prebundler ignores `resolve.conditions`
        // and would pick the `import` condition (= `dist/`) instead, which
        // bypasses the source `import.meta.glob` that discovers stories.
        include: ['nativewind', 'react-native-css-interop'],
        // react-native-css-interop and some RN-ecosystem deps ship JSX inside .js files.
        // Tell esbuild to parse them as JSX during prebundling.
        esbuildOptions: {
            loader: { '.js': 'jsx' },
        },
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
});
