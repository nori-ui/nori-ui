import { findNeighbour } from 'fumadocs-core/server';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { PageActions } from '@/components/page-actions';
import { PageNavArrows } from '@/components/page-nav-arrows';
import { storybookMap } from '@/components/storybook-map.generated';
import { source } from '@/lib/source';

// Inline external-link glyph — no icon-set dep.
const ExternalLinkIcon = (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) {
        notFound();
    }

    // Compute prev/next from the page tree so fumadocs's footer renders
    // the conventional ← / → arrows at the bottom of every page.
    const { previous, next } = findNeighbour(source.pageTree, page.url);

    // Derive a Storybook deep-link if this is a component page
    // (slug = ['components', '<name>']).
    const slug = params.slug ?? [];
    const componentSlug = slug.length === 2 && slug[0] === 'components' ? slug[1] : undefined;
    const storybookUrl = componentSlug !== undefined ? (storybookMap[componentSlug] ?? null) : null;

    const MDX = page.data.body;
    return (
        <DocsPage
            toc={page.data.toc}
            editOnGithub={{
                owner: 'nori-ui',
                repo: 'nori-ui',
                sha: 'main',
                path: `apps/docs/content/docs/${page.file.path}`,
            }}
            footer={{
                items: {
                    ...(previous ? { previous: { name: previous.name as string, url: previous.url } } : {}),
                    ...(next ? { next: { name: next.name as string, url: next.url } } : {}),
                },
            }}
            {...(page.data.full ? { full: true } : {})}
        >
            <DocsTitle>{page.data.title}</DocsTitle>
            {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
            <DocsBody>
                {/* Single toolbar row: copy / json on the left, prev /
                 * next pinned to the right via `ml-auto` on the trailing
                 * group so the row reads as page-level actions on one
                 * side and navigation on the other. The arrows wrapper
                 * also re-introduces `gap-2` so the two pills don't
                 * collapse against each other. */}
                <div className="not-prose mb-6 flex flex-wrap items-center gap-2 text-sm">
                    <PageActions pagePath={page.url} />
                    {storybookUrl ? (
                        <a
                            href={storybookUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm text-fd-foreground hover:bg-fd-accent transition-colors"
                        >
                            {ExternalLinkIcon}
                            Open in Storybook
                        </a>
                    ) : null}
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <PageNavArrows
                            {...(previous ? { previous: { name: previous.name as string, url: previous.url } } : {})}
                            {...(next ? { next: { name: next.name as string, url: next.url } } : {})}
                        />
                    </div>
                </div>
                <MDX
                    components={{
                        ...defaultMdxComponents,
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

export function generateStaticParams() {
    return source.generateParams();
}
