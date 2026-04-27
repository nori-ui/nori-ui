// Walks `apps/docs/content/docs/**` at build time and snapshots every
// page's frontmatter + body into a single JSON corpus. Both the live
// HTTP MCP route and the local `@nori-ui/mcp` CLI consume this file —
// keeping them in lock-step without either pulling fumadocs at
// runtime.
//
// Output:
//   - apps/docs/lib/mcp-data.generated.json (consumed by the HTTP route)
//   - packages/mcp/src/data.generated.json (bundled into the CLI dist)
//
// Run via: `node apps/docs/scripts/generate-mcp-data.mjs`. Wired into
// `predev` / `prebuild` alongside the other generators.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(HERE, '..', 'content', 'docs');
const OUT_DOCS = join(HERE, '..', 'lib', 'mcp-data.generated.json');
const OUT_PACKAGE = join(HERE, '..', '..', '..', 'packages', 'mcp', 'src', 'data.generated.json');

function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const s = statSync(full);
        if (s.isDirectory()) {
            out.push(...walk(full));
        } else if (entry.endsWith('.mdx')) {
            out.push(full);
        }
    }
    return out;
}

// Minimal frontmatter parser — only handles the YAML subset we use
// across nori-ui docs (string scalars + bracketed string arrays). A
// full YAML parser would be overkill for this fixed input shape.
function parseFrontmatter(raw) {
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) return { meta: {}, body: raw };
    const [, fm, body] = m;
    const meta = {};
    for (const line of fm.split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (value.startsWith('[') && value.endsWith(']')) {
            meta[key] = value
                .slice(1, -1)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else {
            // strip surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            meta[key] = value;
        }
    }
    return { meta, body };
}

const files = walk(DOCS_ROOT);
const pages = files.map((file) => {
    const raw = readFileSync(file, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    // URL: drop `.mdx`, prefix `/docs/`. `index.mdx` → `/docs`.
    const rel = relative(DOCS_ROOT, file)
        .replace(/\\/g, '/')
        .replace(/\.mdx$/, '');
    const url = rel === 'index' ? '/docs' : `/docs/${rel}`;
    return {
        title: meta.title ?? rel,
        description: meta.description ?? '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        since: meta.since ?? '0.1.0',
        platform: meta.platform ?? 'both',
        url,
        body: body.trim(),
    };
});

const data = {
    generatedAt: new Date().toISOString(),
    libraryName: 'nori-ui',
    pages,
};

const json = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(OUT_DOCS, json);
writeFileSync(OUT_PACKAGE, json);
console.log(`Generated MCP corpus with ${pages.length} pages.`);
console.log(`  → ${relative(process.cwd(), OUT_DOCS)}`);
console.log(`  → ${relative(process.cwd(), OUT_PACKAGE)}`);
