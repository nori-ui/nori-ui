import { type BundleSizeName, bundleSizes } from './bundle-sizes.generated';

export type BundleSizeProps = {
    /** Component display name — must match a key in bundle-sizes.generated.ts. */
    component: BundleSizeName;
};

const formatBytes = (n: number): string => {
    if (n < 1024) return `${n} B`;
    return `${(n / 1024).toFixed(1)} kB`;
};

/**
 * Renders a bundle-size badge for a single nori-ui export. Numbers come
 * from `bundle-sizes.generated.ts`, regenerated each docs build by
 * `scripts/generate-bundle-sizes.mjs` (esbuild + gzip on a synthetic
 * one-line entry per component).
 *
 * The number is the cost of *importing this single component into an empty
 * app* — externals (react, react-native, nativewind, etc.) are excluded
 * because the consumer ships them anyway. A real app importing N components
 * pays roughly the first one's cost plus a small marginal increment per
 * additional one, since most of the bytes are the shared runtime layer.
 */
export function BundleSize({ component }: BundleSizeProps) {
    const size = bundleSizes[component];
    if (!size) return null;
    return (
        <span
            className="not-prose inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs text-fd-muted-foreground"
            title={`Minified: ${formatBytes(size.raw)} · Gzipped: ${formatBytes(size.gzipped)} (single-component import; shared runtime cost only paid once across the whole library)`}
        >
            <span className="font-mono">{formatBytes(size.gzipped)}</span>
            <span>gzipped</span>
        </span>
    );
}
