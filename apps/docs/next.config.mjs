import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // NativeWind + react-native-css-interop must be transpiled by Next so
    // their JSX runtime is applied uniformly across the app.
    transpilePackages: ['nori-ui', '@nori-ui/tokens', 'nativewind', 'react-native-css-interop', 'react-native-web'],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            'react-native$': 'react-native-web',
            // codegenNativeComponent is native-only; stub it on web.
            'react-native/Libraries/Utilities/codegenNativeComponent$': new URL(
                './lib/codegen-noop.js',
                import.meta.url
            ).pathname,
        };
        return config;
    },
};

export default withMDX(nextConfig);
