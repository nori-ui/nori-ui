import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

test('mcp eval >= 95% pass rate', async () => {
    // run-eval hits the already-running docs server (expected at :3000). Boot
    // it separately (yarn dev:docs) or via the docs-build CI job.
    const baseUrl = process.env.MCP_BASE_URL ?? 'http://localhost:3000';
    const output = execFileSync('yarn', ['tsx', 'apps/docs/eval/run-eval.ts'], {
        encoding: 'utf8',
        cwd: repoRoot,
        env: { ...process.env, MCP_BASE_URL: baseUrl },
    });
    expect(output).toContain('Passed');
    expect(output).not.toContain('::error::');
});
