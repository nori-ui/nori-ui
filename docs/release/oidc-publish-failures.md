# OIDC trusted-publishing failures — running ledger

Each entry: SHA → symptom → root cause → fix → followed-up check. Append new ones at the bottom; don't rewrite history.

## Why this exists

Multiple `release.yml` runs failed in a row with confusingly different errors that were all rooted in the same handful of mistakes. This file is the cheat sheet for "don't do that again." Updated whenever a new failure mode shows up.

## Standing rules learned

1. **Never pass `registry-url` to `actions/setup-node`** when publishing via OIDC. It writes `.npmrc` containing `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`. With `NODE_AUTH_TOKEN` unset (the point of OIDC), npm sees an empty token and skips the OIDC handshake.
2. **`publishConfig.registry` MUST end with `/`.** `@semantic-release/npm`'s OIDC gate is a strict-equality string compare against `"https://registry.npmjs.org/"` (with trailing slash). One missing slash → no OIDC → falls back to token auth → `ENONPMTOKEN`.
3. **npm 11.5.1+ is required for OIDC trusted publishing.** Node 22 ships npm 10.x → won't work. Node 24 ships npm 11.x → works. Either bump Node or `npm install -g npm@latest` after `setup-node`.
4. **`${{ env.X }}` workflow expressions don't see runtime env vars** the runner sets (`ACTIONS_ID_TOKEN_REQUEST_URL`, `ACTIONS_ID_TOKEN_REQUEST_TOKEN`, etc.). Read those from the shell with `$X`, never via expression context.
5. **YAML step `name:` values containing `:` MUST be quoted** — bare `name: Substitute workspace: protocol` parses as a nested mapping and fails the workflow file at parse time (no jobs spawned, generic "failure" with empty `jobs[]`).
6. **`@semantic-release/npm`'s `npm version` walks workspaces.** Once it finds a `workspaces` field in the root `package.json`, it parses every workspace's `package.json`. Yarn-only protocols (`workspace:`, `patch:`, `portal:`, `link:`) anywhere in the tree make `npm version` fail with `EUNSUPPORTEDPROTOCOL`. Either drop the root `workspaces` field on the runner OR rewrite every Yarn-only spec to `*` before semantic-release runs.

## Failures

### 1 · `9f397bd` (drop registry-url)

- **Symptom:** "OIDC ID-token request URL is missing — id-token: write is not granted"
- **Root cause:** my "verify OIDC prerequisites" step was reading `${{ env.ACTIONS_ID_TOKEN_REQUEST_URL }}` (workflow-expression context). That context is **not** populated with runtime env vars set by the runner; it only sees `env:` blocks declared in the YAML. The OIDC URL **was** present in the runtime env — my probe just couldn't see it.
- **Fix:** read `$ACTIONS_ID_TOKEN_REQUEST_URL` directly in bash. Commit `6bb1bee`.
- **Rule learned:** see standing rule #4.

### 2 · `6bb1bee` (read OIDC env in shell)

- **Symptom:** `ENONPMTOKEN No npm token specified.` from `@semantic-release/npm/lib/set-npmrc-auth.js:36`. No "Verifying OIDC context for publishing from GitHub Actions" log line — the OIDC code path was **never entered**.
- **Root cause:** `oidcContextEstablished()` checks `OFFICIAL_REGISTRY === registry`. `OFFICIAL_REGISTRY` is the literal string `"https://registry.npmjs.org/"` (trailing slash). Our `publishConfig.registry` was `"https://registry.npmjs.org"` (no trailing slash). Strict-equal fails → OIDC short-circuits → falls through to token auth.
- **Fix:** add the trailing slash in `packages/{core,mcp}/package.json`. Commit `abe4f05`.
- **Rule learned:** see standing rule #2. **NEVER assume URL strings normalise.**

### 3 · `abe4f05` (trailing-slash on publishConfig.registry)

- **Symptom:** OIDC handshake succeeded (logs: `OIDC token exchange with the npm registry succeeded`), but then `npm version 1.0.0` failed:
  ```
  npm error code EUNSUPPORTEDPROTOCOL
  npm error Unsupported URL Type "workspace:": workspace:*
  ```
- **Root cause:** `@semantic-release/npm` runs `npm version` in `pkgRoot` (`packages/core`). npm 11 walks up to the root `package.json`, sees `workspaces`, validates every member's `package.json`, and rejects the first Yarn-only protocol it finds. `packages/core` had `"@nori-ui/tokens": "workspace:*"`.
- **Fix (initial):** workflow step rewriting `workspace:*` → `*` in `packages/{core,mcp}/package.json`. Commit `af80df1`.
- **Outcome:** insufficient — see #4 and #5.

### 4 · `af80df1` (substitute step, intended)

- **Symptom:** workflow showed `failure` but `jobs: []` and `run_started_at == updated_at` — never actually started.
- **Root cause:** YAML parse error. My new step's `name: Substitute workspace: protocol in publishable packages` had an unquoted colon after `workspace`, which YAML parsed as a nested mapping → invalid step → workflow rejected at parse time.
- **Fix:** quote the step name (`name: "Substitute workspace: protocol …"`). Commit `fe8ab94`.
- **Rule learned:** see standing rule #5. **Always validate workflow YAML locally with `js-yaml.load()` before pushing.**

### 5 · `fe8ab94` (substitute step, parsing)

- **Symptom:** Same `EUNSUPPORTEDPROTOCOL: workspace:*` error as #3, even though my substitute step ran and logged `rewrote packages/core/package.json devDependencies.@nori-ui/tokens : workspace:* → *`.
- **Root cause:** rewriting only the publishable packages wasn't enough — npm walks every workspace in the root `workspaces` glob (`packages/*`, `apps/*`, `tooling`). The first **other** workspace's `workspace:*` (e.g., `apps/docs`) re-triggered the error.
- **Fix:** rewrite every `package.json` under the repo (recursive walk, skip `node_modules` and dotfolders). Commit `5d317dc`.
- **Rule learned:** see standing rule #6 (first half).

### 6 · `5d317dc` (rewrite all package.json)

- **Symptom:** `EUNSUPPORTEDPROTOCOL` again, this time on a `patch:` spec:
  ```
  npm error Unsupported URL Type "patch:": patch:fumadocs-ui@npm%3A14.0.0#~/.yarn/patches/…
  ```
- **Root cause:** I only rewrote `workspace:` specs. `patch:` (Yarn 4 patches) is also a Yarn-only protocol, also rejected by npm. Used in `apps/docs` for fumadocs.
- **Fix:** broaden the regex to all Yarn-only protocols (`/^(workspace|patch|portal|link):/`) AND drop the root `workspaces` field on the runner so npm stops walking. Belt-and-braces because dropping `workspaces` ought to be enough on its own. Commit `dca8f63`.
- **Rule learned:** see standing rule #6 (full).

## Observations / future hardening

- The workflow now has a **"Verify OIDC publish prerequisites"** step that fails LOUDLY if any of these regress: npm too old, no `id-token: write`, stale `_authToken` in `.npmrc`. **DO NOT REMOVE.**
- If `@semantic-release/npm` ever bumps and changes its OIDC code, re-read `lib/verify-auth.js` and `lib/trusted-publishing/oidc-context.js` to confirm the URL-equality check semantics. The strict `===` against `OFFICIAL_REGISTRY` (with trailing slash) is brittle.
- Consider replacing the two-step "drop workspaces + rewrite specs" hack with a single proper publish path (e.g., `yarn npm publish`, `@sebbo2002/semantic-release-yarn`, or an explicit `npm pack` + `npm publish <tarball>` flow). The current setup is fragile and silently drifts as Yarn protocols evolve.

### 7 · `dca8f63` (drop root workspaces)

- **Symptom:** OIDC handshake succeeded, `npm version` succeeded, build succeeded — then `npm publish` failed with HTTP 422:
  ```
  Error verifying sigstore provenance bundle: Unsupported GitHub Actions
  source repository visibility: "private". Only public source
  repositories are supported when publishing with provenance.
  ```
- **Root cause:** OIDC trusted publishing works on private repos; **npm provenance does not**. Provenance attestations require the source repo to be public so consumers can independently verify the build trail. Our repo is private, so the `--provenance` flag (set via `NPM_CONFIG_PROVENANCE=true` and `publishConfig.provenance: true`) made npm reject the upload at the registry.
- **Fix:** disable provenance — set `NPM_CONFIG_PROVENANCE=false` in the workflow and remove `provenance: true` from `publishConfig`. Re-enable when the repo is made public. Commit `<TBD>`.
- **Rule learned:** **`OIDC ≠ provenance`.** Two independent features. OIDC = "who is allowed to publish" (works on private repos). Provenance = "this build is attested" (requires public repo). When `id-token: write` is granted, npm publish runs OIDC trusted publishing automatically; provenance is the extra opt-in.

## Updated standing rule

7. **Provenance only works on public repos.** With a private repo, set `NPM_CONFIG_PROVENANCE=false` and omit `publishConfig.provenance`. OIDC trusted publishing remains active.

### 8 · `387e556` (disable provenance)

- **Symptom:** `yarn install --immutable` failed at the very start of the workflow:
  ```
  YN0028: The lockfile would have been modified by this install, which is explicitly forbidden.
  ```
- **Root cause:** **A previous CI run (`dca8f63`) committed my runner-only mutations back to `main`.** The `chore(release): 1.0.0` commit that semantic-release pushed contained the modified root `package.json` (with `workspaces` field stripped) because `@semantic-release/git`'s `assets` list included `package.json` and `yarn.lock`. Subsequent runs saw a root manifest with no `workspaces` field, drift between manifest and lockfile, and immutable-install rejected it.
- **Fix:**
  1. Restore the `workspaces` field in committed root `package.json`.
  2. Re-run `yarn install` to refresh `yarn.lock` (regenerated 14k+ lines that had been wiped).
  3. Remove `package.json` and `yarn.lock` from `.releaserc.json` `@semantic-release/git` `assets` — semantic-release MUST NOT commit either file. We don't bump the root version anyway; only `packages/{core,mcp}/package.json` need to be committed by it.
- **Rule learned:** see new standing rule #8 below.

## Updated standing rules

8. **`@semantic-release/git`'s `assets` list is the only thing semantic-release will commit.** Anything in there is at risk of capturing accidental runner-side mutations. Keep it minimal: `CHANGELOG.md` + the `package.json` files of the actually-published packages. Never include the root `package.json`, `yarn.lock`, or any file modified by CI prep steps.
9. **Runner-only mutations to the working tree must NEVER end up in a commit semantic-release pushes.** Audit every workflow step that writes to a tracked file: confirm it's outside `.releaserc.json` `assets` AND outside any glob that semantic-release evaluates.

### ✅ `f7b654e` — first successful publish

After 7 failed attempts (each with a distinct root cause, see #1-#8 above), `f7b654e` published cleanly:

- `@nori-ui/core@1.0.1` and `@nori-ui/mcp@1.0.1` on npm
- Tag `v1.0.1` on GitHub, GitHub release created
- semantic-release pushed `chore(release): 1.0.1` (commit `e228725`) — and this time it ONLY touched `CHANGELOG.md` + `packages/{core,mcp}/package.json` (the trimmed assets list held).

The full chain that had to be right, end to end:
1. **`actions/setup-node`** WITHOUT `registry-url` (else `.npmrc` poisons OIDC).
2. **Node 24** for npm 11.5.1+ (OIDC support).
3. **OIDC env vars read from shell**, not workflow expressions.
4. **`publishConfig.registry` ends with `/`** (strict-equality gate in `@semantic-release/npm`).
5. **`workspaces` field stripped from root `package.json` on the runner** (so npm doesn't walk).
6. **All Yarn-only protocols (`workspace:`, `patch:`, `portal:`, `link:`) rewritten in publishable packages** on the runner.
7. **`NPM_CONFIG_PROVENANCE=false`** because the repo is private.
8. **`@semantic-release/git` `assets` trimmed** to `CHANGELOG.md` + the published packages' `package.json` only — never root, never lockfile.
9. **Workflow YAML step names with colons quoted** so the file parses.

Re-enable provenance once the repo is made public.

## Post-mortem: 0.0.5 → 1.0.0 → 1.0.1 (unwanted major bump)

**What happened:** earlier commits had used `feat(x)!:` / `refactor(x)!:` to mark internal API consolidations during pre-release work. semantic-release's default conventional-commits preset interprets `!` as `release: "major"`, so it bumped 0.0.5 → 1.0.0 on the first release attempt. The 1.0.0 publish itself failed (the provenance-on-private-repo issue, see #7 above), but the `v1.0.0` tag + `chore(release): 1.0.0` commit were written before the publish step. The next successful run saw the existing tag, computed the next version → 1.0.1, and that's what's on npm.

**Why it's a problem:** the project is **pre-public-launch with zero consumers**. There are no semver-protected consumers, so there are no "breaking changes" in the consumer-protection sense. The first published version was supposed to be a deliberate `1.0.0`, decided by the user — not automatically jumped to by CI on internal refactors.

**Fix:** added an override at the front of `.releaserc.json` `releaseRules`:
```json
{ "breaking": true, "release": "patch" }
```
This overrides the conventional-commits preset's `{ breaking: true, release: "major" }` default. From now until the user explicitly says "we're going 1.0.0":
- `feat!:` → patch
- `BREAKING CHANGE:` footer → patch
- `feat:` → patch (everything is patch)
- only `feat:` / `fix:` / `perf:` / `refactor:` produce a release at all (per existing rules)

**Standing rule #10:** while a project is pre-public-launch, configure semantic-release so NO commit pattern can auto-bump major. Manual major bumps only, decided by the user. See also memory: `feedback_pre_release_no_major_bumps.md`.
