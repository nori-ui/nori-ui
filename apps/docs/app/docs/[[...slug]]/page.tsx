import defaultMdxComponents from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;
    return (
        <DocsPage toc={page.data.toc} {...(page.data.full ? { full: true } : {})}>
            <DocsTitle>{page.data.title}</DocsTitle>
            {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
            <DocsBody>
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
