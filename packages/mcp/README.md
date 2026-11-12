# @nori-ui/mcp

Local [Model Context Protocol](https://modelcontextprotocol.io) server for [`@nori-ui/core`](https://www.npmjs.com/package/@nori-ui/core). Bundles the entire docs corpus offline so AI agents can query components without hitting the docs site.

## Install

No install required if your client supports `npx`:

```jsonc
// Claude Desktop / Claude Code: ~/.claude.json or claude_desktop_config.json
{
  "mcpServers": {
    "nori-ui": {
      "command": "npx",
      "args": ["-y", "@nori-ui/mcp"]
    }
  }
}
```

```jsonc
// Cursor: ~/.cursor/mcp.json
{
  "mcpServers": {
    "nori-ui": {
      "command": "npx",
      "args": ["-y", "@nori-ui/mcp"]
    }
  }
}
```

Or install globally:

```sh
npm i -g @nori-ui/mcp
```

…and point your client at `nori-ui-mcp` directly.

## Tools

| Name                  | Input                    | What it returns |
| --------------------- | ------------------------ | --------------- |
| `search_components`   | `{ query: string }`      | Summaries (`name`, `description`, `tags`, `since`, `platform`, `url`) of every docs page whose title, description, or tags contain `query` (case-insensitive substring match). |
| `get_component_docs`  | `{ name: string }`       | The summary plus `body`, the full docs text of the page with that title. `null` if there is none. |
| `get_component_props` | `{ name: string }`       | `{ note, url }`. Prop extraction is deferred: the tool returns a pointer to the docs page, not a prop list. Read props from `get_component_docs`. |
| `list_examples`       | `{ component?: string }` | `{ component, body }[]`, where `body` is the full docs text of the page. With `component`, only that page; without it, every page. |

Every tool returns its result as a JSON string.

## How it works

The published bundle embeds a snapshot of the docs corpus into `dist/cli.js` via [`tsup`](https://tsup.egoist.dev)'s JSON loader. There's no network dependency, no rate limit, and the version your agent installs matches the library version it queries — no silent drift between docs and answers.

## HTTP fallback

If your client can't spawn a local process (browser-based agents like Claude.ai web or ChatGPT GPTs), the same server is reachable over HTTP at `https://nori-ui.com/mcp`. Same four tools, same data.

## License

MIT
