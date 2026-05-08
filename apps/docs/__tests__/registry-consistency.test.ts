import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bundleSizes } from '../components/bundle-sizes.generated';
import { previewSources } from '../components/preview-sources.generated';
import { componentProps } from '../components/props.generated';

// Source of truth for "what nori-ui ships today" is the docs surface
// itself. Every component MDX declares its target component name with
// a `<BundleSize component="X" />` tag; the slug is the filename. We
// read both off disk so adding a component is purely a content change
// — no hand-maintained list anywhere.
const DOCS_COMPONENTS_DIR = join(__dirname, '..', 'content', 'docs', 'components');
const BUNDLE_SIZE_TAG = /<BundleSize\s+component=["']([^"']+)["']\s*\/>/;

function readExpectedComponents(): ReadonlyArray<readonly [pascal: string, kebab: string]> {
    const files = readdirSync(DOCS_COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name);
    return files
        .map((file) => {
            const slug = file.replace(/\.mdx$/, '');
            const src = readFileSync(join(DOCS_COMPONENTS_DIR, file), 'utf8');
            const match = src.match(BUNDLE_SIZE_TAG);
            if (!match) {
                throw new Error(
                    `components/${file} is missing the <BundleSize component="…" /> tag — every docs page must declare its target.`
                );
            }
            return [match[1] as string, slug] as const;
        })
        .sort((a, b) => a[0].localeCompare(b[0]));
}

const EXPECTED_COMPONENTS = readExpectedComponents();

const expectedPascal = EXPECTED_COMPONENTS.map(([p]) => p).sort();

describe('component registries stay aligned', () => {
    test('props.generated.ts has an entry for every expected top-level component', () => {
        // Subcomponents like CardHeader / CardTitle are extracted too (each
        // is an exported function); we only require the top-level component
        // is present. The full props.generated set is allowed to be larger.
        const present = new Set(Object.keys(componentProps));
        const missing = expectedPascal.filter((name) => !present.has(name));
        expect(missing).toEqual([]);
    });

    test('bundle-sizes.generated.ts covers exactly the expected top-level components', () => {
        // Bundle sizes are first-import cost; subcomponents share their
        // parent's runtime so they don't get separate entries.
        expect(Object.keys(bundleSizes).sort()).toEqual(expectedPascal);
    });

    test('preview-sources.generated.ts has at least one demo for every expected component', () => {
        // The convention is `<kebab>-basic` for the canonical demo, but
        // some components are documented through scenario demos instead
        // (`accordion-single` / `alert-dialog-destructive` / `input-group-prefix`),
        // and adding a vacuous `-basic` just to satisfy the test would be
        // documentation theatre. Match any demo whose key starts with the
        // component's kebab — that's the underlying contract: every
        // component must have at least one runnable example on its page.
        const presentKeys = Object.keys(previewSources);
        const expectedKebabs = EXPECTED_COMPONENTS.map(([, k]) => k);
        const missing = expectedKebabs.filter(
            (kebab) => !presentKeys.some((key) => key === kebab || key.startsWith(`${kebab}-`))
        );
        expect(missing).toEqual([]);
    });

    test('every bundle-size entry reports a non-zero gzipped cost', () => {
        // A zero would mean the component disappeared from the public entry
        // (tree-shake removed everything) — which is a regression the build
        // wouldn't otherwise notice.
        const zeros = Object.entries(bundleSizes)
            .filter(([, size]) => size.gzipped === 0)
            .map(([name]) => name);
        expect(zeros).toEqual([]);
    });
});
