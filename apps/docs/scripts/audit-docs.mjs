// Quick gap audit: compares the props extracted from packages/core/src
// (via props.generated.ts) against what each MDX page in
// content/docs/components mentions. Flags:
//   - props that exist in source but never appear in the page body
//   - <PropsTable component="X" /> references where X is missing from
//     props.generated.ts
//   - compound subcomponents found in source (e.g. Foo.Bar = ...) that
//     don't get their own <PropsTable> row
//
// Output is meant for an author to skim and act on; it is not a strict
// linter. Run via `node apps/docs/scripts/audit-docs.mjs`.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const DOCS_DIR = join(REPO_ROOT, 'apps', 'docs', 'content', 'docs', 'components');
const COMPONENTS_DIR = join(REPO_ROOT, 'packages', 'core', 'src', 'components');
const PROPS_FILE = join(REPO_ROOT, 'apps', 'docs', 'components', 'props.generated.ts');

const propsSrc = readFileSync(PROPS_FILE, 'utf8');
// Crude parse — the file is generated, shape is stable.
const start = propsSrc.indexOf('const componentProps');
const open = propsSrc.indexOf('{', start);
let depth = 0;
let close = open;
for (let i = open; i < propsSrc.length; i += 1) {
    const c = propsSrc[i];
    if (c === '{') {
        depth += 1;
    } else if (c === '}') {
        depth -= 1;
        if (depth === 0) {
            close = i;
            break;
        }
    }
}
const jsonText = propsSrc.slice(open, close + 1);
const componentProps = JSON.parse(jsonText);

const docsFiles = readdirSync(DOCS_DIR).filter((f) => f.endsWith('.mdx'));

// Slugs are kebab-case; the canonical component name is PascalCase.
// A few don't follow the simple split-join pattern.
const SLUG_OVERRIDES = {
    hstack: 'HStack',
    vstack: 'VStack',
    'toggle-group': 'ToggleGroup',
    toast: 'Toaster',
};
const slugToComponent = (slug) => {
    if (SLUG_OVERRIDES[slug]) {
        return SLUG_OVERRIDES[slug];
    }
    return slug
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
};

const findComponentSourceDir = (componentName) => {
    const dirs = readdirSync(COMPONENTS_DIR);
    for (const d of dirs) {
        if (d.toLowerCase() === componentName.toLowerCase()) {
            return join(COMPONENTS_DIR, d);
        }
    }
    return null;
};

const collectAttachedMembers = (sourceDir) => {
    if (!sourceDir) {
        return [];
    }
    const tsxFiles = [];
    const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            if (e.isDirectory()) {
                walk(join(dir, e.name));
            } else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) {
                tsxFiles.push(join(dir, e.name));
            }
        }
    };
    walk(sourceDir);
    const members = new Set();
    // Only count members on the primary component name (e.g. Tabs, Card),
    // and only when the assignment looks like attaching a sibling component
    // — not random namespace property writes (Platform.OS = …).
    const primaryName = sourceDir.split('/').pop();
    for (const f of tsxFiles) {
        const content = readFileSync(f, 'utf8');
        const re = new RegExp(`\\b${primaryName}\\.([A-Z][A-Za-z0-9]*)\\s*=\\s*[A-Z]`, 'g');
        for (const m of content.matchAll(re)) {
            members.add(`${primaryName}.${m[1]}`);
        }
    }
    return [...members];
};

const reports = [];
for (const file of docsFiles.sort()) {
    const slug = file.replace(/\.mdx$/, '');
    const mdx = readFileSync(join(DOCS_DIR, file), 'utf8');
    const propsTableRefs = [...mdx.matchAll(/<PropsTable\s+component=["']([^"']+)["']/g)].map((m) => m[1]);
    const oldStyleRefs = [...mdx.matchAll(/<PropsTable\s+name=["']([^"']+)["']/g)].map((m) => m[1]);

    const componentName = slugToComponent(slug);
    const sourceDir = findComponentSourceDir(componentName);
    const attached = collectAttachedMembers(sourceDir);

    const issues = [];

    if (oldStyleRefs.length > 0) {
        issues.push(`uses <PropsTable name="..."> instead of component=: ${oldStyleRefs.join(', ')}`);
    }

    for (const ref of propsTableRefs) {
        if (!(ref in componentProps)) {
            issues.push(`<PropsTable component="${ref}" /> but "${ref}" missing from props.generated.ts`);
        }
    }

    // For the primary component of this page, compute prop-mention coverage.
    // A prop is "mentioned" if its name appears in the MDX body as backtick code.
    const primaryProps = componentProps[componentName];
    if (!primaryProps) {
        if (componentName !== 'Toast' && componentName !== 'FloatButton') {
            // Some pages have alias names (toast -> Toaster). Skip if no match.
            issues.push(`no props.generated.ts entry for primary component "${componentName}"`);
        }
    } else {
        const undocumented = primaryProps
            .map((p) => p.name)
            .filter((p) => p !== 'className' && p !== 'testID' && p !== 'ref' && p !== 'children')
            .filter((name) => {
                // Backtick-quoted prop alone OR followed by `=` (attribute use)
                // OR `:` (type field). Catches `prop`, `prop=`, `prop:` styles.
                const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                const re = new RegExp(`\\\`${escaped}[=:` + `]?\\\`|\\\`${escaped}=`);
                return !re.test(mdx);
            });
        if (undocumented.length > 0) {
            issues.push(`undocumented props (no \`prop\` mention in body): ${undocumented.join(', ')}`);
        }
    }

    // Compound members in source that aren't represented by <PropsTable>
    const referencedTopLevel = new Set(propsTableRefs);
    for (const m of attached) {
        const key = m.replace('.', '');
        if (!referencedTopLevel.has(key) && !referencedTopLevel.has(m.split('.')[0] + m.split('.')[1])) {
            // Heuristic: skip if it's a non-component utility (lowercase 2nd part already filtered)
            // Also skip if it's the primary component's own self-reference
            issues.push(`attached compound member \`${m}\` found in source — no docs row`);
        }
    }

    if (issues.length > 0) {
        reports.push({ slug, issues });
    }
}

if (reports.length === 0) {
    console.log('No issues found.');
} else {
    for (const r of reports) {
        console.log(`\n## ${r.slug}.mdx`);
        for (const i of r.issues) {
            console.log(`  - ${i}`);
        }
    }
}
