import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import data from './data.generated.json' with { type: 'json' };
import { buildServer } from './server';
import type { McpData } from './types';

/**
 * Stdio MCP server entry point. The shebang is injected by tsup at
 * build time, so the published `dist/cli.js` runs directly under
 * `node` (or `npx @nori-ui/mcp`).
 *
 * Connects on startup and never returns; the MCP SDK keeps the
 * process alive for the lifetime of the parent agent's connection.
 */
async function main(): Promise<void> {
    const server = buildServer(data as McpData);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((_err) => {
    process.exit(1);
});
