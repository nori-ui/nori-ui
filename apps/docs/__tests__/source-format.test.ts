import { parsePrettyDocsUrl, resolveSourceFormat } from '../lib/source-format';

describe('parsePrettyDocsUrl', () => {
    test('matches /docs/<slug>.md', () => {
        expect(parsePrettyDocsUrl('/docs/components/button.md')).toEqual({
            slug: 'components/button',
            format: 'md',
        });
    });

    test('matches /docs/<slug>.json', () => {
        expect(parsePrettyDocsUrl('/docs/components/button.json')).toEqual({
            slug: 'components/button',
            format: 'json',
        });
    });

    test('handles single-segment slugs (e.g. /docs/changelog.md)', () => {
        expect(parsePrettyDocsUrl('/docs/changelog.md')).toEqual({
            slug: 'changelog',
            format: 'md',
        });
    });

    test('returns null for unsuffixed docs paths', () => {
        // The HTML page must continue to render; middleware falls through.
        expect(parsePrettyDocsUrl('/docs/components/button')).toBeNull();
    });

    test('returns null for unrelated suffixes', () => {
        // Guards against accidentally rewriting a future asset URL like .html
        expect(parsePrettyDocsUrl('/docs/components/button.html')).toBeNull();
        expect(parsePrettyDocsUrl('/docs/components/button.txt')).toBeNull();
    });

    test('returns null for non-docs paths', () => {
        expect(parsePrettyDocsUrl('/api/source/foo.md')).toBeNull();
        expect(parsePrettyDocsUrl('/foo/bar.md')).toBeNull();
    });
});

describe('resolveSourceFormat', () => {
    test('header wins when present', () => {
        // Middleware sets the header on pretty-URL rewrites — the query
        // would never reach this handler from a rewrite, but if both are
        // present the header is the authoritative answer.
        expect(resolveSourceFormat({ headerFormat: 'json', queryFormat: 'md' })).toBe('json');
        expect(resolveSourceFormat({ headerFormat: 'md', queryFormat: 'json' })).toBe('md');
    });

    test('query is the fallback when header is absent', () => {
        expect(resolveSourceFormat({ headerFormat: null, queryFormat: 'json' })).toBe('json');
        expect(resolveSourceFormat({ headerFormat: null, queryFormat: 'md' })).toBe('md');
    });

    test('defaults to markdown when neither is set', () => {
        expect(resolveSourceFormat({ headerFormat: null, queryFormat: null })).toBe('md');
    });

    test('any non-"json" value collapses to "md" (no other formats today)', () => {
        expect(resolveSourceFormat({ headerFormat: 'xml', queryFormat: null })).toBe('md');
        expect(resolveSourceFormat({ headerFormat: '', queryFormat: null })).toBe('md');
    });
});
