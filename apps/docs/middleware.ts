import { type NextRequest, NextResponse } from 'next/server';
import { parsePrettyDocsUrl } from '@/lib/source-format';

/**
 * Rewrite pretty per-page source URLs onto the single `/api/source/`
 * handler. Lets us expose `/docs/components/button.md` and
 * `/docs/components/button.json` even though Next.js doesn't allow file-
 * extension segments on a catch-all route.
 */
export function middleware(req: NextRequest) {
    const parsed = parsePrettyDocsUrl(req.nextUrl.pathname);
    if (!parsed) {
        return NextResponse.next();
    }
    const { slug, format } = parsed;
    // Pass the format through a request header rather than a query string:
    // Next.js leaves `req.url` set to the original client URL, so the route
    // handler can't read `?format=` from a middleware rewrite.
    const url = new URL(`/api/source/docs/${slug}`, req.nextUrl.origin);
    return NextResponse.rewrite(url, {
        request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-source-format': format }) },
    });
}

// Match every URL under /docs/. The middleware regex above narrows to the
// `.md` and `.json` suffixes; everything else falls through untouched.
export const config = {
    matcher: '/docs/:path*',
};
