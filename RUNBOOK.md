# Release Runbook

Operational doc for releasing `nori-ui`. Dual-audience: humans for context, LLMs for agent-driven ops.

## Normal release (fully automated)

Push a commit to `main` with a Conventional Commits type that implies a release. The rules are in `.releaserc.json`:

| Commit | Release |
|---|---|
| `feat: …` | minor bump |
| `fix: …`, `perf: …`, `refactor: …` | patch bump |
| `feat!: …`, any `!` type, or a `BREAKING CHANGE:` footer | **patch** bump (see below) |
| `docs:`, `chore:`, `ci:`, `test:`, `style:` | no release |

**Breaking changes do not produce a major bump.** `.releaserc.json` maps `{ "breaking": true }` to `patch` on purpose: the library is pre-public-launch and majors are cut by hand only. To release a major version, change that rule deliberately for the release in question.

`.github/workflows/release.yml` runs on every push to `main` and `next`:

1. `yarn install --immutable` (Node 24, which ships an npm new enough for OIDC trusted publishing).
2. Verifies the OIDC prerequisites: npm >= 11.5.1, the OIDC token request URL is present, no `_authToken` in any `.npmrc`.
3. `yarn build:tokens`
4. `yarn build:ui`, which runs `tsup`, then `tsc -p tsconfig.dts.json` for the declarations, then `scripts/finalize-dist.mjs`. The finalize script restores the `'use client'` directives that the bundler drops and copies the Tailwind preset and `theme.css` from `packages/tokens/build` into `packages/core/dist`.
5. `node apps/docs/scripts/generate-mcp-data.mjs` snapshots the docs corpus, then `yarn workspace @nori-ui/mcp build` builds the MCP package with that corpus embedded.
6. On the runner only (never committed): removes the root `workspaces` field and rewrites Yarn-only dependency protocols (`workspace:`, `patch:`, `portal:`, `link:`) in the `core` and `mcp` `package.json` files to `*`, so npm can parse them.
7. Verifies `packages/core/dist/{index.js,index.cjs,index.d.ts}` and `packages/mcp/dist/{cli.js,index.js,index.d.ts}` exist.
8. Detects whether the MCP inputs changed since the last tag (`packages/mcp`, `apps/docs/content/docs`, `apps/docs/scripts/generate-mcp-data.mjs`).
9. `yarn semantic-release` computes the next version, writes `CHANGELOG.md`, bumps the version in both `packages/core/package.json` and `packages/mcp/package.json`, publishes `@nori-ui/core` to npm via OIDC trusted publishing, creates a GitHub Release, and commits `chore(release): x.y.z` with the tag.
10. Publishes `@nori-ui/mcp` with `npm publish`, only if a release was cut in step 9 **and** step 8 found changed MCP inputs. `@nori-ui/mcp` always carries the same version number as `@nori-ui/core`, but a version is only published when its content changed, so some versions do not exist on npm for `@nori-ui/mcp`.

**No `NPM_TOKEN` secret is stored.** Authentication is via OIDC trusted publishing, configured on npmjs.com for each published package (`@nori-ui/core` and `@nori-ui/mcp`).

**Provenance is off.** The workflow sets `NPM_CONFIG_PROVENANCE: "false"` for both publish steps, because npm rejects provenance attestations from a private source repository. Set it to `"true"` in `release.yml` once the repository is public.

`@nori-ui/plugin` and `@nori-ui/tailwindcss-stub` are not published by this workflow.

## First-release checklist (historical)

The first release is done; `@nori-ui/core` has been publishing from this workflow since. The checklist is kept as a reference for adding another published package:

- The package's `package.json` must not have `"private": true`, and needs `publishConfig.access: "public"`.
- Register the package on npmjs.com with this repo's `release.yml` as a **trusted publisher**. Docs: <https://docs.npmjs.com/trusted-publishers>.
- Add the package to `.releaserc.json` (an `@semantic-release/npm` entry with its `pkgRoot`, and its `package.json` in the `@semantic-release/git` assets) and to the protocol-rewrite and artifact-verification steps in `release.yml`.
- Run a local dry run first (see [Local dry run](#local-dry-run)).
- Push to the `next` branch to cut a prerelease and verify the pipeline end to end.

## Prerelease channel

Push to `next`. `semantic-release` publishes with the `next` dist-tag:

```bash
npm install <package>@next
```

When ready for GA, fast-forward `main` to `next`'s HEAD.

## Per-tier test matrix

`.github/workflows/ci.yml` runs a `tier-matrix` job structured for three Expo SDK tiers (current / maintained / legacy). Currently only `current (55)` is active. When SDK 56 ships:

1. Add an entry for `maintained (55)` to the matrix.
2. Add an entry for `current (56)` to the matrix (update `expo`, `rn`, `react` versions).
3. The job runs the full unit + build suite against each tier.

When SDK 57 ships, rotate: 55 becomes legacy, 56 maintained, 57 current. Drop 55 fully once 58 ships.

## Dropping a tier

When a new SDK makes the oldest supported one fall out of the 3-tier window:

1. Remove the dropped tier's entry from `.github/workflows/ci.yml`'s `tier-matrix` strategy.
2. Update the supported-versions statements: the "Quick reference" table and "Support window" section in `README.md`, and the supported versions line in `apps/docs/content/docs/getting-started.mdx`. (There is no separate compatibility table.)
3. Add a `chore: drop support for Expo SDK NN` commit. This does NOT publish a new version by itself — the drop is announced in the next `feat:` / `fix:` release's `BREAKING CHANGE:` footer if it's actually breaking. Note that the footer alone yields a patch bump (see the release rules above).

## Fixing a broken release

Symptoms: bad tag, wrong changelog, partial npm publish.

1. **Never force-push `main`.** Add a `fix:` commit with the corrective change.
2. If npm got a bad build:
    - Deprecate: `npm deprecate <name>@<version> "broken build — use ≥ X.Y.Z"`
    - Do NOT unpublish after 72 h.
3. Re-run `release.yml` — semantic-release bumps a patch and publishes a clean version.

## Credential rotation

- **npm**: OIDC trusted-publisher flow. Nothing to rotate. If a stored `NPM_TOKEN` somehow gets added for an emergency, revoke it on npmjs.com immediately after use.
- **GitHub**: `GITHUB_TOKEN` is scoped per-run; no manual rotation.
- **Never** commit `.env`, `.npmrc` with creds, or SSH keys.

## Smoke-testing a freshly published version

```bash
mkdir /tmp/nori-ui-smoke && cd /tmp/nori-ui-smoke
yarn init -2
yarn add <package>@<version>
node --input-type=module -e "import { cn, Slot } from '<package>'; console.log(typeof cn, typeof Slot);"
# expected: function function
```

For a full smoke, render a Button in a local Expo or Vite app.

## Local dry run

Before pushing anything that might trigger a release:

```bash
yarn build:tokens
yarn build:ui
yarn workspace @nori-ui/mcp build
GITHUB_TOKEN=fake-token npx semantic-release --dry-run --no-ci
```

This prints the computed version and changelog without side effects. If `semantic-release` refuses to run because no CI environment is detected, that's the expected behavior — the check confirms the workflow auth path is correct.

## Emergency rollback

Never `npm unpublish` after the 72 h window. To revert:

1. Deprecate the bad version (see above).
2. Cherry-pick or revert the offending commit on `main`.
3. Push — semantic-release publishes the corrective patch.

Document the incident in `docs/incidents/<date>-<summary>.md` for future reference.
