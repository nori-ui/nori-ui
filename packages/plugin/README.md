# @nori-ui/plugin

Agent integration package for [nori-ui](https://github.com/nori-ui/nori-ui). Installs:

- The `@nori-ui/mcp` server, so agents can query live component docs/props/examples.
- Skills that encode the procedural knowledge agents need to use `@nori-ui/core` correctly.

## Install

### Any agent (recommended)

Run the installer in your project root. It detects which AI agents you have set up, asks which to install for, and writes the right adapter files for each.

```bash
npx @nori-ui/plugin
```

Non-interactive flags:

```bash
npx @nori-ui/plugin --yes                       # detected agents only, no prompt
npx @nori-ui/plugin --all                       # every supported agent
npx @nori-ui/plugin --targets cursor,cline      # explicit selection
npx @nori-ui/plugin --skill theming             # one skill instead of all
npx @nori-ui/plugin --list                      # list skills + agents
npx @nori-ui/plugin --help
```

### Claude Code (native plugin install)

Claude Code can install this directly as a plugin — no `npx` needed:

```text
/plugin install nori-ui/nori-ui
```

This wires the MCP server and registers the skills via Claude Code's plugin system. Equivalent to `npx @nori-ui/plugin --targets claude-code` but gets you Claude Code's native plugin lifecycle (auto-updates, marketplace UI).

## Supported agents

| ID            | Agent                              | Skill files                                  | MCP wiring        |
| ------------- | ---------------------------------- | -------------------------------------------- | ----------------- |
| `claude-code` | Claude Code                        | `.claude/skills/<name>/SKILL.md`             | auto (`.mcp.json`) |
| `cursor`      | Cursor                             | `.cursor/rules/<name>.mdc`                   | auto (`.cursor/mcp.json`) |
| `cline`       | Cline (VS Code)                    | `.clinerules/<name>.md`                      | manual hint       |
| `codex`       | OpenAI Codex / AGENTS.md           | `AGENTS.md` (merge block)                    | manual hint       |
| `windsurf`    | Windsurf                           | `.windsurf/rules/<name>.md`                  | manual hint       |
| `copilot`     | GitHub Copilot                     | `.github/copilot-instructions.md` (merge)    | n/a               |
| `gemini`      | Gemini CLI                         | `.gemini/skills/<name>/SKILL.md`             | auto (`.gemini/settings.json`) |
| `opencode`    | OpenCode                           | `.opencode/skills/<name>/SKILL.md`           | n/a               |
| `roo`         | Roo Code                           | `.roo/rules/<name>.md`                       | n/a               |
| `aider`       | Aider                              | `CONVENTIONS.md` (merge block)               | n/a               |
| `kilo`        | Kilo Code                          | `.kilocode/rules/<name>.md`                  | n/a               |
| `agents-md`   | Generic AGENTS.md fallback         | `AGENTS.md` (merge block)                    | n/a               |

The merge-block format uses HTML comment markers (`<!-- nori-ui:<skill>:start -->` / `:end`), so re-running the installer is idempotent — existing nori-ui blocks are replaced in place rather than duplicated.

## What's inside

```
packages/plugin/
├── .claude-plugin/
│   └── plugin.json          # Claude Code plugin manifest
├── .mcp.json                # MCP server wiring (Claude Code path)
├── bin/
│   └── install.mjs          # Multi-agent installer (pure stdlib, no deps)
├── skills/                  # Source of truth — neutral SKILL.md files
│   ├── getting-started/
│   │   └── SKILL.md
│   └── theming/
│       └── SKILL.md
└── README.md
```

The `skills/` directory is the single source of truth. The installer adapts its content per agent (Cursor `.mdc` frontmatter, AGENTS.md merge blocks, etc.) — no separate copies are committed.

## Skills roadmap

Shipping today:

- `getting-started` — install, RSC-safe vs `/client` entry, NoriProvider basics.
- `theming` — preset themes, custom NoriTheme, dark mode, Tailwind preset wiring.

Planned next:

- `building-forms` — Form composition, validation, locale-aware inputs.
- `migrating-from-antd` — mechanical translation from Ant Design.
- `cross-platform-gotchas` — web-only vs native-only and the common pitfalls.

Each skill stays narrow — one workflow per skill — so descriptions stay specific and trigger reliably. Detailed reference material belongs in `skills/<name>/references/` rather than the SKILL.md body.

## License

MIT.
