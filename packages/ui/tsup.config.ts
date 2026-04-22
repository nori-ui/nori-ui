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
    // peer deps.
    external: ['react', 'react-dom', 'react-native'],
    // Preserve "use client" directives so RSC consumers honor boundaries.
    // TODO(release): hook up an esbuild plugin (e.g. esbuild-plugin-preserve-
    // directives) to preserve per-file "use client" banners after bundling.
    // For now the banner is empty; keepNames helps debugging. Client modules
    // still work at runtime — RSC boundary warning is just a hint for Next.js.
    esbuildOptions: (opts) => {
        opts.banner = { js: '' };
        opts.keepNames = true;
    },
    treeshake: true,
});
