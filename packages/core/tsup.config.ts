import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        client: 'src/client.ts',
        'theme/index': 'src/theme/index.ts',
        'i18n/index': 'src/i18n/index.ts',
        'icons/index': 'src/icons/index.ts',
        'slot/index': 'src/slot/index.ts',
        'utils/cn': 'src/utils/cn.ts',
        // Stories barrel — re-exports the CSF-derived `components` array.
        // The barrel itself is a thin re-export of csf-loader; the loader
        // uses `require.context` which only Metro/webpack provide. In the
        // published Node/CJS build the loader's runtime call falls back to
        // an empty modules map (typeof require.context !== 'function'),
        // so consumers can import the types but won't get a populated list
        // from the dist build. The native playground compiles from source
        // (workspace symlink), so it picks up the live Metro `components`.
        'stories/index': 'src/stories/index.ts',
        // Platform-split files. Each is its own entry so the `.web.js`
        // suffix is preserved in dist and consumer bundlers (Metro picks
        // the bare `.js`, webpack/Next picks the `.web.js`) can choose at
        // resolve time. Without separate entries tsup chunk-merges them
        // into the main bundle and the suffix is lost.
        'animation/use-animated-number': 'src/animation/use-animated-number.ts',
        'animation/use-animated-number.web': 'src/animation/use-animated-number.web.ts',
        'animation/animated-view': 'src/animation/animated-view.ts',
        'animation/animated-view.web': 'src/animation/animated-view.web.ts',
    },
    format: ['esm', 'cjs'],
    // Use a non-composite tsconfig for the dts build. The main tsconfig.json
    // is composite for yarn workspace project refs (which prevents tsup's
    // rollup-plugin-dts from resolving inter-file imports).
    tsconfig: './tsconfig.build.json',
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    // @nori-ui/tokens is private and bundled into the dist so consumers only
    // install one package. React / React DOM / React Native stay external as
    // peer deps. NativeWind + react-native-css-interop are also external —
    // they're peer deps that the consumer already has installed for their own
    // NativeWind setup.
    // `sonner` is a runtime dep but stays external so the consumer's
    // bundler resolves it directly. Tsup's `__require("sonner")` polyfill
    // doesn't survive webpack's ESM analysis (Next.js client bundles see
    // it as an unresolved require), so the bridge module uses a static
    // `import` and we keep sonner unbundled here.
    // `react-native-reanimated` is an OPTIONAL peer (try/catch'd require
    // in animation/reanimated-adapter.ts). Keeping it external means
    // tsup leaves the literal `require('react-native-reanimated')` in
    // the dist; Metro's static analysis then picks it up and bundles it
    // when the consumer has it installed. Without the external mark,
    // tsup tries to resolve it at lib-build time and either bundles the
    // wrong copy or rewrites the require so Metro can't see it — which
    // is why the lib's runtime fallback fires "Requiring unknown
    // module" even when reanimated is in the consumer's node_modules.
    external: [
        'react',
        'react-dom',
        'react-native',
        'react-native-reanimated',
        'nativewind',
        'react-native-css-interop',
        'sonner',
        // `expo-blur` is an OPTIONAL peer (dynamic require in
        // Dialog/blur-backdrop.tsx). Keep it external so Metro/webpack at
        // consumer-build time can resolve it if installed; without this
        // tsup tries to bundle the JSX-laden source and fails.
        'expo-blur',
    ],
    // Route JSX through NativeWind's runtime so className on RN primitives
    // reaches react-native-css-interop → style instead of being swallowed by
    // react-native-web. Without this, consumers who configure NativeWind at
    // their app level still see the library's primitives render unstyled
    // because the library's compiled JSX calls would bypass the interop wrap.
    esbuildOptions: (opts) => {
        opts.banner = { js: '' };
        opts.keepNames = true;
        opts.jsx = 'automatic';
        opts.jsxImportSource = 'nativewind';
    },
    treeshake: true,
    // Tsup polyfills `require` as `__require` in ESM/CJS output. Metro's
    // static analyzer recognizes the literal `require("...")` AST pattern
    // when it bundles a consumer app, so a `__require("react-native-
    // reanimated")` call at runtime triggers a "Requiring unknown module"
    // error — Metro never saw the bare token and didn't bundle the dep.
    // Rewrite the polyfilled call sites back to the bare form so Metro
    // can bundle our optional-peer reanimated requires correctly. The
    // import + alias declaration in `chunk-W*.js` becomes a no-op
    // statement that's harmless under either bundler.
    async onSuccess() {
        const { readdir, readFile, writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        const distDir = join(import.meta.dirname ?? __dirname, 'dist');
        const files = (await readdir(distDir)).filter((f) => /\.(js|cjs|mjs)$/.test(f));
        for (const name of files) {
            const path = join(distDir, name);
            const original = await readFile(path, 'utf8');
            // Replace ONLY the call sites with bare-string arguments so we
            // don't accidentally rewrite legitimate `__require(variable)`
            // dynamic calls that may appear in unrelated chunks.
            const next = original.replace(/__require\((["'`])([^"'`)]+)\1\)/g, 'require($1$2$1)');
            if (next !== original) {
                await writeFile(path, next);
            }
        }
    },
});
