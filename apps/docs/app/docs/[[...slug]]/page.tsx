import { findNeighbour } from 'fumadocs-core/server';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { PageActions } from '@/components/page-actions';
import { PageNavArrows } from '@/components/page-nav-arrows';
import { source } from '@/lib/source';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    // Compute prev/next from the page tree so fumadocs's footer renders
    // the conventional ← / → arrows at the bottom of every page.
    const { previous, next } = findNeighbour(source.pageTree, page.url);

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
                <PageNavArrows
                    {...(previous ? { previous: { name: previous.name as string, url: previous.url } } : {})}
                    {...(next ? { next: { name: next.name as string, url: next.url } } : {})}
                />
                <PageActions pagePath={page.url} />
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
