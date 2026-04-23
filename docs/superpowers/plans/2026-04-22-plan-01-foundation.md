# Plan 01 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo skeleton with all tooling wired — Yarn Berry workspaces, shared TS config, Biome (primary) + ESLint-RN (gap), commitlint + lefthook on Conventional Commits, Jest, CI workflow, size-limit skeleton — so that `yarn install && yarn lint && yarn typecheck && yarn test` runs green on an empty library package.

**Architecture:** Monorepo with one published package (`packages/ui` → `nori-ui`) and placeholder app/tooling directories. Shared configs live in `tooling/`. Each file has a single responsibility; splits follow concern, not technical layer. No components yet — just the scaffold on which every later plan depends.

**Tech Stack:** Yarn 4 (Berry) with `nodeLinker: node-modules`, TypeScript 5.6+, Biome 2.x, ESLint flat config + `eslint-plugin-react-native`, commitlint + `@commitlint/config-conventional`, lefthook, Jest 29 + `@testing-library/react-native`, GitHub Actions, `size-limit`.

---

## File Structure

**Created in this plan:**
```
.editorconfig
.gitattributes
.gitignore
.nvmrc
.yarnrc.yml
.yarn/releases/yarn-4.x.x.cjs           (added by corepack / yarn set version)
package.json                             (workspace root)
biome.json
eslint.config.mjs
commitlint.config.cjs
lefthook.yml
jest.config.base.cjs
tsconfig.json                            (root, references only)
tooling/tsconfig.base.json
tooling/tsconfig.library.json
tooling/tsconfig.test.json
packages/ui/package.json
packages/ui/tsconfig.json
packages/ui/jest.config.cjs
packages/ui/src/index.ts
packages/ui/src/__tests__/smoke.test.ts
packages/ui/.size-limit.cjs
.github/workflows/ci.yml
README.md
```

**NOT in this plan (deferred to later plans):**
- Any component code, theme, i18n, provider (→ Plan 03)
- Apps scaffolding (→ Plan 04 onward)
- Tokens pipeline (→ Plan 02)
- Release workflow, semantic-release config (→ Plan 07)
- Docs site (→ Plan 06)
- Playwright, Maestro (→ Plans 04/05)

---

## Pre-flight

The repo already exists at `/Users/manuelbieh/htdocs/_git/ui-kit`, `git init` is done, remote is `git@github.com:nori-ui/nori-ui.git`, and the PRD is committed. Work proceeds on `main`.

**Required local tooling:**
- Node 20+ installed.
- `corepack` enabled (ships with Node 16.9+; run `corepack enable` once).

---

## Task 1 — Node pin + EditorConfig + gitattributes + gitignore

**Files:**
- Create: `.nvmrc`
- Create: `.editorconfig`
- Create: `.gitattributes`
- Create: `.gitignore`

- [ ] **Step 1: Create `.nvmrc`** — pins Node major for contributors with nvm/fnm.

```
20
```

- [ ] **Step 2: Create `.editorconfig`** — matches barhoppers-guide's 4-space / 2-space-for-data convention.

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{json,yml,yaml,md}]
indent_size = 2
```

- [ ] **Step 3: Create `.gitattributes`** — ensures consistent line endings across platforms.

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
```

- [ ] **Step 4: Create `.gitignore`** — standard Node + Yarn Berry (with node-modules linker) + OS + editor + build outputs.

```
# dependencies
node_modules/

# yarn berry — when using nodeLinker: node-modules, we still track a few yarn files
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
.pnp.*

# build output
dist/
build/
.next/
.turbo/
coverage/
*.tsbuildinfo

# caches
.cache/
.expo/
.parcel-cache/

# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# editors
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
```

- [ ] **Step 5: Commit**

```bash
git add .nvmrc .editorconfig .gitattributes .gitignore
git commit -m "chore: add baseline editor, gitignore, and node pinning"
```

---

## Task 2 — Initialize Yarn Berry with node-modules linker

**Files:**
- Create: `.yarnrc.yml`
- Create: `package.json` (workspace root)

- [ ] **Step 1: Enable corepack and set Yarn 4** (one-time per machine).

Run:
```bash
cd /Users/manuelbieh/htdocs/_git/ui-kit
corepack enable
yarn set version stable
```

Expected: `.yarn/releases/yarn-4.*.cjs` created, `packageManager` field may be added to package.json automatically. If package.json doesn't exist yet, yarn will error — that's fine, run after step 2.

- [ ] **Step 2: Create workspace-root `package.json`.**

```json
{
  "name": "nori-ui-monorepo",
  "version": "0.0.0",
  "private": true,
  "packageManager": "yarn@4.5.0",
  "workspaces": [
    "packages/*",
    "apps/*",
    "tooling"
  ],
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "typecheck": "yarn workspaces foreach -A -pt run typecheck",
    "lint": "biome check . && yarn eslint:rn",
    "eslint:rn": "eslint .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "test": "yarn workspaces foreach -A -pt run test"
  }
}
```

Note: the `packageManager` value pins a specific Yarn 4.x. Step 1 may have written a slightly different minor — if so, match what `yarn --version` reports.

- [ ] **Step 3: Create `.yarnrc.yml`** — lock the linker to node-modules (safest for Expo/Metro/RN tooling).

```yaml
nodeLinker: node-modules
enableGlobalCache: true
yarnPath: .yarn/releases/yarn-4.5.0.cjs
```

The `yarnPath` should match the exact file in `.yarn/releases/`. If `yarn set version stable` produced a different file, use that.

- [ ] **Step 4: Install** (creates empty `yarn.lock` / `node_modules`).

Run:
```bash
yarn install
```

Expected: exits 0. Creates `yarn.lock`.

- [ ] **Step 5: Commit**

```bash
git add .yarnrc.yml package.json yarn.lock .yarn/releases/
git commit -m "chore: initialize yarn berry workspaces with node-modules linker"
```

---

## Task 3 — Monorepo directory scaffold

**Files:**
- Create: `packages/ui/package.json` (stub — filled in Task 6)
- Create: `packages/ui/src/index.ts` (empty barrel for now)
- Create: `apps/.gitkeep`
- Create: `tokens/.gitkeep`
- Create: `tooling/package.json` (workspace package so configs can be shared via `@nori-ui/tooling` workspace import)

- [ ] **Step 1: Create `packages/ui/package.json` stub.**

```json
{
  "name": "nori-ui",
  "version": "0.0.0",
  "private": true,
  "description": "React Native + React Native Web UI component library — placeholder name, will be renamed",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com:nori-ui/nori-ui.git"
  },
  "engines": {
    "node": ">=20"
  },
  "sideEffects": false,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "jest --passWithNoTests"
  }
}
```

Notes:
- `sideEffects: false` is critical for tree-shaking; every later plan preserves it.
- `"main"`/`"types"`/`"exports"` point at `.ts` sources for now; Plan 07 introduces the compiled dual-build (ESM + CJS + `.d.ts`).
- `private: true` until Plan 07 flips it for the first publish.

- [ ] **Step 2: Create an empty barrel** so tsc and Jest don't choke.

Create `packages/ui/src/index.ts`:
```ts
export {};
```

- [ ] **Step 3: Create placeholder directories** for future plans.

```bash
mkdir -p apps tokens
touch apps/.gitkeep tokens/.gitkeep
```

- [ ] **Step 4: Create `tooling/package.json`** as a workspace package so later plans can share configs via workspace imports.

```json
{
  "name": "@nori-ui/tooling",
  "version": "0.0.0",
  "private": true,
  "main": "./index.cjs"
}
```

Create `tooling/index.cjs`:
```js
module.exports = {};
```

- [ ] **Step 5: Re-install** so Yarn picks up the new workspaces.

Run:
```bash
yarn install
```

Expected: exits 0. `node_modules/nori-ui` symlink appears. `yarn workspaces list` lists all three workspaces.

- [ ] **Step 6: Commit**

```bash
git add packages/ apps/ tokens/ tooling/
git commit -m "chore: scaffold monorepo directory layout"
```

---

## Task 4 — Shared TypeScript configs

**Files:**
- Create: `tooling/tsconfig.base.json`
- Create: `tooling/tsconfig.library.json`
- Create: `tooling/tsconfig.test.json`
- Create: `tsconfig.json` (workspace root, references only)
- Create: `packages/ui/tsconfig.json`

- [ ] **Step 1: Create `tooling/tsconfig.base.json`.** Maximum strictness; enforces the "no any" bar from the PRD.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "useUnknownInCatchVariables": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

- [ ] **Step 2: Create `tooling/tsconfig.library.json`** for shipped library source (emits declarations in a later plan).

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Create `tooling/tsconfig.test.json`** for test files (allows Jest globals, looser on unused locals).

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

- [ ] **Step 4: Create root `tsconfig.json`** — references-only root.

```json
{
  "files": [],
  "references": [
    { "path": "./packages/ui" }
  ]
}
```

- [ ] **Step 5: Create `packages/ui/tsconfig.json`.**

```json
{
  "extends": "../../tooling/tsconfig.library.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.test.tsx"]
}
```

- [ ] **Step 6: Install TypeScript.**

Run:
```bash
yarn add -D -W typescript@^5.6.0
```

The `-W` flag scopes to the workspace root.

- [ ] **Step 7: Verify typecheck works.**

Run:
```bash
yarn workspace nori-ui typecheck
```

Expected: exits 0. `packages/ui/src/index.ts` is an empty export, so no errors.

- [ ] **Step 8: Commit**

```bash
git add tooling/ tsconfig.json packages/ui/tsconfig.json package.json yarn.lock
git commit -m "chore: add shared tsconfig (strict, no any, composite)"
```

---

## Task 5 — Biome config (primary linter + formatter)

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Install Biome.**

Run:
```bash
yarn add -D -W @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`** translating barhoppers-guide's `.prettierrc.json` + sensible lint defaults.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/build",
      "**/.next",
      "**/coverage",
      "**/.yarn",
      "**/.expo",
      "**/yarn.lock"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 4,
    "lineWidth": 120,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "arrowParentheses": "always",
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5",
      "quoteProperties": "preserve",
      "bracketSpacing": true,
      "bracketSameLine": false
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": { "recommended": true },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsole": "warn"
      },
      "nursery": {}
    }
  },
  "overrides": [
    {
      "include": ["**/*.json", "**/*.yml", "**/*.yaml", "**/*.md"],
      "formatter": { "indentWidth": 2 }
    },
    {
      "include": ["**/*.test.ts", "**/*.test.tsx"],
      "linter": {
        "rules": {
          "suspicious": { "noExplicitAny": "off", "noConsole": "off" }
        }
      }
    }
  ]
}
```

Notes:
- `noExplicitAny: error` enforces the PRD's "no `any` in library source" rule. Tests override it.
- `a11y.recommended` enables all Biome a11y rules by default.
- `useExhaustiveDependencies` + `useHookAtTopLevel` cover the core React-hooks lints (Biome's built-ins).

- [ ] **Step 3: Format the repo once so Biome owns the baseline.**

Run:
```bash
yarn biome format --write .
```

Expected: reformats JSON / MD files only (source files are empty).

- [ ] **Step 4: Verify lint is green.**

Run:
```bash
yarn biome check .
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add biome.json package.json yarn.lock
git commit -m "chore: add biome config (formatter + linter, translated from prettierrc)"
```

---

## Task 6 — ESLint flat config with react-native rules only

**Files:**
- Create: `eslint.config.mjs`

- [ ] **Step 1: Install ESLint + the RN plugin.**

Run:
```bash
yarn add -D -W eslint@^9 eslint-plugin-react-native@^4 globals@^15
```

- [ ] **Step 2: Create `eslint.config.mjs`** — flat config, RN plugin only, no formatting rules (Biome owns those), no React rules (Biome owns those).

```js
// eslint.config.mjs — this config runs ALONGSIDE Biome.
// Biome owns: formatting, JS/TS correctness, a11y, react-hooks, style.
// ESLint owns: ONLY eslint-plugin-react-native rules, because Biome has no RN-specific plugin today.
// When Biome ships RN rules, DELETE this file and remove eslint deps.

import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/.expo/**',
            '**/coverage/**',
            '**/.yarn/**',
        ],
    },
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        plugins: {
            'react-native': reactNative,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...reactNative.environments['react-native'].globals,
            },
        },
        rules: {
            // RN-specific lints that Biome does not cover yet:
            'react-native/no-unused-styles': 'error',
            'react-native/split-platform-components': 'off', // we target both platforms universally
            'react-native/no-inline-styles': 'warn',
            'react-native/no-color-literals': 'warn',
            'react-native/no-raw-text': 'off', // false positives inside Text component internals
            'react-native/no-single-element-style-arrays': 'error',
        },
    },
];
```

- [ ] **Step 3: Run ESLint to confirm it boots.**

Run:
```bash
yarn eslint .
```

Expected: exits 0 (no source files yet, so nothing to lint).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs package.json yarn.lock
git commit -m "chore: add eslint flat config with react-native rules only"
```

---

## Task 7 — Commitlint + Lefthook for Conventional Commits

**Files:**
- Create: `commitlint.config.cjs`
- Create: `lefthook.yml`

- [ ] **Step 1: Install commitlint + lefthook.**

Run:
```bash
yarn add -D -W @commitlint/cli @commitlint/config-conventional lefthook
```

- [ ] **Step 2: Create `commitlint.config.cjs`.**

```js
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'header-max-length': [2, 'always', 100],
        'body-max-line-length': [2, 'always', 120],
        'scope-case': [2, 'always', 'kebab-case'],
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'chore',
                'docs',
                'style',
                'refactor',
                'perf',
                'test',
                'build',
                'ci',
                'revert',
            ],
        ],
    },
};
```

- [ ] **Step 3: Create `lefthook.yml`.**

```yaml
# Lefthook runs git hooks. Kept small — CI is the real gate.
# pre-commit: fast checks on staged files only.
# commit-msg: enforce Conventional Commits.

pre-commit:
    parallel: true
    commands:
        biome-format:
            glob: '*.{ts,tsx,js,jsx,json,jsonc,md,yml,yaml}'
            run: yarn biome check --staged --no-errors-on-unmatched {staged_files}
        typecheck:
            glob: '*.{ts,tsx}'
            run: yarn workspace nori-ui typecheck

commit-msg:
    commands:
        commitlint:
            run: yarn commitlint --edit {1}
```

- [ ] **Step 4: Install the hooks.**

Run:
```bash
yarn lefthook install
```

Expected: `Lefthook installed` message; `.git/hooks/pre-commit` and `.git/hooks/commit-msg` are now lefthook shims.

- [ ] **Step 5: Smoke-test the commit-msg hook.**

Run a deliberately bad commit message:
```bash
git commit --allow-empty -m "bad message format"
```

Expected: lefthook blocks the commit with a commitlint error about `type-enum`. Abort.

Then run a valid one:
```bash
git commit --allow-empty -m "chore: verify commitlint hook"
```

Expected: passes. That's an empty verification commit — keep it.

- [ ] **Step 6: Commit**

```bash
git add commitlint.config.cjs lefthook.yml package.json yarn.lock
git commit -m "chore: enforce conventional commits via commitlint and lefthook"
```

---

## Task 8 — Jest base config + smoke test in packages/ui

**Files:**
- Create: `jest.config.base.cjs`
- Create: `packages/ui/jest.config.cjs`
- Create: `packages/ui/src/__tests__/smoke.test.ts`

- [ ] **Step 1: Install Jest + TS transformer.**

Run:
```bash
yarn add -D -W jest@^29 @types/jest ts-jest@^29
```

- [ ] **Step 2: Create `jest.config.base.cjs` at repo root.**

```js
/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
    },
    clearMocks: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/__tests__/**'],
};
```

Note: later plans override `testEnvironment` (`jsdom` for web tests, a RN preset for native component tests). Keeping `node` as the base because plan 1 has no DOM code.

- [ ] **Step 3: Create `packages/ui/jest.config.cjs`.**

```js
const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: 'nori-ui',
};
```

- [ ] **Step 4: Write a smoke test** so the toolchain is exercised end-to-end.

Create `packages/ui/src/__tests__/smoke.test.ts`:

```ts
describe('toolchain smoke', () => {
    it('runs jest with ts-jest against strict tsconfig', () => {
        const answer: number = 2 + 2;
        expect(answer).toBe(4);
    });

    it('rejects any in library source via type checker (compile-time)', () => {
        // This test exists so the file isn't empty. The real guarantee is tsc + biome's noExplicitAny.
        const value: unknown = 'hello';
        if (typeof value === 'string') {
            expect(value.length).toBe(5);
        }
    });
});
```

- [ ] **Step 5: Run the test.**

Run:
```bash
yarn workspace nori-ui test
```

Expected: 2 passed, 0 failed.

- [ ] **Step 6: Commit**

```bash
git add jest.config.base.cjs packages/ui/jest.config.cjs packages/ui/src/__tests__/smoke.test.ts package.json yarn.lock
git commit -m "test: add jest toolchain with smoke test in packages/ui"
```

---

## Task 9 — `size-limit` skeleton

**Files:**
- Create: `packages/ui/.size-limit.cjs`

- [ ] **Step 1: Install size-limit.**

Run:
```bash
yarn add -D -W size-limit @size-limit/preset-small-lib
```

- [ ] **Step 2: Create `packages/ui/.size-limit.cjs` with the budgets from the PRD.**

```js
// Budgets from spec §1 Success Criteria:
//   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip
//   - Each additional component: ≤ 5 KB gzip marginal cost
//   - All 11 components together: ≤ 70 KB gzip
//
// Entries will be populated in Plan 05 as components are built. Until then
// size-limit only checks the package entry, which is empty.
module.exports = [
    {
        name: 'package entry (placeholder — populated in Plan 05)',
        path: 'src/index.ts',
        limit: '500 B',
        ignore: ['react', 'react-native'],
    },
];
```

- [ ] **Step 3: Add a root script for size checking.** Update root `package.json` by appending to `scripts`:

Modify `package.json` to include:
```json
{
    "scripts": {
        "size": "yarn workspace nori-ui exec size-limit"
    }
}
```

- [ ] **Step 4: Run size-limit.**

Run:
```bash
yarn size
```

Expected: exits 0 (empty entry point is well under 500 B).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/.size-limit.cjs package.json yarn.lock
git commit -m "chore: add size-limit skeleton with spec budgets"
```

---

## Task 10 — GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`.**

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

Notes:
- `yarn install --immutable` mirrors CI-correct behavior — fails if `yarn.lock` would change.
- Each step runs independently, so a lint failure still reports typecheck/test results.
- The full Expo SDK tier matrix (current/maintained/legacy) lands in Plan 07 — Plan 01's CI is single-version because there's nothing yet to test across tiers.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add baseline workflow (lint, typecheck, test, size)"
```

---

## Task 11 — README skeleton

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`** — dual-audience (humans + LLMs) per the memory policy. Short, factual, scannable.

````markdown
# nori-ui

> **Working name.** This placeholder will be renamed before the first published release.

A React Native + React Native Web UI component library. Expo-first, New Architecture, styled with NativeWind v4, themed via Figma design tokens.

## Status

**Pre-v0.1 — under active scaffold.** See `docs/superpowers/specs/2026-04-22-nori-ui-design.md` for the full PRD and `docs/superpowers/plans/` for implementation plans.

## Quick reference

| Concern | Tool |
|---|---|
| Runtime target | Expo SDK 55 (React Native 0.83, React 19) |
| Node | >= 20 |
| Package manager | Yarn 4 (Berry), `nodeLinker: node-modules` |
| Lint / format | Biome (primary) + ESLint with `eslint-plugin-react-native` (transitional) |
| Styling | NativeWind v4 |
| Testing | Jest + `@testing-library/react-native`, Playwright (web e2e), Maestro (native e2e) |
| Docs | Fumadocs (Next.js App Router) |
| Release | `semantic-release` with npm OIDC trusted publisher |

## Developing

```bash
corepack enable
yarn install
yarn typecheck
yarn lint
yarn test
yarn size
````

## Support window

Rolling 3 Expo SDK tiers: current, maintained, legacy. Anchor: SDK 55. See `docs/superpowers/specs/` for the full policy.

## Contributing

Conventional Commits are enforced via commitlint + lefthook. Run `yarn install` once to set up hooks locally.

## License

MIT.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README skeleton"
````

---

## Task 12 — Final verification & green-build confirmation

This task has no new files. It runs the full local equivalent of CI end-to-end to prove the scaffold works.

- [ ] **Step 1: Clean install from a fresh state.**

Run:
```bash
rm -rf node_modules packages/ui/node_modules apps tokens
mkdir apps tokens
touch apps/.gitkeep tokens/.gitkeep
yarn install --immutable
```

Expected: exits 0. If `--immutable` fails, the previous steps did not commit `yarn.lock` — go back and fix.

- [ ] **Step 2: Run the full CI pipeline locally.**

Run:
```bash
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
```

Each must exit 0.

- [ ] **Step 3: Confirm commit hooks fire correctly.**

Run:
```bash
git commit --allow-empty -m "not a valid type: should fail"
```

Expected: blocked by commitlint.

Then:
```bash
git commit --allow-empty -m "chore: final foundation verification"
```

Expected: succeeds.

- [ ] **Step 4: Final commit (if any residual changes from the verification steps).**

```bash
git status
# if clean, skip. if not:
git add -A
git commit -m "chore: finalize foundation scaffold"
```

---

## Done criteria for Plan 01

- [ ] `yarn install --immutable` runs clean.
- [ ] `yarn biome check .` is green.
- [ ] `yarn eslint .` is green.
- [ ] `yarn typecheck` is green.
- [ ] `yarn test` is green (smoke test passes).
- [ ] `yarn size` is green.
- [ ] `git commit` with a non-conventional message is blocked by lefthook.
- [ ] `git commit` with a conventional message succeeds.
- [ ] The `.github/workflows/ci.yml` exists and is valid YAML.
- [ ] `README.md` renders the quick reference table.

When all boxes are ticked, Plan 01 is complete and Plan 02 can begin.

---

## Errata (post-execution notes)

Recording deviations discovered while executing the plan so that future plans avoid the same traps and anyone re-running this plan succeeds.

1. **Yarn version:** `yarn set version stable` today installs **4.14.1**, not the `4.5.0` used as a placeholder throughout this plan. `packageManager` field and `yarnPath` in `.yarnrc.yml` match whatever `yarn set version stable` actually writes — do not hard-code.
2. **`.yarn/releases/` population:** Depending on corepack state, `yarn set version stable` may not drop the binary into `.yarn/releases/`. If `.yarnrc.yml`'s `yarnPath` points nowhere, download the release manually (`curl -L -o .yarn/releases/yarn-4.14.1.cjs https://repo.yarnpkg.com/4.14.1/packages/yarnpkg-cli/bin/yarn.js`) and retry.
3. **Biome 2.x key names:** the config in Task 5 used Biome 1.x names. In Biome 2.x: top-level `files.include`/`files.ignore` becomes `files.includes` (with glob patterns), and top-level `organizeImports` moves to `assist.actions.source.organizeImports`. Pin to a specific 2.x minor (current: `~2.4.12`) to avoid future re-churn.
4. **ESLint 9 + RN plugin:** `eslint-plugin-react-native@^4` peer-requires ESLint ≤ 8. Use `eslint-plugin-react-native@^5` with ESLint 9.
5. **ESLint needs a TS parser** even when most rules are tokenized via Biome. Add `@typescript-eslint/parser` and reference it in the flat config so `.ts`/`.tsx` files don't error on `:` tokens during parse.
6. **Yarn 4 does not hoist root devDependencies onto workspace scripts' PATH.** Tools invoked via `yarn workspace <name> <script>` (typescript, jest, size-limit) must be devDependencies of that workspace. Move the following to `packages/ui/package.json` devDependencies: `typescript`, `jest`, `ts-jest`, `@types/jest`, `size-limit`, `@size-limit/preset-small-lib`.
7. **The `-W` / `--ignore-workspace-root-check` flag is Yarn 1 syntax** and does not exist in Yarn 4. Install workspace-root devDeps with plain `yarn add -D <pkg>` when at the repo root; install workspace-specific ones with `yarn workspace <name> add -D <pkg>`.
8. **Biome formatting pass applies to Markdown:** executing Task 5's `yarn biome format --write .` reformats `docs/**/*.md` (including this plan and the spec). That is expected and harmless — the 2-space override for Markdown in `biome.json` governs the result. Checkbox syntax stays `- [ ]` semantically even if a reviewer's rendering shows it collapsed.

These errata are authoritative when there's a conflict with the main plan text above.
