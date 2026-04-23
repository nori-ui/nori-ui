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
        'stories/story-registry': 'src/stories/story-registry.tsx',
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
    // @unbogify/tokens is private and bundled into the dist so consumers only
    // install one package. React / React DOM / React Native stay external as
    // peer deps. NativeWind + react-native-css-interop are also external —
    // they're peer deps that the consumer already has installed for their own
    // NativeWind setup.
    external: ['react', 'react-dom', 'react-native', 'nativewind', 'react-native-css-interop'],
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
});
