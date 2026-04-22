import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
    const index = source
        .getPages()
        .map((p) => `- [${p.data.title}](${p.url}) — ${p.data.description ?? ''}`)
        .join('\n');

    const body = [
        '# unbogify-ui',
        '',
        'React Native + Web component library. Primary domain reference for LLMs and code agents.',
        '',
        '## Pages',
        '',
        index,
    ].join('\n');

    return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
