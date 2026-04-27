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

| Name                  | Input                | What it returns                                      |
| --------------------- | -------------------- | ---------------------------------------------------- |
| `search_components`   | `{ query: string }`  | Fuzzy search by name, description, or tag.           |
| `get_component_docs`  | `{ name: string }`   | Full docs body for a single component.               |
| `get_component_props` | `{ name: string }`   | Prop definitions (deferred — pointer to docs today). |
| `list_examples`       | `{ component?: ... }` | Usage examples; filter by component name.            |

## How it works

The published bundle embeds a snapshot of the docs corpus into `dist/cli.js` via [`tsup`](https://tsup.egoist.dev)'s JSON loader. There's no network dependency, no rate limit, and the version your agent installs matches the library version it queries — no silent drift between docs and answers.

## HTTP fallback

If your client can't spawn a local process (browser-based agents like Claude.ai web or ChatGPT GPTs), the same server is reachable over HTTP at `https://nori-ui.com/mcp`. Same four tools, same data.

## License

MIT
