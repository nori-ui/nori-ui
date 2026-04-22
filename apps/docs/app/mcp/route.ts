// Next.js App Router MCP endpoint.
// Uses the MCP SDK's Web Standards streamable HTTP transport so the server
// can run in any runtime that speaks Request / Response — including Next.js
// route handlers on Node.js 20.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { getComponentDocs, getComponentProps, listExamples, searchComponents } from '@/lib/mcp-tools';

function buildServer() {
    const server = new McpServer({
        name: 'unbogify-ui-docs',
        version: '0.1.0',
    });

    server.registerTool(
        'search_components',
        {
            description: 'Fuzzy search components by name, description, or tag.',
            inputSchema: { query: z.string() },
        },
        async ({ query }) => {
            const result = searchComponents(query);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'get_component_docs',
        {
            description: 'Full docs body for a single component by name.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => {
            const result = getComponentDocs(name);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'get_component_props',
        {
            description: 'Prop definitions for a component.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => {
            const result = getComponentProps(name);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'list_examples',
        {
            description: 'List usage examples; filter by component name.',
            inputSchema: { component: z.string().optional() },
        },
        async ({ component }) => {
            const result = listExamples(component);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    return server;
}

async function handle(req: Request): Promise<Response> {
    const server = buildServer();
    // Stateless mode: no session tracking, plain JSON responses. Matches the
    // v0.1 eval harness which issues single-shot tool calls.
    const transport = new WebStandardStreamableHTTPServerTransport({
        enableJsonResponse: true,
    });
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
