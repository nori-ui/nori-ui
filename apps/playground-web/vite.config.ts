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
    resolve: {
        // Pick `source` over `import` for `@nori-ui/core/stories` so Vite's
        // `import.meta.glob` runs against the live `src/components/` tree
        // and discovers every `*.stories.tsx`. Without this, Vite consumes
        // the tsup-built dist/stories/index.js and the glob (already
        // executed at lib-build time, against an empty fs) returns nothing.
        conditions: ['source', 'browser', 'module', 'import', 'default'],
        alias: [
            // Specific overrides MUST come before the wildcard `react-native/*` so they win.
            // codegenNativeComponent is RN-codegen only — stub it on web.
            {
                find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
                replacement: path.resolve(__dirname, 'src/shims/codegenNativeComponent.js'),
            },
            { find: /^react-native$/, replacement: 'react-native-web' },
            { find: /^react-native\/(.*)$/, replacement: 'react-native-web/$1' },
        ],
    },
    server: {
        port: 5173,
    },
    // Let Vite prebundle workspace packages to speed up cold starts.
    optimizeDeps: {
        include: ['@nori-ui/core', 'nori-ui/client', '@nori-ui/tokens', 'nativewind', 'react-native-css-interop'],
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
