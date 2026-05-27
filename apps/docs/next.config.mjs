import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        // Storybook ships as a static build under public/storybook/ (emitted
        // by the docs build). Serve its manager entry at the clean /storybook
        // URL. The static build injects <base href="/storybook/"> into the
        // manager (see .storybook/main.ts), so its relative chunk URLs resolve
        // without needing a trailing slash — avoiding a redirect loop with
        // Next's default trailingSlash:false. Asset requests under
        // /storybook/* hit the public files directly.
        return [{ source: '/storybook', destination: '/storybook/index.html' }];
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
