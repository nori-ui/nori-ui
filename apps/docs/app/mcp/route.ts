// Next.js App Router MCP endpoint — quiet HTTP fallback for browser-based
// MCP clients that can't spawn a local process. Wraps the same `buildServer`
// + corpus that the local `@nori-ui/mcp` CLI uses, so adding a tool in one
// place reflects in both surfaces.

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { buildServer, corpus } from '@nori-ui/mcp';

async function handle(req: Request): Promise<Response> {
    const server = buildServer(corpus);
    // Stateless mode: plain JSON responses, no session tracking. Matches
    // how the local stdio server runs (one client, one connection).
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(req);
}

export async function POST(req: Request) {
    return handle(req);
}

export async function GET(req: Request) {
    return handle(req);
}

export async function DELETE(req: Request) {
    return handle(req);
}
