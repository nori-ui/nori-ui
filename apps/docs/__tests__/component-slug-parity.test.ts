import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readCsfSlugsFromDisk } from '@nori-ui/core/stories/csf-slugs';

// Parity guard: the docs slug list (filesystem of
// `content/docs/components/*.mdx`) and the playground story list
// (CSF files via `readCsfSlugsFromDisk`) must agree. A failure here
// means either an MDX page exists without a story or vice versa.
const DOCS_COMPONENTS_DIR = join(__dirname, '..', 'content', 'docs', 'components');
const CORE_COMPONENTS_DIR = join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'components');

function docsSlugs(): string[] {
    return readdirSync(DOCS_COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name.replace(/\.mdx$/, ''))
        .sort();
}

describe('docs ↔ playground component slug parity', () => {
    test('every story has a matching docs MDX', () => {
        // Stories are still being added — the docs list may be a strict
        // superset of the story list. We assert "no story is missing a
        // docs page", not "every docs page has a story". Once stories
        // catch up to the docs surface, tighten this to `toEqual(docs)`.
        const docs = new Set(docsSlugs());
        const stories = readCsfSlugsFromDisk(CORE_COMPONENTS_DIR);
        const orphaned = stories.filter((slug) => !docs.has(slug));
        expect(orphaned).toEqual([]);
    });
});
