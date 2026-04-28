'use client';

import { useCallback, useState } from 'react';

export type PageActionsProps = {
    /** Path of the current page, e.g. `/docs/controls/button`. */
    pagePath: string;
};

const RESET_MS = 1500;

const Glyph = ({ d, size = 14 }: { d: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d={d} />
    </svg>
);

const COPY_PATH =
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z';
const CHECK_PATH = 'M20 6 9 17l-5-5';
const JSON_PATH =
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M10 12a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1 M14 12a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1';

/**
 * Per-page action bar with two affordances:
 *   - "Copy as Markdown" fetches the page's `llms.md` companion and writes
 *     the verbatim MDX source to the clipboard. Useful for pasting into a
 *     chat with Claude / Cursor / ChatGPT.
 *   - "View as JSON" links to the page's `llms.json` companion in a new tab,
 *     for programmatic consumers and quick inspection.
 *
 * Both URLs are served by `/docs/[[...slug]]/llms.{md,json}/route.ts`,
 * which read the same source file the HTML page renders from.
 */
export function PageActions({ pagePath }: PageActionsProps) {
    const [copied, setCopied] = useState(false);
    const trimmed = pagePath.replace(/\/$/, '');
    const mdUrl = `${trimmed}.md`;
    const jsonUrl = `${trimmed}.json`;

    const onCopy = useCallback(async () => {
        try {
            const res = await fetch(mdUrl);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), RESET_MS);
        } catch {
            // Surface failure visibly rather than silently swallowing.
            window.open(mdUrl, '_blank', 'noopener');
        }
    }, [mdUrl]);

    // No wrapper div: the parent toolbar in `app/docs/[[...slug]]/page.tsx`
    // arranges this and `<PageNavArrows>` in a single flex row so the four
    // pills (Prev / Next / Copy / JSON) read as one cluster.
    return (
        <>
            <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm text-fd-foreground hover:bg-fd-accent transition-colors"
            >
                <Glyph d={copied ? CHECK_PATH : COPY_PATH} />
                {copied ? 'Copied' : 'Copy as Markdown'}
            </button>
            <a
                href={jsonUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm text-fd-foreground hover:bg-fd-accent transition-colors"
            >
                <Glyph d={JSON_PATH} />
                View as JSON
            </a>
        </>
    );
}
