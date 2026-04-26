import Link from 'next/link';

export type PageNavLink = { name: string; url: string };

export type PageNavArrowsProps = {
    previous?: PageNavLink;
    next?: PageNavLink;
};

const Arrow = ({ direction }: { direction: 'prev' | 'next' }) => (
    <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
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
 * Renders nothing if neither neighbour exists (single-page section).
 */
export function PageNavArrows({ previous, next }: PageNavArrowsProps) {
    if (!previous && !next) return null;
    return (
        <nav aria-label="Page navigation" className="not-prose mb-6 flex items-center gap-1">
            {previous ? (
                <Link
                    href={previous.url}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                    title={`Previous: ${previous.name}`}
                    aria-label={`Previous: ${previous.name}`}
                >
                    <Arrow direction="prev" />
                </Link>
            ) : (
                <span
                    aria-hidden="true"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-fd-border text-fd-muted-foreground/40"
                >
                    <Arrow direction="prev" />
                </span>
            )}
            {next ? (
                <Link
                    href={next.url}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                    title={`Next: ${next.name}`}
                    aria-label={`Next: ${next.name}`}
                >
                    <Arrow direction="next" />
                </Link>
            ) : (
                <span
                    aria-hidden="true"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-fd-border text-fd-muted-foreground/40"
                >
                    <Arrow direction="next" />
                </span>
            )}
        </nav>
    );
}
