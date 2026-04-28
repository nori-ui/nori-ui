// Tests for the CSF loader. We can't run Metro's `require.context` from
// jest (node), so we exercise the loader's `buildComponents` directly with
// fixture modules and use the on-disk slug helper for the on-disk parity.

import { join } from 'node:path';
import { buildComponents, humanise, pascalToKebab } from '../csf-loader';
import { readCsfSlugsFromDisk } from '../csf-slugs';

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

describe('pascalToKebab', () => {
    it('converts PascalCase tokens', () => {
        expect(pascalToKebab('WithGap')).toBe('with-gap');
        expect(pascalToKebab('Primary')).toBe('primary');
        expect(pascalToKebab('Switch')).toBe('switch');
    });

    it('keeps leading acronyms intact (matches docs filenames)', () => {
        expect(pascalToKebab('HStack')).toBe('hstack');
        expect(pascalToKebab('VStack')).toBe('vstack');
    });

    it('splits multi-word PascalCase', () => {
        expect(pascalToKebab('AlertDialog')).toBe('alert-dialog');
        expect(pascalToKebab('RadioGroup')).toBe('radio-group');
        expect(pascalToKebab('TextInput')).toBe('text-input');
        expect(pascalToKebab('BodyMd')).toBe('body-md');
    });
});

describe('humanise', () => {
    it('humanises PascalCase to spaced Title Case', () => {
        expect(humanise('WithGap')).toBe('With Gap');
        expect(humanise('Primary')).toBe('Primary');
        expect(humanise('BodyMd')).toBe('Body Md');
    });
});

describe('buildComponents', () => {
    function FakeComponent() {
        return null;
    }

    const fixtures = {
        './Button/Button.stories.tsx': {
            default: { title: 'Controls/Button', component: FakeComponent, args: { children: 'Click' } },
            Primary: {},
            Loading: { args: { loading: true } },
        },
        './Switch/Switch.stories.tsx': {
            default: { title: 'Controls/Switch', component: FakeComponent },
            Default: {},
            Checked: { args: { checked: true } },
        },
    };

    it('builds an entry per component', () => {
        const entries = buildComponents(fixtures);
        expect(entries).toHaveLength(2);
    });

    it('derives slug from the last `/`-segment of the title', () => {
        const entries = buildComponents(fixtures);
        const slugs = entries.map((e) => e.slug);
        expect(slugs).toEqual(['button', 'switch']);
    });

    it('preserves story declaration order', () => {
        const entries = buildComponents(fixtures);
        const button = entries.find((e) => e.slug === 'button');
        expect(button?.stories.map((s) => s.id)).toEqual(['primary', 'loading']);
    });

    it('returns kebab-case slugs', () => {
        const entries = buildComponents(fixtures);
        for (const entry of entries) {
            expect(entry.slug).toMatch(SLUG_RE);
        }
    });

    it('returns kebab-case story ids that are unique within a component', () => {
        const entries = buildComponents(fixtures);
        for (const entry of entries) {
            const ids = entry.stories.map((s) => s.id);
            for (const id of ids) {
                expect(id).toMatch(SLUG_RE);
            }
            expect(new Set(ids).size).toBe(ids.length);
        }
    });

    it('drops modules with no named story exports', () => {
        const entries = buildComponents({
            './Empty/Empty.stories.tsx': {
                default: { title: 'Misc/Empty', component: FakeComponent },
            },
        });
        expect(entries).toHaveLength(0);
    });

    it('renders without throwing when meta has no component but a default render', () => {
        const entries = buildComponents({
            './Custom/Custom.stories.tsx': {
                default: { title: 'Misc/Custom', render: () => null },
                Default: {},
            },
        });
        expect(entries).toHaveLength(1);
        const story = entries[0]?.stories[0];
        expect(story).toBeDefined();
        // story.render is a React function component; invoking it as a
        // plain function is valid here because we asserted it exists.
        // biome-ignore lint/style/noNonNullAssertion: covered by the assertion above
        expect(story!.render({})).toBeNull();
    });

    it('sorts entries alphabetically by slug', () => {
        const entries = buildComponents({
            './Z/Z.stories.tsx': { default: { title: 'X/Z', component: FakeComponent }, A: {} },
            './A/A.stories.tsx': { default: { title: 'X/A', component: FakeComponent }, A: {} },
            './M/M.stories.tsx': { default: { title: 'X/M', component: FakeComponent }, A: {} },
        });
        expect(entries.map((e) => e.slug)).toEqual(['a', 'm', 'z']);
    });
});

describe('on-disk CSF discovery (readCsfSlugsFromDisk)', () => {
    const componentsDir = join(__dirname, '..', '..', 'components');

    it('finds at least the components covered by the legacy registry', () => {
        const slugs = readCsfSlugsFromDisk(componentsDir);
        // These are the components the legacy story-registry covered;
        // each must still have a CSF file post-migration.
        const required = [
            'box',
            'button',
            'checkbox',
            'hstack',
            'spinner',
            'switch',
            'text',
            'text-area',
            'text-input',
            'vstack',
        ];
        for (const slug of required) {
            expect(slugs).toContain(slug);
        }
    });

    it('produces unique kebab-case slugs', () => {
        const slugs = readCsfSlugsFromDisk(componentsDir);
        for (const slug of slugs) {
            expect(slug).toMatch(SLUG_RE);
        }
        expect(new Set(slugs).size).toBe(slugs.length);
    });
});
