// Single source of truth for "what counts as a known component slug" on the
// docs site. Derived from the fumadocs source so it stays in lockstep with
// the actual MDX files under `content/docs/components/`. Used by:
//
// - `app/components/[slug]/page.tsx` (Universal-Link landing) to 404 unknown
//   slugs rather than redirect to a non-existent docs page.
// - `__tests__/component-slug-parity.test.ts` to assert the docs slug set
//   matches the playground's CSF story registry.
import { source } from '@/lib/source';

const SLUG_PREFIX = 'components/';

/**
 * Sorted list of every component slug currently published in the docs.
 * Computed once at module load — fumadocs's source is static at build time.
 */
export const componentSlugs: ReadonlyArray<string> = source
    .getPages()
    .map((page) => page.file.path.replace(/\.mdx$/, ''))
    .filter((path) => path.startsWith(SLUG_PREFIX))
    .map((path) => path.slice(SLUG_PREFIX.length))
    .sort();

const SLUG_SET: ReadonlySet<string> = new Set(componentSlugs);

/**
 * `true` iff `slug` corresponds to a published component docs page. Used to
 * gate the `/components/<slug>` Universal-Link landing — unknown slugs
 * return 404 instead of redirecting to a missing docs page.
 */
export function isKnownComponentSlug(slug: string): boolean {
    return SLUG_SET.has(slug);
}
