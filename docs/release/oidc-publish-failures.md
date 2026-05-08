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
