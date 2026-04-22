import type { MetaData, PageData, Source } from 'fumadocs-core/source';
import { loader } from 'fumadocs-core/source';
import { resolveFiles } from 'fumadocs-mdx';
import { docs, meta } from '@/.source';

// fumadocs-mdx 11's `createMDXSource` returns `{ files: () => VirtualFile[] }`
// but fumadocs-core 15's `Source` type expects `{ files: VirtualFile[] }`.
// Bridge the two by calling `resolveFiles` eagerly and assert the resulting
// source carries the parsed frontmatter as page data.
type DocEntry = (typeof docs)[number];
type MetaEntry = (typeof meta)[number];

const source_: Source<{
    pageData: DocEntry & PageData;
    metaData: MetaEntry & MetaData;
}> = { files: resolveFiles({ docs, meta }) } as never;

export const source = loader({
    baseUrl: '/docs',
    source: source_,
});
