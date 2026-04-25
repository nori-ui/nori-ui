import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { source } from '@/lib/source';

/**
 * Single endpoint that serves any docs page in a non-HTML form. The middleware
 * rewrites pretty URLs onto this handler:
 *
 *   /docs/controls/button.md   → /api/source/docs/controls/button?format=md
 *   /docs/controls/button.json → /api/source/docs/controls/button?format=json
 *
 * Markdown returns the verbatim MDX file from the repo. JSON wraps that
 * source plus the page's frontmatter for programmatic consumers (agents
 * indexing the docs, scripts that summarize components, etc.).
 *
 * The HTML page and these two views all read from the same source file, so
 * they can never disagree.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    // Format comes from the middleware's `x-source-format` header on the
    // pretty-URL rewrite path, falling back to a `?format=` query when the
    // API route is hit directly. Middleware can't pass query strings —
    // Next.js leaves `req.url` set to the original client URL after a
    // rewrite, so a query set on the rewrite target never reaches here.
    const headerFormat = req.headers.get('x-source-format');
    const queryFormat = new URL(req.url).searchParams.get('format');
    const format = (headerFormat ?? queryFormat) === 'json' ? 'json' : 'md';

    // The catch-all captures the full docs path including the leading
    // "docs" segment, e.g. ["docs", "controls", "button"]. We hand the
    // tail (after "docs") to fumadocs's source loader.
    const docsTail = slug[0] === 'docs' ? slug.slice(1) : slug;
    const page = source.getPage(docsTail);
    if (!page) {
        return new Response(format === 'json' ? JSON.stringify({ error: 'Not found' }) : 'Not found', {
            status: 404,
            headers: { 'Content-Type': format === 'json' ? 'application/json' : 'text/plain' },
        });
    }

    const filePath = join(process.cwd(), 'content/docs', page.file.path);
    let raw: string;
    try {
        raw = readFileSync(filePath, 'utf8');
    } catch {
        return new Response(
            format === 'json' ? JSON.stringify({ error: 'Source unavailable' }) : 'Source unavailable',
            { status: 500, headers: { 'Content-Type': format === 'json' ? 'application/json' : 'text/plain' } }
        );
    }

    if (format === 'md') {
        return new Response(raw, {
            headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        });
    }

    const data = page.data as typeof page.data & {
        since?: string;
        tags?: string[];
        platform?: 'web' | 'native' | 'both';
    };
    const body = {
        title: data.title,
        description: data.description ?? null,
        url: page.url,
        since: data.since ?? null,
        tags: data.tags ?? [],
        platform: data.platform ?? 'both',
        source: raw,
    };
    return new Response(`${JSON.stringify(body, null, 2)}\n`, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

// Force dynamic so middleware-rewritten requests with `?format=md` vs
// `?format=json` return distinct responses instead of being collapsed
// into whichever shape the static cache primed first.
export const dynamic = 'force-dynamic';
