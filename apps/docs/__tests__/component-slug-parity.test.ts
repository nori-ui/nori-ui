import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Parity guard: the docs slug list (filesystem of
// `content/docs/components/*.mdx`) and the playground story registry
// (`@nori-ui/core/stories/csf-slugs`) must agree. A failure here means
// either an MDX page exists without a story or a story exists without a
// docs page.
//
// `describe.skip` while Spec A is still in flight — Spec A introduces the
// `readCsfSlugsFromDisk` helper this test depends on. Flip to `describe`
// once `@nori-ui/core` exports it.
const COMPONENTS_DIR = join(__dirname, '..', 'content', 'docs', 'components');

function docsSlugs(): string[] {
    return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name.replace(/\.mdx$/, ''))
        .sort();
}

describe.skip('docs ↔ playground component slug parity', () => {
    test('every docs MDX has a matching story (and vice versa)', async () => {
        // Resolved at runtime so the import doesn't fail before Spec A
        // exposes the helper. Once Spec A lands this can move to the top.
        const { readCsfSlugsFromDisk } = (await import(
            // @ts-expect-error -- introduced by Spec A.
            '@nori-ui/core/stories/csf-slugs'
        )) as { readCsfSlugsFromDisk: () => string[] };

        const docs = docsSlugs();
        const stories = readCsfSlugsFromDisk().sort();
        expect(docs).toEqual(stories);
    });
});
