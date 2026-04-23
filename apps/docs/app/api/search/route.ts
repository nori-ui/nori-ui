import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Fumadocs' default search is Orama, served from this Next.js route.
// The Orama index is built from the fumadocs source + its frontmatter.
export const { GET } = createFromSource(source);
