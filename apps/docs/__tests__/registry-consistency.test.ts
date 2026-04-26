import { bundleSizes } from '../components/bundle-sizes.generated';
import { previewSources } from '../components/preview-sources.generated';
import { componentProps } from '../components/props.generated';

// Single source of truth for "what nori-ui ships today". When you add or
// remove a component, update this list — the failing test points you at
// every registry that needs the matching entry.
//
// Tuple form: [PascalCase component name, kebab demo key prefix].
// We need both because component names like `HStack` don't round-trip
// through naive kebab conversion.
const EXPECTED_COMPONENTS: ReadonlyArray<readonly [pascal: string, kebab: string]> = [
    ['Alert', 'alert'],
    ['Avatar', 'avatar'],
    ['Badge', 'badge'],
    ['Box', 'box'],
    ['Button', 'button'],
    ['Card', 'card'],
    ['Checkbox', 'checkbox'],
    ['HStack', 'hstack'],
    ['Icon', 'icon'],
    ['RadioGroup', 'radio-group'],
    ['Separator', 'separator'],
    ['Spinner', 'spinner'],
    ['Switch', 'switch'],
    ['Text', 'text'],
    ['TextArea', 'text-area'],
    ['TextInput', 'text-input'],
    ['VStack', 'vstack'],
];

const expectedPascal = EXPECTED_COMPONENTS.map(([p]) => p).sort();
const expectedBasicDemoKeys = EXPECTED_COMPONENTS.map(([, k]) => `${k}-basic`);

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

    test('preview-sources.generated.ts has a <kebab>-basic demo for every expected component', () => {
        // Extra demos beyond `-basic` are allowed (variations / patterns);
        // missing the basic one for any component is not.
        const present = new Set(Object.keys(previewSources));
        const missing = expectedBasicDemoKeys.filter((key) => !present.has(key));
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
