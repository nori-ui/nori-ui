import { defineConfig } from 'tsup';

// Two-pass build: the library entries (index/server/tools) ship as
// regular ESM, while the CLI entry gets a Node shebang prepended via
// the `banner` hook so `npx @nori-ui/mcp` and direct invocation Just
// Work without a wrapper script.
//
// `loader: { '.json': 'json' }` embeds the docs corpus into each
// emitted bundle — consumers don't need to resolve a sibling JSON
// file at runtime.
export default defineConfig([
    {
        entry: { index: 'src/index.ts', server: 'src/server.ts', tools: 'src/tools.ts' },
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        target: 'node20',
        loader: { '.json': 'json' },
    },
    {
        entry: { cli: 'src/cli.ts' },
        format: ['esm'],
        dts: false,
        sourcemap: true,
        clean: false,
        target: 'node20',
        loader: { '.json': 'json' },
        banner: { js: '#!/usr/bin/env node' },
    },
]);
