import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Storybook is deployed as a separate Vercel project and surfaced at
// nori-ui.com/storybook via rewrite. Override per-environment with
// STORYBOOK_URL; the default points at the production Storybook project.
const storybookUrl = process.env.STORYBOOK_URL ?? 'https://nori-ui-playground-web.vercel.app';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async redirects() {
        // Storybook's manager index.html references its chunks with relative
        // (./sb-manager, ./sb-addons) URLs, so it only resolves correctly when
        // served from a path with a trailing slash. Force /storybook ->
        // /storybook/ before the rewrite below proxies it.
        return [{ source: '/storybook', destination: '/storybook/', permanent: true }];
    },
    async rewrites() {
        // :path* matches zero or more segments, so this also covers the bare
        // /storybook/ index. Path is preserved end-to-end, matching the
        // /storybook/ Vite base the static build was compiled with.
        return [{ source: '/storybook/:path*', destination: `${storybookUrl}/storybook/:path*` }];
    },
    // NativeWind + react-native-css-interop must be transpiled by Next so
    // their JSX runtime is applied uniformly across the app.
    transpilePackages: [
        '@nori-ui/core',
        '@nori-ui/tokens',
        'nativewind',
        'react-native-css-interop',
        'react-native-web',
    ],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            'react-native$': 'react-native-web',
            // codegenNativeComponent is native-only; stub it on web.
            'react-native/Libraries/Utilities/codegenNativeComponent$': new URL(
                './lib/codegen-noop.js',
                import.meta.url
            ).pathname,
            // react-native-reanimated 4 imports RN-internal native paths
            // (e.g. the ReactFabric shim) at module load — webpack can't
            // resolve them. The lib's web code path never invokes any
            // reanimated API (Platform.OS === 'web' returns early before
            // any call site), so a stub satisfies the static import
            // without crashing the build.
            'react-native-reanimated$': new URL('./lib/reanimated-noop.js', import.meta.url).pathname,
        };
        return config;
    },
};

export default withMDX(nextConfig);
