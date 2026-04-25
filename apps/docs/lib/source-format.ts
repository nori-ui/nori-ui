// Pure helpers for the docs source-format pipeline (Copy-as-Markdown /
// View-as-JSON). Extracted from middleware.ts + the /api/source/ route
// handler so the URL-parsing and format-selection logic can be unit-tested
// without booting Next.

export type SourceFormat = 'md' | 'json';

const PRETTY_SUFFIX = /^\/docs\/(.+)\.(md|json)$/;

/**
 * Parse a pretty docs URL (e.g. `/docs/controls/button.md`) into the
 * underlying slug and the requested format. Returns null if the path
 * doesn't match the pretty pattern — middleware then falls through to the
 * normal docs page.
 */
export function parsePrettyDocsUrl(pathname: string): { slug: string; format: SourceFormat } | null {
    const match = pathname.match(PRETTY_SUFFIX);
    if (!match) return null;
    const [, slug, format] = match;
    if (!slug || !format) return null;
    return { slug, format: format as SourceFormat };
}

/**
 * Resolve the response format for the `/api/source/[...slug]` route.
 * Header (`x-source-format`) wins because middleware sets it on the
 * pretty-URL rewrite path; `?format=` is the fallback when the route is
 * hit directly. Anything other than the literal `'json'` becomes `'md'`.
 */
export function resolveSourceFormat({
    headerFormat,
    queryFormat,
}: {
    headerFormat: string | null;
    queryFormat: string | null;
}): SourceFormat {
    return (headerFormat ?? queryFormat) === 'json' ? 'json' : 'md';
}
