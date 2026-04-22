# Release Runbook

Operational doc for releasing `unbogify-ui`. Dual-audience: humans for context, LLMs for agent-driven ops.

## Normal release (fully automated)

Push any commit to `main` with a Conventional Commits token that implies a release:

- `feat: …` → minor bump
- `fix: …` → patch bump
- `feat!: …` / `BREAKING CHANGE:` footer → major bump

`.github/workflows/release.yml` runs:

1. `yarn install --immutable`
2. `yarn build:tokens && yarn build:ui`
3. Verifies `packages/ui/dist/{index.js,index.cjs,index.d.ts}` exist
4. `yarn semantic-release` — computes next version, writes `CHANGELOG.md`, commits as `chore(release): x.y.z`, tags, publishes to npm via OIDC trusted publisher with `--provenance`, creates a GitHub Release.

**No `NPM_TOKEN` secret is stored** — authentication is via OIDC configured once on npmjs.com for the specific package.

## First-release checklist

The placeholder name `unbogify-ui` is NOT ready to publish. Before the first release:

- [ ] Pick the real name. Update project memory (`feedback_package_versioning`, `project_temporary_name`) with the chosen name.
- [ ] Run the rename sweep. Replace `unbogify-ui`, `@unbogify/*`, `UnbogifyProvider`, `git@github.com:unbogify/unbogify-ui.git`, docs domain, and any class-name or semantic-key prefixes. Verify with:
    ```bash
    grep -r "unbogify" --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md' --include='*.yml' --include='*.yaml' --include='*.mdx' .
    ```
- [ ] Set `packages/ui/package.json`'s `private` to `false` (still `true` as of this commit).
- [ ] Register the real package name on npm with this repo's `release.yml` as a **trusted publisher**. Docs: <https://docs.npmjs.com/trusted-publishers>.
- [ ] Run a dry-run preview locally: `GITHUB_TOKEN=fake-token npx semantic-release --dry-run --no-ci`. Expect: "computed version X.Y.Z" printed, no publish.
- [ ] Push a commit to the `next` branch to cut a prerelease and verify the full pipeline end-to-end before GA. First real release on `next` is `@next` on npm: `npm install <name>@next`.

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
2. Update `README.md`'s compatibility table.
3. Add a `chore: drop support for Expo SDK NN` commit. This does NOT publish a new version by itself — the drop is announced in the next `feat:` / `fix:` release's `BREAKING CHANGE:` footer if it's actually breaking.

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
mkdir /tmp/unbogify-smoke && cd /tmp/unbogify-smoke
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
GITHUB_TOKEN=fake-token npx semantic-release --dry-run --no-ci
```

This prints the computed version and changelog without side effects. If `semantic-release` refuses to run because no CI environment is detected, that's the expected behavior — the check confirms the workflow auth path is correct.

## Emergency rollback

Never `npm unpublish` after the 72 h window. To revert:

1. Deprecate the bad version (see above).
2. Cherry-pick or revert the offending commit on `main`.
3. Push — semantic-release publishes the corrective patch.

Document the incident in `docs/incidents/<date>-<summary>.md` for future reference.
