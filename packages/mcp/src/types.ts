/**
 * Shape of the bundled docs corpus. The generator script
 * (`apps/docs/scripts/generate-mcp-data.mjs`) writes this exact
 * structure to `data.generated.json`; both the local CLI and the
 * docs site's HTTP route consume it.
 */
export type McpPage = {
    title: string;
    description: string;
    tags: string[];
    since: string;
    platform: 'web' | 'native' | 'both' | string;
    url: string;
    body: string;
};

export type McpData = {
    generatedAt: string;
    libraryName: string;
    pages: McpPage[];
};
