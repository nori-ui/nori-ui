import type { InferPageType } from 'fumadocs-core/source';
import type { source } from './source';

export async function getLLMText(page: InferPageType<typeof source>): Promise<string> {
    // page.data.body is the compiled MDX component — we prefer the raw MDX
    // source when available (exposed as `content` by fumadocs-mdx v11).
    const raw = (page.data as unknown as { content?: string }).content ?? '';
    const lines: string[] = [];
    lines.push(`# ${page.data.title}`);
    if (page.data.description) lines.push(page.data.description);
    lines.push('');
    lines.push(`URL: ${page.url}`);
    lines.push(`Since: ${page.data.since ?? '0.1.0'}`);
    lines.push(`Platform: ${page.data.platform ?? 'both'}`);
    if (page.data.tags?.length) lines.push(`Tags: ${page.data.tags.join(', ')}`);
    lines.push('');
    lines.push(raw);
    return lines.join('\n');
}
