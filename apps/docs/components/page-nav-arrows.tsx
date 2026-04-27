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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {direction === 'prev' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
);

const ITEM_CLASSES =
    'inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm text-fd-foreground hover:bg-fd-accent transition-colors';

/**
 * Compact prev/next pills rendered inline with `<PageActions>` at the top
 * of every doc page — same visual treatment so the toolbar reads as one
 * cluster, not three. Omits a side entirely (rather than rendering a dim
 * placeholder) when the neighbour doesn't exist; placeholder buttons read
 * as broken, not as decoration.
 */
export function PageNavArrows({ previous, next }: PageNavArrowsProps) {
    if (!previous && !next) return null;
    return (
        <>
            {previous ? (
                <Link
                    href={previous.url}
                    className={ITEM_CLASSES}
                    title={`Previous: ${previous.name}`}
                    aria-label={`Previous: ${previous.name}`}
                >
                    <Arrow direction="prev" />
                    <span>Previous</span>
                </Link>
            ) : null}
            {next ? (
                <Link
                    href={next.url}
                    className={ITEM_CLASSES}
                    title={`Next: ${next.name}`}
                    aria-label={`Next: ${next.name}`}
                >
                    <span>Next</span>
                    <Arrow direction="next" />
                </Link>
            ) : null}
        </>
    );
}
