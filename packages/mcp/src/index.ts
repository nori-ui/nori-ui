export { buildServer } from './server';
export { createTools, type Tools } from './tools';
export type { McpData, McpPage } from './types';

// The bundled docs corpus. Importing this gives a fully-resolved
// `McpData` object — no I/O at runtime.
import data from './data.generated.json' with { type: 'json' };
import type { McpData } from './types';
export const corpus: McpData = data as McpData;
