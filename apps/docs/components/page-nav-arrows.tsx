import Link from 'next/link';

export type PageNavLink = { name: string; url: string };

export type PageNavArrowsProps = {
    previous?: PageNavLink;
    next?: PageNavLink;
};

const Arrow = ({ direction }: { direction: 'prev' | 'next' }) => (
    <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {direction === 'prev' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
);

/**
 * Compact prev/next arrows rendered at the top of every doc page —
 * the shadcn / RNR pattern. Lets a reader walk the docs in order
 * without scrolling to the bottom for the full footer card.
 *
 * Design choice: when a neighbour doesn't exist (first / last page in a
 * section), we omit that arrow entirely instead of rendering a dashed
 * placeholder — the placeholder reads as "broken button" rather than
 * "intentional decoration." If neither neighbour exists this renders
 * nothing at all.
 */
export function PageNavArrows({ previous, next }: PageNavArrowsProps) {
    if (!previous && !next) return null;
    return (
        <nav aria-label="Page navigation" className="not-prose mb-6 flex items-center gap-1.5">
            {previous ? (
                <Link
                    href={previous.url}
                    className="group inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-card px-2 py-1 text-xs text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent hover:text-fd-foreground"
                    title={`Previous: ${previous.name}`}
                    aria-label={`Previous: ${previous.name}`}
                >
                    <Arrow direction="prev" />
                    <span className="hidden sm:inline">Prev</span>
                </Link>
            ) : null}
            {next ? (
                <Link
                    href={next.url}
                    className="group inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-card px-2 py-1 text-xs text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent hover:text-fd-foreground"
                    title={`Next: ${next.name}`}
                    aria-label={`Next: ${next.name}`}
                >
                    <span className="hidden sm:inline">Next</span>
                    <Arrow direction="next" />
                </Link>
            ) : null}
        </nav>
    );
}
