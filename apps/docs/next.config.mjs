import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['unbogify-ui', '@unbogify/tokens'],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            'react-native$': 'react-native-web',
        };
        return config;
    },
};

export default withMDX(nextConfig);
