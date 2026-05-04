import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Smoke-test the legacy-URL redirect *contract*: every component MDX must
// declare a `category:` front-matter field, and the resulting
// /docs/<category>/<slug> → /docs/components/<slug> mapping must be 1:1.
//
// We re-implement the small extraction logic here rather than importing it
// from `next.config.mjs` (which uses Node ESM with `.mjs`, awkward to
// re-load through ts-jest). The duplication is intentional and tiny — both
// sides walk the same directory with the same regex. If the regex changes,
// both update together.
const COMPONENTS_DIR = join(__dirname, '..', 'content', 'docs', 'components');
const CATEGORY_LINE = /^category:\s*([a-z-]+)\s*$/m;

type SlugCategory = { slug: string; category: string };

function readSlugCategoryPairs(): SlugCategory[] {
    const slugs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name.replace(/\.mdx$/, ''));
    return slugs.map((slug) => {
        const src = readFileSync(join(COMPONENTS_DIR, `${slug}.mdx`), 'utf8');
        const match = src.match(CATEGORY_LINE);
        if (!match) {
            throw new Error(`components/${slug}.mdx is missing category front-matter`);
        }
        return { slug, category: match[1] as string };
    });
}

describe('legacy docs redirects', () => {
    test('every component MDX declares a `category:` front-matter field', () => {
        // Just running readSlugCategoryPairs() throws if any file is
        // missing the field — wrap in an expectation so the failure mode
        // is clear in the report.
        expect(() => readSlugCategoryPairs()).not.toThrow();
    });

    test('every component yields a unique legacy → flat URL pair', () => {
        const pairs = readSlugCategoryPairs();
        const sources = pairs.map(({ slug, category }) => `/docs/${category}/${slug}`);
        const destinations = pairs.map(({ slug }) => `/docs/components/${slug}`);
        // Uniqueness on both sides — duplicates would mean a redirect
        // collision in the Next config.
        expect(new Set(sources).size).toBe(sources.length);
        expect(new Set(destinations).size).toBe(destinations.length);
    });

    test('declared categories are drawn from the known set', () => {
        const known = new Set([
            'actions',
            'controls',
            'display',
            'feedback',
            'inputs',
            'misc',
            'navigation',
            'overlays',
            'primitives',
        ]);
        const pairs = readSlugCategoryPairs();
        const unknown = pairs.filter(({ category }) => !known.has(category));
        expect(unknown).toEqual([]);
    });
});
