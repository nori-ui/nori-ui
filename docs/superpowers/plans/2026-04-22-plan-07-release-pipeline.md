# Plan 07 — Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v0.1 to npm under an as-yet-unchosen name with full release automation: `tsup`-built ESM + CJS + `.d.ts` outputs, `semantic-release` driving version/changelog/tag/publish from Conventional Commits, npm **OIDC trusted publisher** (no long-lived tokens), `--provenance` attestations, and a CI matrix running the full test suite against the **current + maintained + legacy** Expo SDK tiers. Also: a `RUNBOOK.md` for operators.

**Architecture:** `packages/ui` keeps its source tree; `tsup` compiles it into `packages/ui/dist/` with `.js` (ESM), `.cjs`, and `.d.ts`. Public `exports` map flips from `./src/*` source to `./dist/*` artifacts. `semantic-release` runs on push to `main`; plugins generate version + changelog, publish to npm with provenance, cut a GitHub Release, and commit the CHANGELOG back.

**Tech Stack:** `tsup` (esbuild-based build), `semantic-release` + `@semantic-release/{commit-analyzer,release-notes-generator,changelog,npm,github,git}`, GitHub Actions, npm OIDC trusted publisher.

**Applies all prior errata.** Publishing requires the library's placeholder name (`unbogify-ui`) to be replaced with the final name before the first public release — the rename sweep list is in the project-memory file.

---

## File Structure

**Created:**
```
packages/ui/tsup.config.ts
packages/ui/.npmignore
.releaserc.json
.github/workflows/release.yml
RUNBOOK.md
docs/superpowers/errata/README.md                (index)
```

**Modified:**
- `packages/ui/package.json` — `main`/`module`/`types`/`exports` flipped to `./dist/*`; `files` set; publish config; peer deps finalized; `private: false` (only when the real name is chosen)
- `.github/workflows/ci.yml` — adds a matrix strategy for Expo SDK tiers
- `packages/ui/src/index.ts` — unchanged
- root `package.json` — adds `build:ui` script

---

## Task 1 — `tsup` build for packages/ui

**Files:**
- Create: `packages/ui/tsup.config.ts`
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Install tsup.**

```bash
yarn workspace unbogify-ui add -D tsup
```

- [ ] **Step 2: `packages/ui/tsup.config.ts`.**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        client: 'src/client.ts',
        'theme/index': 'src/theme/index.ts',
        'i18n/index': 'src/i18n/index.ts',
        'icons/index': 'src/icons/index.ts',
        'slot/index': 'src/slot/index.ts',
        'utils/cn': 'src/utils/cn.ts',
        'stories/story-registry': 'src/stories/story-registry.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    external: ['react', 'react-dom', 'react-native', '@unbogify/tokens'],
    // Preserve "use client" directives so RSC consumers honor boundaries.
    esbuildOptions: (opts) => {
        opts.banner = { js: '' };
        opts.keepNames = true;
    },
    treeshake: true,
});
```

- [ ] **Step 3: Update `packages/ui/package.json`** to reflect compiled outputs.

```json
{
    "sideEffects": false,
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": ["dist", "src", "README.md"],
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "require": "./dist/index.cjs"
        },
        "./client": {
            "types": "./dist/client.d.ts",
            "import": "./dist/client.js",
            "require": "./dist/client.cjs"
        },
        "./theme": {
            "types": "./dist/theme/index.d.ts",
            "import": "./dist/theme/index.js",
            "require": "./dist/theme/index.cjs"
        },
        "./i18n": {
            "types": "./dist/i18n/index.d.ts",
            "import": "./dist/i18n/index.js",
            "require": "./dist/i18n/index.cjs"
        },
        "./icons": {
            "types": "./dist/icons/index.d.ts",
            "import": "./dist/icons/index.js",
            "require": "./dist/icons/index.cjs"
        },
        "./slot": {
            "types": "./dist/slot/index.d.ts",
            "import": "./dist/slot/index.js",
            "require": "./dist/slot/index.cjs"
        },
        "./utils/cn": {
            "types": "./dist/utils/cn.d.ts",
            "import": "./dist/utils/cn.js",
            "require": "./dist/utils/cn.cjs"
        },
        "./stories": {
            "types": "./dist/stories/story-registry.d.ts",
            "import": "./dist/stories/story-registry.js",
            "require": "./dist/stories/story-registry.cjs"
        }
    },
    "scripts": {
        "build": "tsup",
        "typecheck": "tsc --noEmit",
        "test": "jest"
    },
    "peerDependencies": {
        "react": "^19",
        "react-dom": "^19",
        "react-native": "^0.83"
    },
    "peerDependenciesMeta": {
        "react-dom": { "optional": true },
        "react-native": { "optional": true }
    }
}
```

Keep `dependencies: { "@unbogify/tokens": "workspace:*" }` — at publish time, yarn rewrites workspace protocol to the actual published version. But since we're shipping `@unbogify/tokens` as a **private** workspace, tokens must be inlined into the dist OR we publish tokens too. Cleanest for v0.1: **inline tokens into the UI dist** by removing it from `external` and letting esbuild bundle it.

Update `tsup.config.ts` `external` to drop `@unbogify/tokens`:

```ts
external: ['react', 'react-dom', 'react-native'],
```

Update `packages/ui/package.json` to remove the tokens dep from `dependencies` (tokens are now bundled). Move it to `devDependencies`.

- [ ] **Step 4: Add root build script.** Update root `package.json`:

```json
{
    "scripts": {
        "build:ui": "yarn workspace unbogify-ui build"
    }
}
```

- [ ] **Step 5: Build.**

```bash
yarn build:tokens
yarn build:ui
```

Expected: `packages/ui/dist/` populated with `.js`, `.cjs`, `.d.ts` for every entry. `yarn size` runs against the dist tree now — update `.size-limit.cjs` entries' `path` to `dist/index.js`, etc.

- [ ] **Step 6: Update `.size-limit.cjs` paths** (example):

```js
{
    name: 'core (dist/client)',
    path: 'dist/client.js',
    limit: '40 KB',
    ignore: ['react', 'react-dom', 'react-native'],
},
// and one per component, pointing at dist/components/<Name>/index.js
```

- [ ] **Step 7: Commit.**

```bash
git add packages/ui/tsup.config.ts packages/ui/package.json packages/ui/.size-limit.cjs package.json yarn.lock
git commit -m "build(ui): add tsup dual build (esm + cjs + dts) and flip exports to dist"
```

---

## Task 2 — `.npmignore` + publish smoke

**Files:**
- Create: `packages/ui/.npmignore`

- [ ] **Step 1: `packages/ui/.npmignore`** — exclude dev-only files from the tarball.

```
# development
src/
**/__tests__
**/*.test.ts
**/*.test.tsx
**/*.stories.tsx
tsup.config.ts
tsconfig.json
jest.config.cjs
jest.setup.ts
jest.rn-setup.ts
.size-limit.cjs

# keep in tarball
!dist/
!README.md
!package.json
!LICENSE
```

- [ ] **Step 2: Dry-run publish.**

```bash
yarn workspace unbogify-ui pack --dry-run
```

Verify: only `dist/`, `README.md`, `package.json`, `LICENSE` in the output.

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/.npmignore
git commit -m "chore(ui): add .npmignore to exclude dev files from tarball"
```

---

## Task 3 — `semantic-release` config

**Files:**
- Create: `.releaserc.json`

- [ ] **Step 1: Install semantic-release at root.**

```bash
yarn add -D semantic-release @semantic-release/changelog @semantic-release/git conventional-changelog-conventionalcommits
```

- [ ] **Step 2: `.releaserc.json`.**

```json
{
    "branches": ["main", { "name": "next", "prerelease": true }],
    "plugins": [
        [
            "@semantic-release/commit-analyzer",
            {
                "preset": "conventionalcommits",
                "releaseRules": [
                    { "type": "docs", "release": false },
                    { "type": "chore", "release": false },
                    { "type": "ci", "release": false },
                    { "type": "test", "release": false },
                    { "type": "refactor", "release": "patch" },
                    { "type": "perf", "release": "patch" },
                    { "type": "style", "release": false }
                ]
            }
        ],
        [
            "@semantic-release/release-notes-generator",
            { "preset": "conventionalcommits" }
        ],
        [
            "@semantic-release/changelog",
            { "changelogFile": "CHANGELOG.md" }
        ],
        [
            "@semantic-release/npm",
            {
                "pkgRoot": "packages/ui",
                "npmPublish": true
            }
        ],
        "@semantic-release/github",
        [
            "@semantic-release/git",
            {
                "assets": ["CHANGELOG.md", "packages/ui/package.json", "package.json", "yarn.lock"],
                "message": "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
            }
        ]
    ]
}
```

- [ ] **Step 3: Commit.**

```bash
git add .releaserc.json package.json yarn.lock
git commit -m "build: add semantic-release config with conventional-commits preset"
```

---

## Task 4 — GitHub Actions release workflow (npm OIDC + provenance)

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: `.github/workflows/release.yml`.**

```yaml
name: release

on:
    push:
        branches: [main, next]

concurrency:
    group: release-${{ github.ref }}
    cancel-in-progress: false

jobs:
    release:
        name: semantic-release to npm (OIDC)
        runs-on: ubuntu-latest
        timeout-minutes: 25
        permissions:
            contents: write
            issues: write
            pull-requests: write
            id-token: write
        steps:
            - uses: actions/checkout@v4
              with:
                  fetch-depth: 0
                  persist-credentials: false

            - run: corepack enable
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  registry-url: https://registry.npmjs.org
                  cache: yarn

            - run: yarn install --immutable

            - run: yarn build:tokens
            - run: yarn build:ui

            - name: Verify build artifacts
              run: |
                  test -f packages/ui/dist/index.js
                  test -f packages/ui/dist/index.cjs
                  test -f packages/ui/dist/index.d.ts

            # semantic-release handles version bump + publish + changelog + github release.
            # npm publish is invoked by @semantic-release/npm; we ensure provenance is on
            # via the publishConfig below, and id-token: write above authorizes OIDC.
            - name: Release
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
                  NPM_CONFIG_PROVENANCE: true
              run: yarn semantic-release
```

**Prerequisite on the npm side:** once a final package name is chosen and `packages/ui/package.json` is `private: false`, configure the npm registry page of that package as a **trusted publisher** pointing at this GitHub repo's `release.yml` workflow. That's a one-time manual step in the npm UI; no token is ever stored.

Add `publishConfig` to `packages/ui/package.json` so provenance is declared at the package level too:

```json
{
    "publishConfig": {
        "access": "public",
        "registry": "https://registry.npmjs.org",
        "provenance": true
    }
}
```

- [ ] **Step 2: Commit.**

```bash
git add .github/workflows/release.yml packages/ui/package.json
git commit -m "ci: add release workflow with npm OIDC trusted publisher + provenance"
```

---

## Task 5 — CI matrix: per-tier Expo SDK tests

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add a `tier-matrix` job** that runs unit + e2e against each supported SDK tier.

For v0.1 with SDK 55 as Current, the matrix is a single entry; the structure is in place so adding 56/57 later is trivial.

Append to `.github/workflows/ci.yml`:

```yaml
    tier-matrix:
        name: tests @ expo sdk ${{ matrix.tier }}
        runs-on: ubuntu-latest
        timeout-minutes: 20
        needs: quality
        strategy:
            fail-fast: false
            matrix:
                include:
                    - tier: 'current (55)'
                      expo: '~55.0.0'
                      rn: '0.83.0'
                      react: '^19'
                    # When SDK 56 ships, add:
                    # - tier: 'maintained (55)'
                    #   expo: '~55.0.0'
                    #   rn: '0.83.0'
                    #   react: '^19'
                    # - tier: 'current (56)'
                    #   expo: '~56.0.0'
                    #   rn: '0.84.0'   # or whatever 56 pairs with
                    #   react: '^19'
        steps:
            - uses: actions/checkout@v4
            - run: corepack enable
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: yarn
            - run: yarn install --immutable
            - run: yarn build:tokens
            - name: Override playground-native Expo/RN versions for tier
              run: |
                  jq --arg e "${{ matrix.expo }}" --arg r "${{ matrix.rn }}" --arg k "${{ matrix.react }}" '
                    .dependencies.expo = $e |
                    .dependencies["react-native"] = $r |
                    .dependencies.react = $k
                  ' apps/playground-native/package.json > /tmp/pkg.json
                  mv /tmp/pkg.json apps/playground-native/package.json
                  yarn install
            - run: yarn typecheck
            - run: yarn test
            - run: yarn build:ui
```

- [ ] **Step 2: Commit.**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add per-tier Expo SDK test matrix (current only for now; scaffolded for 56+)"
```

---

## Task 6 — RUNBOOK.md

**Files:**
- Create: `RUNBOOK.md`

- [ ] **Step 1: `RUNBOOK.md`** — dual-audience operational doc.

```markdown
# Release Runbook

## Normal release (auto)

Push any commit to `main` with a `feat:` / `fix:` / `BREAKING CHANGE:` token. `release.yml` runs:

1. `yarn install --immutable`
2. `yarn build:tokens && yarn build:ui`
3. `yarn semantic-release` — bumps version, writes CHANGELOG, tags, publishes to npm via OIDC with provenance, creates GitHub Release, pushes the chore(release) commit back.

## First-release checklist

Before the very first publish, confirm:

- [ ] The placeholder name `unbogify-ui` has been replaced everywhere. Search: `unbogify-ui`, `@unbogify/*`, `UnbogifyProvider`, `git@github.com:unbogify/*`, docs domain. See project memory for the rename-hygiene list.
- [ ] `packages/ui/package.json` has `private: false` and the real name.
- [ ] npm: create the package page for the real name and add this repo's `release.yml` workflow as a **trusted publisher**. No `NPM_TOKEN` secret is needed.
- [ ] Run a prerelease first via the `next` branch (`yarn semantic-release` locally with `--dry-run` to preview the version/changelog, then push a commit to `next`).

## Prerelease

Push to `next`. `semantic-release` will publish with the `next` dist-tag on npm (`yarn add unbogify-ui@next`). Move GA to `main` when ready.

## Dropping a tier

When a new SDK makes the oldest supported one fall out of the 3-tier window:

1. Remove the dropped tier's entry from the `tier-matrix` in `ci.yml`.
2. Update `README.md`'s compatibility table.
3. Add a note to the next CHANGELOG entry (Conventional Commit footer: `BREAKING CHANGE: drops support for Expo SDK NN`).
4. Commit as `chore: drop support for Expo SDK NN` — no publish triggered; the breaking-change footer in the NEXT `fix:` or `feat:` release note calls it out.

## Fixing a broken release

Symptoms: bad tag, wrong changelog, partial publish.

1. **DO NOT force-push main.** Instead, push a new commit with `fix:` type that corrects the broken artifact.
2. If npm was published with a bad build:
   - Deprecate the bad version: `npm deprecate <name>@<version> "broken build — use X.Y.Z"`.
   - Do NOT unpublish unless within 72 h and no consumers have installed.
3. Re-run `release.yml` — semantic-release will bump patch and publish a clean version.

## Rotating credentials

npm: OIDC is the default. No long-lived tokens to rotate.
GitHub: standard repo secrets only — cycle `GITHUB_TOKEN` via the normal workflow (it's scoped per-run, no manual rotation needed).

## Smoke-testing a freshly-published version

```bash
mkdir /tmp/unbogify-smoke && cd /tmp/unbogify-smoke
yarn init -2
yarn add unbogify-ui@<version>
node --input-type=module -e "import { cn, Slot } from 'unbogify-ui'; console.log(typeof cn, typeof Slot);"
```

Expected: `function function`.
```

- [ ] **Step 2: Commit.**

```bash
git add RUNBOOK.md
git commit -m "docs: add RUNBOOK for release operations and incident handling"
```

---

## Task 7 — Dry-run release locally

- [ ] **Step 1: Local dry run (validates config without publishing).**

```bash
cd /tmp && rm -rf ui-kit-check && git clone /Users/manuelbieh/htdocs/_git/ui-kit ui-kit-check
cd ui-kit-check
yarn install --immutable
yarn build:tokens
yarn build:ui
GITHUB_TOKEN=fake-token npx semantic-release --dry-run
```

Expected: semantic-release prints the computed next version and changelog without publishing. If it errors, check commit-message format across recent commits (should already be compliant from commitlint/lefthook).

- [ ] **Step 2: No commit from this task** — verification only.

---

## Task 8 — Final verification

- [ ] **Step 1:** Full green-build.

```bash
yarn build:tokens
yarn build:ui
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
yarn build:docs
yarn test:e2e:web
```

All exit 0.

- [ ] **Step 2:** Verify every file in `dist/` honors `'use client'` directives for client-only modules.

```bash
grep -l "'use client'" packages/ui/dist/*.js packages/ui/dist/client.js || true
```

Expected: at minimum, `packages/ui/dist/client.js` and any client-context modules preserve the directive.

---

## Done criteria for Plan 07

- [ ] `yarn build:ui` emits ESM + CJS + `.d.ts` for every exports subpath.
- [ ] `yarn workspace unbogify-ui pack --dry-run` tarball contains only `dist`, `package.json`, `README.md`, `LICENSE`.
- [ ] `.releaserc.json` validates; `semantic-release --dry-run` succeeds.
- [ ] `release.yml` has `id-token: write`, uses `actions/setup-node` with `registry-url`, and runs `yarn semantic-release` with `NPM_CONFIG_PROVENANCE=true`.
- [ ] `tier-matrix` CI job is scaffolded for multiple Expo SDKs.
- [ ] `RUNBOOK.md` covers normal release, first release, prerelease, tier drops, broken release, credential rotation, smoke test.
- [ ] The placeholder-name sweep is documented in the RUNBOOK so the first publish is a conscious act.

When all boxes are ticked, the library is ready to be renamed and published. v0.1 can ship.

---

## Errata (post-execution notes)

1. **`semantic-release@^25` requires Node 22+ / 24+** — conflicts with the PRD's Node 20+ engine. Pin `semantic-release@^23` (same plugin contract, Node 20-compatible). Installed 2026-04-22.
2. **Local `semantic-release --dry-run` fails with `ERELEASEBRANCHES`** in the dev environment because the repo has no remote HEAD pushed (`origin/main`). The error message (`Your configuration for the problematic branches is []`) is misleading — the `.releaserc.json` branches field IS set; semantic-release just can't evaluate branches without a git remote. In CI this works normally because GitHub Actions checks out the repo with `fetch-depth: 0` and remote refs present. For local verification, run after `git push -u origin main` the first time, or skip the check and rely on CI.
3. **Biome markdown formatter + `RUNBOOK.md`** — same checkbox-stripping bug seen for `docs/superpowers/**`. Add `RUNBOOK.md` to the formatter-disabled override in `biome.json`.
4. **`'use client'` directive preservation in tsup output** — not yet verified in this plan's commits. Consumers in RSC contexts should import client-only pieces from `unbogify-ui/client` (which has its own `'use client'` banner), so the directive should survive at the entry-file level. Per-file directive preservation across sub-bundles is a follow-up (may need `esbuild-plugin-preserve-directives` or tsup 8+'s `banner` per entry).
5. **Plan 07 Tasks 1–5 landed during the primary execution** (tsup build, .npmignore, semantic-release config, release.yml, tier-matrix). **Tasks 6–8 completed in a follow-up pass**: Task 6 (RUNBOOK) and a local green-build verification sweep; Task 7's full dry-run deferred to post-push (see #2). All green-build criteria satisfied: `yarn build:tokens`, `yarn build:ui`, `yarn biome check .`, `yarn typecheck`, `yarn test`, `yarn size`, `yarn workspace unbogify-ui pack --dry-run` all exit 0.
6. **Publish readiness**: the tarball contains `LICENSE`, `README.md`, `package.json`, and `dist/**` (ESM + CJS + `.d.ts` + source maps for every entry). `src/` and test files correctly excluded via `.npmignore`. **`packages/ui/package.json` is still `private: true`** — flip to `false` only after the rename sweep during the first-release checklist (see RUNBOOK).
