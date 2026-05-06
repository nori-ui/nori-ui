#!/usr/bin/env node
// nori-ui agent skills installer.
//
// Usage:
//   npx @nori-ui/plugin                     interactive install (detects agents)
//   npx @nori-ui/plugin --yes               non-interactive — install for detected agents
//   npx @nori-ui/plugin --all               install for every supported agent
//   npx @nori-ui/plugin --targets a,b       explicit agent ids
//   npx @nori-ui/plugin --skill <name>      install one skill instead of all
//   npx @nori-ui/plugin --list              list skills + agents
//   npx @nori-ui/plugin --help

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(PKG_ROOT, 'skills');
const MCP_PACKAGE = '@nori-ui/mcp';

const ANSI = {
    reset: '\x1B[0m',
    bold: '\x1B[1m',
    dim: '\x1B[2m',
    green: '\x1B[32m',
    yellow: '\x1B[33m',
    cyan: '\x1B[36m',
    red: '\x1B[31m',
};

// -------------------------------------------------------------------------
// Agent registry. Each agent declares:
//   - id            stable kebab-case identifier (used in --targets)
//   - label         human-facing name
//   - detect(cwd)   returns the path that triggered detection, or null
//   - install(skill, cwd)  writes the skill, returns array of relative paths
//   - mcp(cwd)      optional — writes MCP config, returns relative path or null
//   - mcpHint       optional — instruction string when MCP can't be auto-wired
// -------------------------------------------------------------------------

const AGENTS = [
    {
        id: 'claude-code',
        label: 'Claude Code',
        detect: (cwd) => firstExisting(cwd, ['.claude', '.claude-plugin', '.mcp.json', 'CLAUDE.md']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.claude', 'skills', skill.name, 'SKILL.md'], skill.content),
        mcp: (cwd) => mergeJsonMcp(cwd, '.mcp.json'),
    },
    {
        id: 'cursor',
        label: 'Cursor',
        detect: (cwd) => firstExisting(cwd, ['.cursor', '.cursorrules']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.cursor', 'rules', `${skill.name}.mdc`], adaptToCursor(skill)),
        mcp: (cwd) => mergeJsonMcp(cwd, '.cursor/mcp.json'),
    },
    {
        id: 'cline',
        label: 'Cline (VS Code)',
        detect: (cwd) => firstExisting(cwd, ['.clinerules', '.clinerules.md']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.clinerules', `${skill.name}.md`], skill.content),
        mcpHint: 'Cline reads MCP config from VS Code settings — add `nori-ui` via the Cline MCP UI.',
    },
    {
        id: 'codex',
        label: 'OpenAI Codex / AGENTS.md',
        detect: (cwd) => firstExisting(cwd, ['AGENTS.md', '.codex']),
        install: (skill, cwd) => mergeIntoSingleFile(cwd, 'AGENTS.md', skill),
        mcpHint:
            'Codex CLI reads MCP from `~/.codex/config.toml`. Add `[mcp_servers.nori-ui]` with command="npx" and args=["-y","@nori-ui/mcp"].',
    },
    {
        id: 'windsurf',
        label: 'Windsurf',
        detect: (cwd) => firstExisting(cwd, ['.windsurf', '.windsurfrules']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.windsurf', 'rules', `${skill.name}.md`], skill.content),
        mcpHint: 'Windsurf reads MCP from `~/.codeium/windsurf/mcp_config.json` — add the nori-ui server there.',
    },
    {
        id: 'copilot',
        label: 'GitHub Copilot',
        detect: (cwd) => firstExisting(cwd, ['.github/copilot-instructions.md', '.vscode/settings.json']),
        install: (skill, cwd) => mergeIntoSingleFile(cwd, '.github/copilot-instructions.md', skill),
    },
    {
        id: 'gemini',
        label: 'Gemini CLI',
        detect: (cwd) => firstExisting(cwd, ['.gemini', 'GEMINI.md']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.gemini', 'skills', skill.name, 'SKILL.md'], skill.content),
        mcp: (cwd) => mergeJsonMcp(cwd, '.gemini/settings.json', { wrapKey: 'mcpServers' }),
    },
    {
        id: 'opencode',
        label: 'OpenCode',
        detect: (cwd) => firstExisting(cwd, ['.opencode', 'opencode.json', 'opencode.jsonc']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.opencode', 'skills', skill.name, 'SKILL.md'], skill.content),
    },
    {
        id: 'roo',
        label: 'Roo Code',
        detect: (cwd) => firstExisting(cwd, ['.roo', '.roorules']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.roo', 'rules', `${skill.name}.md`], skill.content),
    },
    {
        id: 'aider',
        label: 'Aider (CONVENTIONS.md)',
        detect: (cwd) => firstExisting(cwd, ['CONVENTIONS.md', '.aider.conf.yml']),
        install: (skill, cwd) => mergeIntoSingleFile(cwd, 'CONVENTIONS.md', skill),
    },
    {
        id: 'kilo',
        label: 'Kilo Code',
        detect: (cwd) => firstExisting(cwd, ['.kilocode', '.kilocoderules']),
        install: (skill, cwd) => writeSkillFile(cwd, ['.kilocode', 'rules', `${skill.name}.md`], skill.content),
    },
    {
        id: 'agents-md',
        label: 'Generic AGENTS.md (fallback)',
        detect: () => null, // never auto-detected; explicit opt-in via --all or --targets
        install: (skill, cwd) => mergeIntoSingleFile(cwd, 'AGENTS.md', skill),
    },
];

// -------------------------------------------------------------------------
// Skill discovery & frontmatter parsing
// -------------------------------------------------------------------------

function loadSkills() {
    if (!existsSync(SKILLS_DIR)) {
        return [];
    }
    const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    return dirs.map((name) => {
        const path = join(SKILLS_DIR, name, 'SKILL.md');
        const content = readFileSync(path, 'utf8');
        return { name, content, meta: parseFrontmatter(content) };
    });
}

function parseFrontmatter(content) {
    const m = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) {
        return {};
    }
    const out = {};
    for (const line of m[1].split('\n')) {
        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
            out[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
        }
    }
    return out;
}

function stripFrontmatter(content) {
    return content.replace(/^---\n[\s\S]*?\n---\n+/, '');
}

// -------------------------------------------------------------------------
// Writers
// -------------------------------------------------------------------------

function writeSkillFile(cwd, segments, content) {
    const path = join(cwd, ...segments);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return [segments.join('/')];
}

function adaptToCursor(skill) {
    // Cursor reads `.mdc` files with its own frontmatter shape.
    const description = (skill.meta.description || skill.meta.name || skill.name).replace(/\n/g, ' ');
    const body = stripFrontmatter(skill.content);
    return `---\ndescription: ${JSON.stringify(description)}\nalwaysApply: false\n---\n\n${body}`;
}

function mergeIntoSingleFile(cwd, relPath, skill) {
    const path = join(cwd, relPath);
    mkdirSync(dirname(path), { recursive: true });
    const startMarker = `<!-- nori-ui:${skill.name}:start -->`;
    const endMarker = `<!-- nori-ui:${skill.name}:end -->`;
    // Demote skill headings by one level so a skill's H1 becomes H2 under the host file.
    // Split on fenced code blocks so `#` shell comments inside ```bash ``` are left alone.
    const raw = stripFrontmatter(skill.content).trim();
    const body = raw
        .split(/(```[\s\S]*?```)/g)
        .map((chunk, i) => (i % 2 === 0 ? chunk.replace(/^(#{1,5}) /gm, '#$1 ') : chunk))
        .join('');
    const block = `${startMarker}\n${body}\n${endMarker}`;

    let existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const re = new RegExp(`\\n*${escapeRegex(startMarker)}[\\s\\S]*?${escapeRegex(endMarker)}\\n*`, 'g');
    if (re.test(existing)) {
        existing = existing.replace(re, '\n\n');
    }
    const next = `${existing.trimEnd()}\n\n${block}\n`;
    writeFileSync(path, next.replace(/^\n+/, ''));
    return [relPath];
}

function mergeJsonMcp(cwd, relPath, _opts = {}) {
    const path = join(cwd, relPath);
    let cfg = {};
    if (existsSync(path)) {
        try {
            cfg = JSON.parse(readFileSync(path, 'utf8'));
        } catch {
            return null; // refuse to clobber malformed JSON
        }
    }
    cfg.mcpServers ??= {};
    if (cfg.mcpServers['nori-ui']) {
        return null; // already configured
    }
    cfg.mcpServers['nori-ui'] = { command: 'npx', args: ['-y', MCP_PACKAGE] };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(cfg, null, 2)}\n`);
    return relPath;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstExisting(cwd, candidates) {
    for (const c of candidates) {
        if (existsSync(join(cwd, c))) {
            return c;
        }
    }
    return null;
}

// -------------------------------------------------------------------------
// Interactive checkbox prompt (pure stdlib)
// -------------------------------------------------------------------------

function checkboxPrompt(question, items) {
    const interactive = process.stdout.isTTY && process.stdin.isTTY && !process.env.CI;
    if (!interactive) {
        return Promise.resolve(items.filter((i) => i.checked));
    }

    const stdout = process.stdout;
    const stdin = process.stdin;
    let cursor = 0;
    let firstDraw = true;
    let lineCount = 0;

    const draw = () => {
        const out = [];
        out.push(
            `${ANSI.bold}${question}${ANSI.reset} ${ANSI.dim}(↑↓ move, space toggle, a all, enter confirm, ctrl-c quit)${ANSI.reset}`
        );
        items.forEach((item, i) => {
            const pointer = i === cursor ? `${ANSI.cyan}❯${ANSI.reset} ` : '  ';
            const box = item.checked ? `${ANSI.green}◉${ANSI.reset}` : '◯';
            const tag = item.detected ? ` ${ANSI.dim}[detected: ${item.detected}]${ANSI.reset}` : '';
            out.push(`${pointer}${box} ${item.label}${tag}`);
        });

        if (!firstDraw) {
            stdout.write(`\x1B[${lineCount}A`);
        }
        for (const line of out) {
            stdout.write(`\x1B[2K${line}\n`);
        }
        firstDraw = false;
        lineCount = out.length;
    };

    draw();

    return new Promise((resolveP) => {
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        emitKeypressEvents(stdin);

        const cleanup = () => {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('keypress', onKey);
        };

        const onKey = (_str, key) => {
            if (!key) {
                return;
            }
            if (key.ctrl && key.name === 'c') {
                cleanup();
                stdout.write('\n');
                process.exit(130);
            }
            if (key.name === 'up') {
                cursor = Math.max(0, cursor - 1);
            } else if (key.name === 'down') {
                cursor = Math.min(items.length - 1, cursor + 1);
            } else if (key.name === 'space') {
                items[cursor].checked = !items[cursor].checked;
            } else if (key.name === 'a') {
                const allChecked = items.every((i) => i.checked);
                for (const it of items) {
                    it.checked = !allChecked;
                }
            } else if (key.name === 'return' || key.name === 'enter') {
                cleanup();
                resolveP(items.filter((i) => i.checked));
                return;
            }
            draw();
        };

        stdin.on('keypress', onKey);
    });
}

// -------------------------------------------------------------------------
// Argv parsing — minimal, stdlib-only
// -------------------------------------------------------------------------

function parseArgv(argv) {
    const opts = { yes: false, all: false, list: false, help: false, skill: null, targets: null, dir: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--yes' || a === '-y') {
            opts.yes = true;
        } else if (a === '--all') {
            opts.all = true;
        } else if (a === '--list') {
            opts.list = true;
        } else if (a === '--help' || a === '-h') {
            opts.help = true;
        } else if (a === '--skill') {
            opts.skill = argv[++i];
        } else if (a === '--targets') {
            opts.targets = argv[++i];
        } else if (a === '--dir') {
            opts.dir = argv[++i];
        }
    }
    return opts;
}

function printHelp() {}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

async function main() {
    const opts = parseArgv(process.argv.slice(2));
    const cwd = opts.dir ? resolve(opts.dir) : process.cwd();

    if (opts.help) {
        return printHelp();
    }

    const skills = loadSkills();
    if (skills.length === 0) {
        process.exit(1);
    }

    if (opts.list) {
        for (const _s of skills) {
        }
        for (const _a of AGENTS) {
        }
        return;
    }

    const selectedSkills = opts.skill ? skills.filter((s) => s.name === opts.skill) : skills;
    if (selectedSkills.length === 0) {
        process.exit(1);
    }

    // Build agent selection set
    const detected = new Map(AGENTS.map((a) => [a.id, a.detect(cwd)]));
    const items = AGENTS.map((a) => ({
        id: a.id,
        label: a.label,
        detected: detected.get(a.id),
        checked: opts.all ? true : Boolean(detected.get(a.id)),
    }));

    let selected;
    if (opts.targets) {
        const ids = new Set(opts.targets.split(',').map((s) => s.trim()));
        selected = items.filter((i) => ids.has(i.id));
        const unknown = [...ids].filter((id) => !AGENTS.find((a) => a.id === id));
        if (unknown.length) {
            process.exit(1);
        }
    } else if (opts.all || opts.yes) {
        selected = items.filter((i) => i.checked);
    } else {
        selected = await checkboxPrompt('Install for which agents?', items);
    }

    if (selected.length === 0) {
        return;
    }
    const summary = [];
    const mcpHints = [];

    for (const sel of selected) {
        const agent = AGENTS.find((a) => a.id === sel.id);
        const writtenForAgent = [];

        for (const skill of selectedSkills) {
            try {
                const written = agent.install(skill, cwd);
                writtenForAgent.push(...written);
            } catch (_err) {}
        }

        let mcpPath = null;
        if (agent.mcp) {
            try {
                mcpPath = agent.mcp(cwd);
            } catch (_err) {}
        }
        if (!mcpPath && agent.mcpHint) {
            mcpHints.push(`${agent.label}: ${agent.mcpHint}`);
        }

        summary.push({ agent, written: writtenForAgent, mcpPath });
    }
    for (const row of summary) {
        for (const _w of row.written) {
        }
        if (row.mcpPath) {
        }
    }

    if (mcpHints.length > 0) {
        for (const _h of mcpHints) {
        }
    }
}

main().catch((_err) => {
    process.exit(1);
});
