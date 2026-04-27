import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createTools } from './tools';
import type { McpData } from './types';

/**
 * Build a wired-up `McpServer` instance with all four tools registered.
 * Caller picks the transport — stdio for the local CLI, HTTP for the
 * docs site's edge route.
 */
export function buildServer(data: McpData, opts?: { name?: string; version?: string }): McpServer {
    const tools = createTools(data);
    const server = new McpServer({
        name: opts?.name ?? `${data.libraryName}-mcp`,
        version: opts?.version ?? '0.1.0',
    });

    server.registerTool(
        'search_components',
        {
            description: 'Fuzzy search components by name, description, or tag.',
            inputSchema: { query: z.string() },
        },
        async ({ query }) => ({
            content: [{ type: 'text', text: JSON.stringify(tools.searchComponents(query)) }],
        })
    );

    server.registerTool(
        'get_component_docs',
        {
            description: 'Full docs body for a single component by name.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => ({
            content: [{ type: 'text', text: JSON.stringify(tools.getComponentDocs(name)) }],
        })
    );

    server.registerTool(
        'get_component_props',
        {
            description: 'Prop definitions for a component.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => ({
            content: [{ type: 'text', text: JSON.stringify(tools.getComponentProps(name)) }],
        })
    );

    server.registerTool(
        'list_examples',
        {
            description: 'List usage examples; filter by component name.',
            inputSchema: { component: z.string().optional() },
        },
        async ({ component }) => ({
            content: [{ type: 'text', text: JSON.stringify(tools.listExamples(component)) }],
        })
    );

    return server;
}
