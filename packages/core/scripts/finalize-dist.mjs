// Post-build step for @nori-ui/core. Runs after tsup (JS) and tsc (types).
//
// 1. Restores `'use client'`. esbuild drops module directives when it bundles
//    and code-splits, so the dist would otherwise ship client components
//    (hooks, context) without the marker React Server Components need. Every
//    emitted file whose sources include a `'use client'` module gets the
//    directive back. Shared chunks that hold only server-safe code (`cn`,
//    theme constants, the i18n resolver) stay unmarked, so they remain
//    callable from server components.
// 2. Ships the Tailwind preset and CSS variables, so consumers configure
//    Tailwind from the one package they installed.

import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(packageRoot, 'dist');
const tokensBuildDir = resolve(packageRoot, '../tokens/build');

const DIRECTIVE = "'use client';\n";
const DIRECTIVE_PATTERN = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/;

async function listFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map((entry) => {
            const path = join(dir, entry.name);
            return entry.isDirectory() ? listFiles(path) : [path];
        })
    );
    return nested.flat();
}

const sourceIsClientCache = new Map();
async function sourceIsClient(sourcePath) {
    if (!sourceIsClientCache.has(sourcePath)) {
        const isClient = readFile(sourcePath, 'utf8').then(
            (text) => DIRECTIVE_PATTERN.test(text),
            () => false
        );
        sourceIsClientCache.set(sourcePath, isClient);
    }
    return sourceIsClientCache.get(sourcePath);
}

async function restoreUseClient() {
    const files = (await listFiles(distDir)).filter((file) => /\.(js|cjs)$/.test(file));
    let marked = 0;
    for (const file of files) {
        let map;
        try {
            map = JSON.parse(await readFile(`${file}.map`, 'utf8'));
        } catch {
            continue;
        }
        const sources = (map.sources ?? [])
            .filter((source) => !source.includes('node_modules'))
            .map((source) => resolve(dirname(file), source));
        const flags = await Promise.all(sources.map(sourceIsClient));
        if (!flags.some(Boolean)) {
            continue;
        }
        const code = await readFile(file, 'utf8');
        if (DIRECTIVE_PATTERN.test(code)) {
            continue;
        }
        // Prepending one line shifts every generated line down by one. A
        // leading `;` in the source map's mappings does the same there.
        await writeFile(file, DIRECTIVE + code);
        map.mappings = `;${map.mappings}`;
        await writeFile(`${file}.map`, JSON.stringify(map));
        marked += 1;
    }
    return { marked, total: files.length };
}

async function shipTokens() {
    await copyFile(join(tokensBuildDir, 'tailwind-preset.cjs'), join(distDir, 'tailwind-preset.cjs'));
    await copyFile(join(tokensBuildDir, 'theme.css'), join(distDir, 'theme.css'));
    await writeFile(
        join(distDir, 'tailwind-preset.d.cts'),
        [
            '/** Tailwind preset carrying the nori-ui design tokens. Add it to `presets` in your Tailwind config. */',
            'declare const noriPreset: {',
            '    darkMode: [string, string];',
            '    theme: { extend: Record<string, unknown> };',
            '};',
            'export = noriPreset;',
            '',
        ].join('\n')
    );
}

const { marked, total } = await restoreUseClient();
await shipTokens();
console.log(
    `✓ dist finalized: 'use client' restored on ${marked} of ${total} files, Tailwind preset + theme.css copied`
);
