// Node-only helper that enumerates `*.stories.tsx` files via `fs` and
// extracts CSF titles → slugs. Used by tooling that runs outside Metro
// (e.g. the docs app's Jest parity test in Spec B), so we don't have to
// pay the cost of running Metro just to know which components exist.
//
// Both the Metro-side `csf-loader.tsx` and this helper share the same
// `pascalToKebab` utility so slugs are byte-identical regardless of which
// path produces them.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pascalToKebab } from './csf-helpers';

const STORY_RE = /\.stories\.tsx$/;
// Match the first `title:` value in the CSF default export. Permissive
// to single + double quotes; falls through gracefully if not found.
const TITLE_RE = /title\s*:\s*['"]([^'"]+)['"]/;

function walk(dir: string, out: string[]): string[] {
    let entries: string[];
    try {
        entries = readdirSync(dir);
    } catch {
        return out;
    }
    for (const name of entries) {
        const full = join(dir, name);
        let s: ReturnType<typeof statSync>;
        try {
            s = statSync(full);
        } catch {
            continue;
        }
        if (s.isDirectory()) {
            walk(full, out);
        } else if (STORY_RE.test(name)) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Read every `*.stories.tsx` under `componentsDir` and return the kebab-case
 * slug for each (derived from the last segment of the CSF `title`).
 *
 * Pure read — does not require Metro, Babel, or React.
 */
export function readCsfSlugsFromDisk(componentsDir: string): string[] {
    const files = walk(componentsDir, []);
    const slugs: string[] = [];
    for (const file of files) {
        const text = readFileSync(file, 'utf8');
        const match = text.match(TITLE_RE);
        if (!match) {
            continue;
        }
        const title = match[1];
        const last = title.split('/').pop() ?? title;
        slugs.push(pascalToKebab(last));
    }
    // Stable, sorted, de-duped.
    return Array.from(new Set(slugs)).sort();
}
