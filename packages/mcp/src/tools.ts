import type { McpData, McpPage } from './types';

/**
 * Pure tool implementations operating on a `McpData` corpus.
 * Transport-agnostic: the HTTP route in `apps/docs` and the stdio CLI
 * share these by construction. Adding a new tool means editing this
 * file once; both servers pick it up.
 */
export type Tools = {
    searchComponents: (query: string) => ReturnType<typeof componentSummary>[];
    getComponentDocs: (name: string) => (ReturnType<typeof componentSummary> & { body: string }) | null;
    getComponentProps: (name: string) => { note: string; url: string } | null;
    listExamples: (component?: string) => { component: string; body: string }[];
};

function componentSummary(p: McpPage) {
    return {
        name: p.title,
        description: p.description,
        tags: p.tags,
        since: p.since,
        platform: p.platform,
        url: p.url,
    };
}

function findPage(data: McpData, name: string): McpPage | undefined {
    const lower = name.toLowerCase();
    return data.pages.find((p) => p.title.toLowerCase() === lower);
}

export function createTools(data: McpData): Tools {
    return {
        searchComponents(query) {
            const q = query.toLowerCase();
            return data.pages
                .filter((p) => {
                    return (
                        p.title.toLowerCase().includes(q) ||
                        p.description.toLowerCase().includes(q) ||
                        p.tags.some((t) => t.toLowerCase().includes(q))
                    );
                })
                .map(componentSummary);
        },
        getComponentDocs(name) {
            const page = findPage(data, name);
            if (!page) return null;
            return { ...componentSummary(page), body: page.body };
        },
        // Prop extraction is deferred — the corpus only carries page
        // bodies right now. Returning a pointer keeps the tool callable
        // without lying about what's available.
        getComponentProps(name) {
            const page = findPage(data, name);
            if (!page) return null;
            return {
                note: 'Prop extraction is deferred to a later release. Read the docs body via get_component_docs, or visit:',
                url: page.url,
            };
        },
        listExamples(component) {
            const filter = component?.toLowerCase();
            return data.pages
                .filter((p) => (filter ? p.title.toLowerCase() === filter : true))
                .map((p) => ({ component: p.title, body: p.body }));
        },
    };
}
