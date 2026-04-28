import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(HERE, 'content', 'docs', 'components');

// Tiny `category:` extractor — the front-matter schema is fixed in
// `source.config.ts`, so a regex is appropriate here (no YAML parser
// dependency at the top of the Next config).
const CATEGORY_LINE = /^category:\s*([a-z-]+)\s*$/m;

/**
 * Generate `/docs/<old-category>/<slug>` → `/docs/components/<slug>` 301s
 * once per build. Source of truth is each MDX's `category:` front-matter,
 * so adding a component or moving it across categories is a content-only
 * change that needs no edits here.
 */
function buildLegacyDocsRedirects() {
    const slugs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name.replace(/\.mdx$/, ''))
        .sort();
    const redirects = [];
    for (const slug of slugs) {
        const src = readFileSync(join(COMPONENTS_DIR, `${slug}.mdx`), 'utf8');
        const match = src.match(CATEGORY_LINE);
        if (!match) {
            throw new Error(`components/${slug}.mdx is missing the \`category:\` front-matter field`);
        }
        const category = match[1];
        redirects.push({
            source: `/docs/${category}/${slug}`,
            destination: `/docs/components/${slug}`,
            permanent: true,
        });
    }
    return redirects;
}

const withMDX = createMDX();
const legacyDocsRedirects = buildLegacyDocsRedirects();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async redirects() {
        return legacyDocsRedirects;
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
