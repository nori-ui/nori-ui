import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const DOCS_URL = process.env.MCP_BASE_URL ?? 'http://localhost:3000';

async function docsIsUp(): Promise<boolean> {
    try {
        const res = await fetch(`${DOCS_URL}/llms.txt`);
        return res.ok;
    } catch {
        return false;
    }
}

test('mcp eval >= 95% pass rate', async () => {
    // run-eval hits the already-running docs server (expected at :3000). Boot
    // it separately (yarn dev:docs) or via the docs-build CI job. The test is
    // skipped when the server is unreachable so the default Playwright run
    // stays green — CI runs the eval from the docs-build job directly.
    const up = await docsIsUp();
    test.skip(!up, `docs server not running at ${DOCS_URL} — run \`yarn dev:docs\` first`);

    const output = execFileSync('yarn', ['node', '--import', 'tsx', 'apps/docs/eval/run-eval.ts'], {
        encoding: 'utf8',
        cwd: repoRoot,
        env: { ...process.env, MCP_BASE_URL: DOCS_URL },
    });
    expect(output).toContain('Passed');
    expect(output).not.toContain('::error::');
});
