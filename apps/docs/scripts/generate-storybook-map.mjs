// Walks every component in packages/core/src/components/<Name>/ and extracts
// the Storybook story title + first story export from <Name>.stories.tsx.
// Derives a CSF story id and maps it to the component's docs slug.
// Output: apps/docs/components/storybook-map.generated.ts
// — consumed by the per-component "Open in Storybook" link.
//
// Run via the predev/prebuild package.json hooks alongside the other
// generators.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const COMPONENTS_DIR = join(REPO_ROOT, 'packages', 'core', 'src', 'components');
const DOCS_COMPONENTS_DIR = join(HERE, '..', 'content', 'docs', 'components');
const OUT_FILE = join(HERE, '..', 'components', 'storybook-map.generated.ts');

// ---------------------------------------------------------------------------
// CSF sanitize helpers — must mirror Storybook's own rules exactly.
// ---------------------------------------------------------------------------

/**
 * sanitize(s): lowercase, replace every run of non-[a-z0-9] chars with '-',
 * strip leading/trailing '-'.
 */
function sanitize(s) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * humanize(exportKey): insert a space before each uppercase letter that
 * immediately follows a lowercase letter or digit, then trim, then sanitize.
 * Examples: Basic→basic, WithIcons→with-icons, RangeBasic→range-basic.
 */
function sanitizeStoryName(exportKey) {
    const humanized = exportKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
    return sanitize(humanized);
}

// ---------------------------------------------------------------------------
// Collect docs slugs (normalised key → actual slug).
// Normalise: lowercase, strip all non-alphanumeric chars.
// ---------------------------------------------------------------------------
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const slugMap = new Map(); // normalised → slug
for (const entry of readdirSync(DOCS_COMPONENTS_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) {
        continue;
    }
    const slug = entry.name.replace(/\.mdx$/, '');
    slugMap.set(normalize(slug), slug);
}

// ---------------------------------------------------------------------------
// Walk component directories, parse stories files.
// ---------------------------------------------------------------------------

/** Extract the meta title from a stories file source.
 *
 * Two patterns exist in this codebase:
 *   1. `const meta = { title: '...' }` followed by `export default meta;`
 *   2. `export default { title: '...' }` (inline object)
 *
 * In both cases the title line is at a single level of indentation (four
 * spaces) inside an object literal. Contrast with `args: { title: 'x' }`
 * which is either on one line (no leading newline before `title`) or at a
 * deeper indent level.
 *
 * Strategy: scan every line for `title: '...'`, skipping any line that
 * also contains `args` (which indicates an args-object title property, not
 * the meta title). The meta title is the first `title:` that appears before
 * any named story export — both patterns look like:
 *   - `    title: 'Category/Name',`  (indented, in a const meta object)
 *   - `export default { title: 'Category/Name' };`  (inline object)
 * Named story exports can also contain `title:` inside render props, but
 * those always co-appear with `args:` or come after the default export.
 * We stop scanning as soon as we find the first match to avoid false
 * positives in story render functions.
 */
function parseDefaultTitle(src) {
    const lines = src.split('\n');
    for (const line of lines) {
        // Skip lines that also contain 'args' — those are inline args objects.
        if (/\bargs\b/.test(line)) {
            continue;
        }
        // Match `title: 'Category/Name'` anywhere on the line (covers both
        // `    title: '...',` and `export default { title: '...' }`).
        const m = line.match(/\btitle\s*:\s*'([^']+)'/);
        if (m) {
            return m[1];
        }
    }
    return null;
}

/** Extract the name of the first named story export after the default export.
 * Handles both `export const Name` and `export function Name`.
 */
function parseFirstStoryExport(src) {
    const defaultExportIdx = src.indexOf('export default');
    if (defaultExportIdx === -1) {
        return null;
    }
    const afterDefault = src.slice(defaultExportIdx + 'export default'.length);
    const match = afterDefault.match(/\nexport\s+(?:const|function)\s+([A-Za-z][A-Za-z0-9]*)/);
    return match ? match[1] : null;
}

const result = {}; // slug → storybook URL path

for (const dir of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) {
        continue;
    }
    const dirName = dir.name;
    const storiesPath = join(COMPONENTS_DIR, dirName, `${dirName}.stories.tsx`);

    let src;
    try {
        src = readFileSync(storiesPath, 'utf8');
    } catch {
        // No stories file for this component — skip.
        continue;
    }

    const title = parseDefaultTitle(src);
    if (!title) {
        process.stderr.write(`  warn: no title found in ${dirName}.stories.tsx\n`);
        continue;
    }

    const firstExport = parseFirstStoryExport(src);
    if (!firstExport) {
        process.stderr.write(`  warn: no story export found in ${dirName}.stories.tsx\n`);
        continue;
    }

    const storyId = `${sanitize(title)}--${sanitizeStoryName(firstExport)}`;

    // Map component dir name to docs slug via normalised key.
    const normKey = normalize(dirName);
    const slug = slugMap.get(normKey);
    if (!slug) {
        // Component exists in core but has no dedicated docs page — skip.
        continue;
    }

    result[slug] = `/storybook/?path=/story/${storyId}`;
}

// ---------------------------------------------------------------------------
// Emit the generated TypeScript file.
// ---------------------------------------------------------------------------

const banner = `// GENERATED — do not edit. Run apps/docs/scripts/generate-storybook-map.mjs.
// Maps a component docs slug to its Storybook story path.

`;

const entries = Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, path]) => `    ${JSON.stringify(slug)}: ${JSON.stringify(path)},`)
    .join('\n');

const body = `export const storybookMap: Record<string, string> = {\n${entries}\n};\n`;

writeFileSync(OUT_FILE, banner + body);

console.log(`Generated ${relative(process.cwd(), OUT_FILE)} with ${Object.keys(result).length} components.`);
