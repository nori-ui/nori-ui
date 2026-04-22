# Plan 02 — Design Tokens Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic pipeline that takes Tokens Studio–format JSON (Figma-exported) and produces (a) a Tailwind/NativeWind preset consumed by `packages/ui`, and (b) a strongly-typed TS `Theme` interface + token constants. `yarn build:tokens` regenerates everything from source; outputs are committed so reviewers can see diffs.

**Architecture:** `tokens/` is a private workspace package `@unbogify/tokens`. It owns seed JSON (structured by Tokens Studio conventions: one file per token category), a Style Dictionary v4 config with custom formats for Tailwind and TS types, and the generated outputs under `tokens/build/`. `packages/ui` depends on `@unbogify/tokens` as a workspace peer and re-exports the `Theme` type at its public surface.

**Tech Stack:** Style Dictionary v4, TypeScript, Jest (already configured in Plan 01). No new runtime dependencies for `packages/ui` — the preset is a Tailwind config object with no side effects at import time.

**Applies Plan 01 errata throughout:** no `-W` flag; workspace-specific devDeps installed via `yarn workspace @unbogify/tokens add -D …`; Biome already in place from Plan 01.

---

## File Structure

**Created in this plan:**
```
tokens/package.json                                  (promoted from Plan 01 stub)
tokens/tsconfig.json
tokens/README.md
tokens/src/tokens/core/color.json                    (Tokens Studio seed)
tokens/src/tokens/core/spacing.json
tokens/src/tokens/core/radius.json
tokens/src/tokens/core/typography.json
tokens/src/tokens/core/shadow.json
tokens/src/tokens/semantic/light.json                (semantic aliases over core, light mode)
tokens/src/tokens/semantic/dark.json                 (dark mode)
tokens/src/config.mjs                                (Style Dictionary config)
tokens/src/formats/tailwind-preset.mjs               (custom format)
tokens/src/formats/theme-types.mjs                   (custom format)
tokens/src/index.ts                                  (public entry: re-exports generated types + preset path)
tokens/build/tailwind-preset.cjs                     (generated — committed)
tokens/build/theme.ts                                (generated — committed)
tokens/build/theme.css                               (generated — CSS custom properties, for web/docs)
tokens/__tests__/build-contract.test.ts
packages/ui/src/theme/index.ts                       (re-exports Theme type from @unbogify/tokens)
```

**Modified in this plan:**
- `packages/ui/package.json` — adds `@unbogify/tokens` as workspace dependency, adds `theme` export path
- `packages/ui/src/index.ts` — re-exports theme module
- root `package.json` — adds `build:tokens` script
- `.github/workflows/ci.yml` — builds tokens before typecheck/test so generated outputs are present

**NOT in this plan (deferred):**
- The `<UnbogifyProvider theme={...}>` runtime consumer (→ Plan 03)
- Actual Figma/Tokens Studio integration workflow (that's a design-team workflow external to the repo — the seed JSON here is hand-written but matches the Tokens Studio export shape so a real export can replace it)
- Dark-mode runtime toggle UI (→ v1.0 per spec)

---

## Task 1 — Promote `tokens/` to a real workspace package

**Files:**
- Modify: `tokens/package.json` (was a stub from Plan 01 — if it exists, overwrite; if not, create)
- Create: `tokens/tsconfig.json`
- Create: `tokens/README.md`

- [ ] **Step 1: Write `tokens/package.json`.**

```json
{
    "name": "@unbogify/tokens",
    "version": "0.0.0",
    "private": true,
    "description": "Design token pipeline: Tokens Studio JSON → Style Dictionary → Tailwind preset + TS types",
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
        ".": "./src/index.ts",
        "./tailwind-preset": "./build/tailwind-preset.cjs",
        "./theme": "./build/theme.ts",
        "./theme.css": "./build/theme.css"
    },
    "files": [
        "src",
        "build"
    ],
    "scripts": {
        "build": "node src/config.mjs",
        "clean": "rm -rf build",
        "typecheck": "tsc --noEmit",
        "test": "jest --passWithNoTests"
    }
}
```

Notes:
- `main` + `types` point at the hand-written `src/index.ts`, which re-exports the generated artifacts. This keeps the public entry stable even when the generator changes.
- The `./tailwind-preset` subpath is a CommonJS file because Tailwind/NativeWind presets are loaded via `require` in every consumer's `tailwind.config.ts`.

- [ ] **Step 2: Write `tokens/tsconfig.json`** (extends the base, permits `.cjs` consumption via node types).

```json
{
    "extends": "../tooling/tsconfig.base.json",
    "compilerOptions": {
        "rootDir": ".",
        "outDir": "./dist-ts",
        "types": ["node"],
        "noEmit": true,
        "allowJs": true,
        "resolveJsonModule": true
    },
    "include": ["src/**/*", "build/**/*", "__tests__/**/*"],
    "exclude": ["node_modules", "dist-ts"]
}
```

- [ ] **Step 3: Write `tokens/README.md`** (dual-audience: humans + LLMs).

```markdown
# @unbogify/tokens

Design-token source of truth for `unbogify-ui`. Consumes Tokens Studio–format JSON and emits three build outputs:

| Output | Path | Purpose |
|---|---|---|
| Tailwind preset | `build/tailwind-preset.cjs` | Imported by consumer `tailwind.config.ts` / NativeWind |
| TS types + constants | `build/theme.ts` | Typed `Theme` interface + raw token values |
| CSS custom properties | `build/theme.css` | Light/dark variables for docs/web |

## Regenerating

```bash
yarn build:tokens   # from repo root
# or
yarn workspace @unbogify/tokens build
```

## Source layout

```
src/tokens/
  core/            # primitive tokens (scales, palettes)
    color.json
    spacing.json
    radius.json
    typography.json
    shadow.json
  semantic/        # semantic aliases over core (button.bg, text.muted, …)
    light.json
    dark.json
```

The JSON shape follows Tokens Studio's conventions so a real Figma export can replace the seed files without code changes.

## Contract

The generated artifacts are committed. Any PR that touches `src/tokens/**` must also commit the regenerated `build/**` or CI will fail.
```

- [ ] **Step 4: Re-install** to pick up the updated workspace manifest.

```bash
yarn install
```

Expected: clean, no new deps yet.

- [ ] **Step 5: Commit.**

```bash
git add tokens/package.json tokens/tsconfig.json tokens/README.md yarn.lock
git commit -m "chore(tokens): promote tokens/ to a real workspace package"
```

---

## Task 2 — Seed core token JSON (color scale)

**Files:**
- Create: `tokens/src/tokens/core/color.json`

- [ ] **Step 1: Write `tokens/src/tokens/core/color.json`.** Tokens Studio format.

```json
{
    "color": {
        "primary": {
            "50":  { "value": "#f0f7ff", "type": "color" },
            "100": { "value": "#dbeafe", "type": "color" },
            "200": { "value": "#bfdbfe", "type": "color" },
            "300": { "value": "#93c5fd", "type": "color" },
            "400": { "value": "#60a5fa", "type": "color" },
            "500": { "value": "#3b82f6", "type": "color" },
            "600": { "value": "#2563eb", "type": "color" },
            "700": { "value": "#1d4ed8", "type": "color" },
            "800": { "value": "#1e40af", "type": "color" },
            "900": { "value": "#1e3a8a", "type": "color" }
        },
        "neutral": {
            "50":  { "value": "#fafafa", "type": "color" },
            "100": { "value": "#f4f4f5", "type": "color" },
            "200": { "value": "#e4e4e7", "type": "color" },
            "300": { "value": "#d4d4d8", "type": "color" },
            "400": { "value": "#a1a1aa", "type": "color" },
            "500": { "value": "#71717a", "type": "color" },
            "600": { "value": "#52525b", "type": "color" },
            "700": { "value": "#3f3f46", "type": "color" },
            "800": { "value": "#27272a", "type": "color" },
            "900": { "value": "#18181b", "type": "color" }
        },
        "success": { "value": "#22c55e", "type": "color" },
        "warning": { "value": "#f59e0b", "type": "color" },
        "danger":  { "value": "#ef4444", "type": "color" },
        "info":    { "value": "#3b82f6", "type": "color" }
    }
}
```

Notes:
- Two palettes (`primary`, `neutral`) with the 50–900 scale, four semantic single-valued colors. This is the seed; extend in later plans when components need more.
- Contrast check for defaults: `primary.600` on `white` is 4.5:1 (body); `primary.500` on `white` is 3:1 (large text and UI borders). Both meet WCAG 2.2 AA per spec §1 Success Criteria #4.

- [ ] **Step 2: Commit.**

```bash
git add tokens/src/tokens/core/color.json
git commit -m "feat(tokens): seed color core tokens (primary, neutral, semantic)"
```

---

## Task 3 — Seed core token JSON (spacing, radius, typography, shadow)

**Files:**
- Create: `tokens/src/tokens/core/spacing.json`
- Create: `tokens/src/tokens/core/radius.json`
- Create: `tokens/src/tokens/core/typography.json`
- Create: `tokens/src/tokens/core/shadow.json`

- [ ] **Step 1: Write `tokens/src/tokens/core/spacing.json`** (4-point grid).

```json
{
    "spacing": {
        "0":  { "value": "0px",  "type": "spacing" },
        "1":  { "value": "4px",  "type": "spacing" },
        "2":  { "value": "8px",  "type": "spacing" },
        "3":  { "value": "12px", "type": "spacing" },
        "4":  { "value": "16px", "type": "spacing" },
        "5":  { "value": "20px", "type": "spacing" },
        "6":  { "value": "24px", "type": "spacing" },
        "8":  { "value": "32px", "type": "spacing" },
        "10": { "value": "40px", "type": "spacing" },
        "12": { "value": "48px", "type": "spacing" },
        "16": { "value": "64px", "type": "spacing" },
        "20": { "value": "80px", "type": "spacing" },
        "24": { "value": "96px", "type": "spacing" }
    }
}
```

- [ ] **Step 2: Write `tokens/src/tokens/core/radius.json`.**

```json
{
    "radius": {
        "none": { "value": "0px",    "type": "borderRadius" },
        "sm":   { "value": "4px",    "type": "borderRadius" },
        "md":   { "value": "6px",    "type": "borderRadius" },
        "lg":   { "value": "8px",    "type": "borderRadius" },
        "xl":   { "value": "12px",   "type": "borderRadius" },
        "2xl":  { "value": "16px",   "type": "borderRadius" },
        "full": { "value": "9999px", "type": "borderRadius" }
    }
}
```

- [ ] **Step 3: Write `tokens/src/tokens/core/typography.json`.** Font sizes and weights; font family is deferred (platform-specific).

```json
{
    "fontSize": {
        "xs":   { "value": "12px", "type": "fontSizes" },
        "sm":   { "value": "14px", "type": "fontSizes" },
        "md":   { "value": "16px", "type": "fontSizes" },
        "lg":   { "value": "18px", "type": "fontSizes" },
        "xl":   { "value": "20px", "type": "fontSizes" },
        "2xl":  { "value": "24px", "type": "fontSizes" },
        "3xl":  { "value": "30px", "type": "fontSizes" },
        "4xl":  { "value": "36px", "type": "fontSizes" }
    },
    "fontWeight": {
        "regular":  { "value": "400", "type": "fontWeights" },
        "medium":   { "value": "500", "type": "fontWeights" },
        "semibold": { "value": "600", "type": "fontWeights" },
        "bold":     { "value": "700", "type": "fontWeights" }
    },
    "lineHeight": {
        "tight":   { "value": "1.2",  "type": "lineHeights" },
        "normal":  { "value": "1.4",  "type": "lineHeights" },
        "relaxed": { "value": "1.6",  "type": "lineHeights" }
    }
}
```

- [ ] **Step 4: Write `tokens/src/tokens/core/shadow.json`.** Web-only; RN uses a separate elevation abstraction that's implemented in Plan 03.

```json
{
    "shadow": {
        "sm": {
            "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            "type": "boxShadow"
        },
        "md": {
            "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
            "type": "boxShadow"
        },
        "lg": {
            "value": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            "type": "boxShadow"
        }
    }
}
```

- [ ] **Step 5: Commit.**

```bash
git add tokens/src/tokens/core/
git commit -m "feat(tokens): seed spacing, radius, typography, shadow core tokens"
```

---

## Task 4 — Seed semantic aliases (light + dark)

**Files:**
- Create: `tokens/src/tokens/semantic/light.json`
- Create: `tokens/src/tokens/semantic/dark.json`

Semantic tokens reference core tokens via Tokens Studio's `{token.path}` notation. Style Dictionary resolves references during build.

- [ ] **Step 1: Write `tokens/src/tokens/semantic/light.json`.**

```json
{
    "semantic": {
        "background": {
            "default":  { "value": "{color.neutral.50}",  "type": "color" },
            "subtle":   { "value": "{color.neutral.100}", "type": "color" },
            "elevated": { "value": "#ffffff",             "type": "color" }
        },
        "text": {
            "default":  { "value": "{color.neutral.900}", "type": "color" },
            "muted":    { "value": "{color.neutral.600}", "type": "color" },
            "inverted": { "value": "{color.neutral.50}",  "type": "color" }
        },
        "border": {
            "default": { "value": "{color.neutral.200}", "type": "color" },
            "strong":  { "value": "{color.neutral.300}", "type": "color" }
        },
        "interactive": {
            "primary":        { "value": "{color.primary.600}", "type": "color" },
            "primaryHover":   { "value": "{color.primary.700}", "type": "color" },
            "primaryPressed": { "value": "{color.primary.800}", "type": "color" },
            "destructive":    { "value": "{color.danger}",      "type": "color" }
        }
    }
}
```

- [ ] **Step 2: Write `tokens/src/tokens/semantic/dark.json`.** Mirror structure; values flipped.

```json
{
    "semantic": {
        "background": {
            "default":  { "value": "{color.neutral.900}", "type": "color" },
            "subtle":   { "value": "{color.neutral.800}", "type": "color" },
            "elevated": { "value": "{color.neutral.700}", "type": "color" }
        },
        "text": {
            "default":  { "value": "{color.neutral.50}",  "type": "color" },
            "muted":    { "value": "{color.neutral.400}", "type": "color" },
            "inverted": { "value": "{color.neutral.900}", "type": "color" }
        },
        "border": {
            "default": { "value": "{color.neutral.700}", "type": "color" },
            "strong":  { "value": "{color.neutral.600}", "type": "color" }
        },
        "interactive": {
            "primary":        { "value": "{color.primary.400}", "type": "color" },
            "primaryHover":   { "value": "{color.primary.300}", "type": "color" },
            "primaryPressed": { "value": "{color.primary.200}", "type": "color" },
            "destructive":    { "value": "{color.danger}",      "type": "color" }
        }
    }
}
```

- [ ] **Step 3: Commit.**

```bash
git add tokens/src/tokens/semantic/
git commit -m "feat(tokens): seed semantic aliases for light and dark modes"
```

---

## Task 5 — Install Style Dictionary and write the config

**Files:**
- Create: `tokens/src/config.mjs`

- [ ] **Step 1: Install Style Dictionary in the tokens workspace** (remember Plan 01 errata #6: workspace-specific devDeps go in the workspace).

```bash
yarn workspace @unbogify/tokens add -D style-dictionary@^4
```

- [ ] **Step 2: Write `tokens/src/config.mjs`.**

```js
// tokens/src/config.mjs
// Style Dictionary v4 config. Registers two custom formats (tailwind-preset, theme-types)
// and three build targets (light theme, dark theme, TS types).
//
// Invoked by: `yarn workspace @unbogify/tokens build` (which runs `node src/config.mjs`).

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';

import tailwindPresetFormat from './formats/tailwind-preset.mjs';
import themeTypesFormat from './formats/theme-types.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensRoot = path.resolve(__dirname, '..'); // tokens/
const buildDir = path.resolve(tokensRoot, 'build');

StyleDictionary.registerFormat(tailwindPresetFormat);
StyleDictionary.registerFormat(themeTypesFormat);

async function buildForMode(mode /* 'light' | 'dark' */) {
    const sd = new StyleDictionary({
        source: [
            path.join(tokensRoot, 'src/tokens/core/*.json'),
            path.join(tokensRoot, `src/tokens/semantic/${mode}.json`),
        ],
        platforms: {
            css: {
                transformGroup: 'css',
                buildPath: `${buildDir}/`,
                files: [
                    {
                        destination: `theme.css`,
                        format: 'css/variables',
                        options: { selector: mode === 'light' ? ':root' : '[data-theme="dark"]', outputReferences: false },
                    },
                ],
            },
            tailwind: {
                transformGroup: 'js',
                buildPath: `${buildDir}/`,
                files: [
                    {
                        destination: `tailwind-preset.${mode}.cjs`,
                        format: 'unbogify/tailwind-preset',
                        options: { mode },
                    },
                ],
            },
            ts: {
                transformGroup: 'js',
                buildPath: `${buildDir}/`,
                files: [
                    {
                        destination: `theme.${mode}.ts`,
                        format: 'unbogify/theme-types',
                        options: { mode },
                    },
                ],
            },
        },
        log: { warnings: 'warn', verbosity: 'default', errors: { brokenReferences: 'throw' } },
    });

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
}

async function mergeTailwindPresets() {
    const fs = await import('node:fs/promises');
    const light = await fs.readFile(`${buildDir}/tailwind-preset.light.cjs`, 'utf8');
    const dark = await fs.readFile(`${buildDir}/tailwind-preset.dark.cjs`, 'utf8');

    // Both preset files export an object; combine into one with dark-mode class variants.
    const merged = `// GENERATED by @unbogify/tokens — DO NOT EDIT.\n// Run \`yarn build:tokens\` to regenerate.\n\n${light.replace('module.exports = ', 'const light = ')}\n${dark.replace('module.exports = ', 'const dark = ')}\n\nmodule.exports = {\n    darkMode: ['class', '[data-theme="dark"]'],\n    theme: {\n        extend: {\n            ...light.theme.extend,\n            colors: { ...light.theme.extend.colors, dark: dark.theme.extend.colors },\n        },\n    },\n};\n`;
    await fs.writeFile(`${buildDir}/tailwind-preset.cjs`, merged, 'utf8');
    await fs.rm(`${buildDir}/tailwind-preset.light.cjs`);
    await fs.rm(`${buildDir}/tailwind-preset.dark.cjs`);
}

async function mergeThemeTypes() {
    const fs = await import('node:fs/promises');
    const light = await fs.readFile(`${buildDir}/theme.light.ts`, 'utf8');
    const dark = await fs.readFile(`${buildDir}/theme.dark.ts`, 'utf8');

    // light.ts has the full interface; dark.ts contains only the mode-specific values.
    const merged = `// GENERATED by @unbogify/tokens — DO NOT EDIT.\n// Run \`yarn build:tokens\` to regenerate.\n\n${light}\n\n// Dark mode overrides\n${dark.replace(/export const theme/g, 'export const themeDark').replace(/export type Theme/g, '// @ts-expect-error intentional: reuses Theme interface\nexport type ThemeDark')}\n`;
    await fs.writeFile(`${buildDir}/theme.ts`, merged, 'utf8');
    await fs.rm(`${buildDir}/theme.light.ts`);
    await fs.rm(`${buildDir}/theme.dark.ts`);
}

async function main() {
    await buildForMode('light');
    await buildForMode('dark');
    await mergeTailwindPresets();
    await mergeThemeTypes();
    console.log('✓ tokens built');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

Design notes:
- Two passes (light + dark), then a merge step — cleaner than fighting Style Dictionary's single-mode model.
- The final `tailwind-preset.cjs` has `darkMode: ['class', '[data-theme="dark"]']` so consumers get both class-based and attribute-based dark-mode opt-in (spec §1 US-8 + §4 tech stack).
- `errors.brokenReferences: 'throw'` catches any typo like `{color.primary.999}` at build time.
- Uses `style-dictionary` v4's async instance API; do NOT revert to v3 `.buildAllPlatformsSync()`.

- [ ] **Step 3: Commit.** (Formats don't exist yet — build will fail until Task 6. Commit config anyway so the next commit's diff stays focused.)

```bash
git add tokens/src/config.mjs tokens/package.json yarn.lock
git commit -m "feat(tokens): add style-dictionary config with light+dark modes"
```

---

## Task 6 — Write the `tailwind-preset` custom format

**Files:**
- Create: `tokens/src/formats/tailwind-preset.mjs`

- [ ] **Step 1: Write `tokens/src/formats/tailwind-preset.mjs`.**

```js
// tokens/src/formats/tailwind-preset.mjs
// Custom Style Dictionary format: emits a Tailwind preset JS object consumable by
// tailwind.config.ts / NativeWind. Uses the token tree's structure directly — no magic.

/**
 * @param {{ dictionary: import('style-dictionary').Dictionary; options: { mode: 'light' | 'dark' } }} args
 * @returns {string}
 */
function formatTailwindPreset({ dictionary, options }) {
    const tree = buildTree(dictionary.allTokens);

    const extend = {
        colors: flattenNamespace(tree.color ?? {}, tree.semantic ?? {}),
        spacing: flattenLeaves(tree.spacing ?? {}),
        borderRadius: flattenLeaves(tree.radius ?? {}),
        fontSize: flattenLeaves(tree.fontSize ?? {}),
        fontWeight: flattenLeaves(tree.fontWeight ?? {}),
        lineHeight: flattenLeaves(tree.lineHeight ?? {}),
        boxShadow: flattenLeaves(tree.shadow ?? {}),
    };

    return `module.exports = ${stableStringify({ mode: options.mode, theme: { extend } })};\n`;
}

function buildTree(tokens) {
    const root = {};
    for (const token of tokens) {
        let node = root;
        for (let i = 0; i < token.path.length - 1; i++) {
            const key = token.path[i];
            node[key] = node[key] ?? {};
            node = node[key];
        }
        node[token.path[token.path.length - 1]] = token.value;
    }
    return root;
}

function flattenLeaves(obj) {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' || typeof value === 'number') {
            out[key] = String(value);
        }
    }
    return out;
}

function flattenNamespace(color, semantic) {
    const out = {};
    for (const [group, values] of Object.entries(color)) {
        if (typeof values === 'string') {
            out[group] = values;
        } else {
            out[group] = flattenLeaves(values);
        }
    }
    // Semantic aliases live under a dedicated key so consumers write `text-semantic-text-default`.
    if (Object.keys(semantic).length > 0) {
        out.semantic = {};
        for (const [group, values] of Object.entries(semantic)) {
            out.semantic[group] = flattenLeaves(values);
        }
    }
    return out;
}

// Deterministic stringifier — sorted keys — so output diffs stay minimal.
function stableStringify(value, indent = 4) {
    return JSON.stringify(value, (_key, v) => {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            return Object.keys(v)
                .sort()
                .reduce((acc, k) => ({ ...acc, [k]: v[k] }), {});
        }
        return v;
    }, indent);
}

export default {
    name: 'unbogify/tailwind-preset',
    format: formatTailwindPreset,
};
```

- [ ] **Step 2: Commit.**

```bash
git add tokens/src/formats/tailwind-preset.mjs
git commit -m "feat(tokens): add tailwind-preset custom format"
```

---

## Task 7 — Write the `theme-types` custom format

**Files:**
- Create: `tokens/src/formats/theme-types.mjs`

- [ ] **Step 1: Write `tokens/src/formats/theme-types.mjs`.** This is the file that delivers the PRD's "public-API autocomplete is a tested surface" promise: every token path becomes a literal-typed key.

```js
// tokens/src/formats/theme-types.mjs
// Custom Style Dictionary format: emits TypeScript with a typed `theme` object
// + `Theme` interface. Every token path is preserved as a literal key so consumers
// get full autocomplete (e.g. `theme.color.primary['500']`).

/**
 * @param {{ dictionary: import('style-dictionary').Dictionary; options: { mode: 'light' | 'dark' } }} args
 * @returns {string}
 */
function formatThemeTypes({ dictionary, options }) {
    const tree = buildTree(dictionary.allTokens);
    const themeLiteral = emitLiteral(tree, 0);

    const isLight = options.mode === 'light';
    const header = `// Generated for ${options.mode} mode.\n// Do not edit — run \`yarn build:tokens\`.\n`;

    if (isLight) {
        return [
            header,
            `export const theme = ${themeLiteral} as const;\n`,
            `export type Theme = typeof theme;\n`,
        ].join('\n');
    }
    // Dark: emit values only; types come from Theme.
    return [
        header,
        `export const themeDark = ${themeLiteral} as const;\n`,
    ].join('\n');
}

function buildTree(tokens) {
    const root = {};
    for (const token of tokens) {
        let node = root;
        for (let i = 0; i < token.path.length - 1; i++) {
            const key = token.path[i];
            node[key] = node[key] ?? {};
            node = node[key];
        }
        node[token.path[token.path.length - 1]] = token.value;
    }
    return root;
}

function emitLiteral(value, depth) {
    const pad = '    '.repeat(depth);
    const padInner = '    '.repeat(depth + 1);

    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number') return String(value);

    const keys = Object.keys(value).sort();
    if (keys.length === 0) return '{}';

    const entries = keys.map((k) => {
        const v = value[k];
        const keyStr = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        return `${padInner}${keyStr}: ${emitLiteral(v, depth + 1)},`;
    });
    return `{\n${entries.join('\n')}\n${pad}}`;
}

export default {
    name: 'unbogify/theme-types',
    format: formatThemeTypes,
};
```

- [ ] **Step 2: Commit.**

```bash
git add tokens/src/formats/theme-types.mjs
git commit -m "feat(tokens): add theme-types custom format"
```

---

## Task 8 — Run the build and commit generated outputs

**Files:**
- Create: `tokens/build/tailwind-preset.cjs` (generated)
- Create: `tokens/build/theme.ts` (generated)
- Create: `tokens/build/theme.css` (generated, one file per mode)

- [ ] **Step 1: Ensure the `build/` directory is NOT gitignored** — generated outputs are committed.

Inspect `.gitignore`. If a `tokens/build/` rule exists, REMOVE it. The global `build/` rule from Plan 01 matches — we need a negation. Add to `.gitignore`:

```
# design tokens: build outputs ARE committed
!tokens/build/
```

- [ ] **Step 2: Run the build.**

```bash
yarn workspace @unbogify/tokens build
```

Expected: logs `✓ tokens built` and exits 0. Files in `tokens/build/`:
- `tailwind-preset.cjs`
- `theme.ts`
- `theme.css` (light :root variables; dark `[data-theme="dark"]` variables — may be emitted as one combined file or two mode files depending on order; if two appear, merge or leave both and reference both from consumers).

- [ ] **Step 3: Inspect outputs briefly** — open each file and verify:
- `tailwind-preset.cjs` exports `{ darkMode: [...], theme: { extend: { colors, spacing, borderRadius, fontSize, fontWeight, lineHeight, boxShadow } } }`.
- `theme.ts` exports `export const theme = { ... } as const;` + `export type Theme = typeof theme;` + `export const themeDark = { ... } as const;`.
- `theme.css` has CSS custom properties like `--color-primary-500: #3b82f6;`.

If any field is empty, the most likely cause is a Style Dictionary transform group mismatch — verify the `transformGroup: 'js'` vs `'css'` matches what v4 ships with (`css` is standard; `js` is also standard as of v4). If a transform group is missing, switch to explicit `transforms` (reference Style Dictionary v4 docs).

- [ ] **Step 4: Confirm typecheck passes.**

```bash
yarn typecheck
```

Expected: green. The new `theme.ts` is type-correct; generated constants are `as const`.

- [ ] **Step 5: Commit.**

```bash
git add .gitignore tokens/build/
git commit -m "build(tokens): generate initial tailwind preset, theme types, and css vars"
```

---

## Task 9 — Add public entry `tokens/src/index.ts`

**Files:**
- Create: `tokens/src/index.ts`

- [ ] **Step 1: Write `tokens/src/index.ts`.**

```ts
// @unbogify/tokens — public entry.
// Re-exports generated artifacts so consumers import from the package root,
// never from subpaths, keeping internal layout refactorable.

export { theme, themeDark, type Theme } from '../build/theme';

// Consumers load the Tailwind preset via CommonJS require in their tailwind.config.ts:
//
//   import { unbogifyPreset } from '@unbogify/tokens';
//   export default { presets: [unbogifyPreset], content: [...] };
//
// We re-export the preset path here as a string so the require can be lazy.
export const tailwindPresetPath = '@unbogify/tokens/tailwind-preset';
```

- [ ] **Step 2: Typecheck.**

```bash
yarn workspace @unbogify/tokens typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit.**

```bash
git add tokens/src/index.ts
git commit -m "feat(tokens): add public entry re-exporting generated theme + preset path"
```

---

## Task 10 — Contract test for the build pipeline

**Files:**
- Create: `tokens/__tests__/build-contract.test.ts`

- [ ] **Step 1: Write the test.** Covers the invariants every consumer depends on.

```ts
// tokens/__tests__/build-contract.test.ts
// These tests assert the CONTRACT of the build pipeline, not implementation details.
// If any of these fail, downstream consumers (packages/ui, docs, playgrounds) will break.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const tokensRoot = path.resolve(__dirname, '..');
const buildDir = path.join(tokensRoot, 'build');

describe('tokens build contract', () => {
    beforeAll(() => {
        // Regenerate from source so the test reflects the current token tree, not a stale commit.
        execFileSync('node', ['src/config.mjs'], { cwd: tokensRoot, stdio: 'pipe' });
    });

    it('emits tailwind-preset.cjs that exports a Tailwind config with theme.extend', () => {
        const presetPath = path.join(buildDir, 'tailwind-preset.cjs');
        expect(existsSync(presetPath)).toBe(true);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const preset = require(presetPath);
        expect(preset).toEqual(
            expect.objectContaining({
                darkMode: expect.any(Array),
                theme: expect.objectContaining({
                    extend: expect.objectContaining({
                        colors: expect.any(Object),
                        spacing: expect.any(Object),
                        borderRadius: expect.any(Object),
                        fontSize: expect.any(Object),
                        fontWeight: expect.any(Object),
                        lineHeight: expect.any(Object),
                        boxShadow: expect.any(Object),
                    }),
                }),
            }),
        );
    });

    it('includes primary scale 50..900 in tailwind preset', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const preset = require(path.join(buildDir, 'tailwind-preset.cjs'));
        const primary = preset.theme.extend.colors.primary;
        for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']) {
            expect(primary[step]).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it('emits theme.ts with a typed `theme` const and `Theme` type', () => {
        const themeContent = readFileSync(path.join(buildDir, 'theme.ts'), 'utf8');
        expect(themeContent).toContain('export const theme');
        expect(themeContent).toContain('as const');
        expect(themeContent).toContain('export type Theme');
        expect(themeContent).toContain('export const themeDark');
    });

    it('resolves semantic aliases to concrete color values (no leaked {refs})', () => {
        const themeContent = readFileSync(path.join(buildDir, 'theme.ts'), 'utf8');
        // Broken references would leak "{color.primary.600}" strings into output.
        expect(themeContent).not.toMatch(/\{color\./);
    });

    it('emits theme.css with CSS custom properties', () => {
        const css = readFileSync(path.join(buildDir, 'theme.css'), 'utf8');
        expect(css).toContain('--color-primary-500');
        expect(css).toMatch(/:root\s*\{[^}]*--color-primary-500:/);
        expect(css).toMatch(/\[data-theme="dark"\]/);
    });

    it('is deterministic — two consecutive builds produce byte-identical outputs', () => {
        const first = readFileSync(path.join(buildDir, 'tailwind-preset.cjs'), 'utf8');
        execFileSync('node', ['src/config.mjs'], { cwd: tokensRoot, stdio: 'pipe' });
        const second = readFileSync(path.join(buildDir, 'tailwind-preset.cjs'), 'utf8');
        expect(second).toBe(first);
    });
});
```

- [ ] **Step 2: Add a jest config to the tokens workspace.**

Create `tokens/jest.config.cjs`:

```js
const base = require('../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: '@unbogify/tokens',
    testMatch: ['**/__tests__/**/*.test.ts'],
};
```

- [ ] **Step 3: Install jest deps in the tokens workspace** (Plan 01 errata #6).

```bash
yarn workspace @unbogify/tokens add -D jest ts-jest @types/jest
```

- [ ] **Step 4: Run the test.**

```bash
yarn workspace @unbogify/tokens test
```

Expected: 6 passed.

- [ ] **Step 5: Commit.**

```bash
git add tokens/__tests__ tokens/jest.config.cjs tokens/package.json yarn.lock
git commit -m "test(tokens): add build-contract test covering public invariants"
```

---

## Task 11 — Wire into `packages/ui` and root scripts

**Files:**
- Modify: `packages/ui/package.json` (add dep + export path)
- Create: `packages/ui/src/theme/index.ts`
- Modify: `packages/ui/src/index.ts`
- Modify: root `package.json` (add `build:tokens` script)

- [ ] **Step 1: Add the workspace dep to `packages/ui`.**

```bash
yarn workspace unbogify-ui add @unbogify/tokens@workspace:*
```

Expected: `packages/ui/package.json` now has `"@unbogify/tokens": "workspace:*"` in `dependencies`.

- [ ] **Step 2: Create `packages/ui/src/theme/index.ts`.** This is the library's public re-export surface for theme — every consumer gets types from here.

```ts
// packages/ui/src/theme/index.ts
// Re-exports the generated theme types + constants from @unbogify/tokens under
// the library's own public namespace.
//
// Consumers should import `Theme` from 'unbogify-ui', not from '@unbogify/tokens'.

export { theme, themeDark, type Theme } from '@unbogify/tokens';
```

- [ ] **Step 3: Update `packages/ui/src/index.ts`** so the barrel re-exports the theme module.

```ts
// packages/ui/src/index.ts
// Public entry for the `unbogify-ui` package. RSC-safe exports only.
// Stateful/client-only exports (provider, hooks) live in `unbogify-ui/client` (Plan 03).

export * from './theme';
```

- [ ] **Step 4: Add `unbogify-ui/theme` subpath export** so consumers can cherry-pick.

Edit `packages/ui/package.json`'s `exports`:

```json
{
    "exports": {
        ".": "./src/index.ts",
        "./theme": "./src/theme/index.ts"
    }
}
```

- [ ] **Step 5: Add root `build:tokens` script.**

Edit root `package.json`, append to `scripts`:

```json
{
    "scripts": {
        "build:tokens": "yarn workspace @unbogify/tokens build"
    }
}
```

- [ ] **Step 6: Verify the wiring end-to-end.**

```bash
yarn build:tokens
yarn typecheck
yarn test
yarn size
```

All must exit 0. Specifically:
- `yarn typecheck` resolves `@unbogify/tokens` from the workspace and type-checks `packages/ui/src/theme/index.ts` against the generated `Theme` type.
- `yarn size` now measures the theme export — it's a `const` object so gzip-after-tree-shake is tiny, well under the 40 KB first-import budget.

- [ ] **Step 7: Commit.**

```bash
git add packages/ui/package.json packages/ui/src/ package.json yarn.lock
git commit -m "feat(ui): wire @unbogify/tokens into packages/ui as theme export"
```

---

## Task 12 — Update CI to build tokens before typecheck/test

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add a build step before the typecheck/test steps in `quality` job.** Insert after `Install dependencies`:

```yaml
            - name: Build design tokens
              run: yarn build:tokens

            - name: Verify tokens/build is up to date
              run: |
                  if [[ -n "$(git status --porcelain tokens/build/)" ]]; then
                      echo "::error::tokens/build is stale — commit regenerated outputs."
                      git --no-pager diff tokens/build/
                      exit 1
                  fi
```

Full updated `ci.yml`:

```yaml
name: ci

on:
    pull_request:
    push:
        branches: [main]

concurrency:
    group: ci-${{ github.ref }}
    cancel-in-progress: true

jobs:
    quality:
        name: lint + typecheck + test + size
        runs-on: ubuntu-latest
        timeout-minutes: 15
        steps:
            - name: Checkout
              uses: actions/checkout@v4

            - name: Enable corepack
              run: corepack enable

            - name: Use Node.js 20
              uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: yarn

            - name: Install dependencies
              run: yarn install --immutable

            - name: Build design tokens
              run: yarn build:tokens

            - name: Verify tokens/build is up to date
              run: |
                  if [[ -n "$(git status --porcelain tokens/build/)" ]]; then
                      echo "::error::tokens/build is stale — commit regenerated outputs."
                      git --no-pager diff tokens/build/
                      exit 1
                  fi

            - name: Biome check (lint + format)
              run: yarn biome check .

            - name: ESLint (react-native rules)
              run: yarn eslint .

            - name: TypeScript
              run: yarn typecheck

            - name: Tests
              run: yarn test

            - name: Size limit
              run: yarn size
```

Design note: the drift check is important — if contributors forget to commit `tokens/build/` after changing source JSON, every downstream consumer breaks at consume time. CI catches it upfront.

- [ ] **Step 2: Commit.**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: build design tokens and verify generated outputs are up to date"
```

---

## Task 13 — Final verification

- [ ] **Step 1: Fresh clean-install simulation.**

```bash
rm -rf node_modules packages/ui/node_modules tokens/node_modules tokens/build
yarn install --immutable
yarn build:tokens
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
```

All must exit 0.

- [ ] **Step 2: Confirm the public API surface.**

Open a REPL or write a throwaway script at repo root:

```bash
node --input-type=module -e "import('./packages/ui/src/theme/index.ts').catch(e => { console.error(e); process.exit(1); });"
```

This will fail because `.ts` isn't directly loadable — but `yarn typecheck` already proved the types resolve. The node sanity check is just for peace of mind; skip if tsc is green.

- [ ] **Step 3: Commit** any residual changes (should be none).

```bash
git status
# if clean: skip
# else:
git add -A && git commit -m "chore: finalize tokens pipeline"
```

---

## Done criteria for Plan 02

- [ ] `yarn build:tokens` regenerates `tokens/build/{tailwind-preset.cjs, theme.ts, theme.css}` from source JSON.
- [ ] Generated outputs are committed.
- [ ] `yarn workspace @unbogify/tokens test` runs all 6 contract tests green.
- [ ] `packages/ui/src/theme/index.ts` re-exports `Theme` + `theme` + `themeDark` from `@unbogify/tokens`.
- [ ] `unbogify-ui/theme` subpath export is resolvable via `exports` map.
- [ ] CI pipeline builds tokens and fails if `tokens/build/` is stale vs `src/**`.
- [ ] Adding a new token to `src/tokens/core/*.json`, running `yarn build:tokens`, and observing it appear in `build/tailwind-preset.cjs` + `build/theme.ts` works end-to-end (manual smoke check during execution).

When all boxes are ticked, Plan 02 is complete and Plan 03 (Library Core) can begin.

---

## Errata (post-execution notes)

1. **Root `workspaces` glob:** Plan 01's root `package.json` uses `workspaces: ["packages/*", "apps/*", "tooling"]` — `tokens` is not included. Task 1 must add `"tokens"` to the array, or later `yarn workspace @unbogify/tokens …` commands fail.
2. **CSS merge in `src/config.mjs`:** with Style Dictionary v4, two successive builds that write the same `destination: theme.css` overwrite each other. Emit per-mode (`theme.light.css`, `theme.dark.css`) then concatenate into `theme.css` as the last step of `main()`. Contract test #5 (`:root` + `[data-theme="dark"]` both present) gates this.
3. **Theme-types merge double-replace:** the plan text substitutes `theme` → `themeDark` via regex when merging dark types. The `theme-types.mjs` format already emits `themeDark` for dark mode — drop the substitutions or they produce `themeDarkDark`.
4. **`tokens/tsconfig.json` needs `"types": ["jest", "node"]`** (plan has `["node"]`) so the Jest contract tests typecheck.
5. **`tokens/package.json` devDeps** should include `typescript` explicitly — the `typecheck` script runs from the tokens directory and won't resolve workspace-root `typescript` through Yarn 4 script PATH (see Plan 01 errata #6).
6. **`tokens/jest.config.cjs`:** the `transform.tsconfig` path in the shared base (`jest.config.base.cjs`) is written as `<rootDir>/../../tooling/tsconfig.test.json` (two levels up). `tokens` is depth-1, not depth-2 — override `transform` in `tokens/jest.config.cjs` with `<rootDir>/../tooling/tsconfig.test.json`.
7. **`packages/ui/.size-limit.cjs` budget:** the `500 B` placeholder from Plan 01 is too tight once the theme export lands (~588 B gzipped). Bump to `2 KB` in Task 11 Step 5 to reflect reality. This is still vastly under the spec's 40 KB first-import budget and 70 KB total budget.
8. **ESLint `// eslint-disable-next-line @typescript-eslint/no-require-imports` directives:** our ESLint config only has `eslint-plugin-react-native` rules — the `@typescript-eslint/*` namespace isn't loaded, so those directives raise "rule not found" errors. Drop them; raw `require()` in `.cjs` or in contract tests is fine.

Future plans should read these before they hit the same surfaces.
