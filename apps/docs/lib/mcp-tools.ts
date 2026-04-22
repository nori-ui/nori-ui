import type { InferPageType } from 'fumadocs-core/source';
import { source } from '@/lib/source';

type Page = InferPageType<typeof source>;

function componentSummary(p: Page) {
    return {
        name: p.data.title,
        description: p.data.description ?? '',
        tags: p.data.tags ?? [],
        since: p.data.since ?? '0.1.0',
        platform: p.data.platform ?? 'both',
        url: p.url,
    };
}

export function searchComponents(query: string) {
    const q = query.toLowerCase();
    return source
        .getPages()
        .filter((p) => {
            return (
                p.data.title.toLowerCase().includes(q) ||
                (p.data.description ?? '').toLowerCase().includes(q) ||
                (p.data.tags ?? []).some((t) => t.toLowerCase().includes(q))
            );
        })
        .map(componentSummary);
}

export function getComponentDocs(name: string) {
    const page = source.getPages().find((p) => p.data.title.toLowerCase() === name.toLowerCase());
    if (!page) return null;
    const raw = (page.data as unknown as { content?: string }).content ?? '';
    return {
        ...componentSummary(page),
        body: raw,
    };
}

export function listExamples(component?: string) {
    // Minimal — returns every page's raw body filtered by component name if provided.
    return source
        .getPages()
        .filter((p) => (component ? p.data.title.toLowerCase() === component.toLowerCase() : true))
        .map((p) => ({
            component: p.data.title,
            body: (p.data as unknown as { content?: string }).content ?? '',
        }));
}

// Plan 07 enriches prop extraction via react-docgen-typescript. For v0.1 the
// MCP tool returns a note pointing consumers at the docs page.
export function getComponentProps(name: string) {
    const page = source.getPages().find((p) => p.data.title.toLowerCase() === name.toLowerCase());
    if (!page) return null;
    return {
        note: 'Prop extraction is deferred until the dual-build ships in Plan 07. For now consult the docs page:',
        url: page.url,
    };
}
