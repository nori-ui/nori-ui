# Spec B — Docs URL Flattening + Universal Links

**Date:** 2026-04-28
**Scope:** `apps/docs/`
**Status:** Draft — pending user review
**Companion spec:** [Spec A — Playground Showcase Rebuild](2026-04-28-playground-showcase-design.md)

## Goal

Two related changes to the docs app, ordered for minimal user-facing churn:

1. **Flatten docs URLs** from category-prefixed (`/docs/controls/toggle`) to component-only (`/docs/components/toggle`). Categories survive as front-matter metadata used only for sidebar grouping. Old URLs 301 to new ones.
2. **Add iOS Universal Links** that route `https://nori-ui.com/components/<slug>` into the playground app via Apple App Site Association, with a graceful web fallback that 302s to the canonical docs page when the app isn't installed.

This produces the public URL surface that "Open in app" buttons, QR codes, and shared links can rely on regardless of where they're tapped.

## Non-goals

- Playground app changes — covered in Spec A.
- Android App Links (intent-filter + Digital Asset Links) — deferred; iOS-first.
- Provisioning the `dev.noriui.playground` bundle in App Store Connect — outside this spec. Team ID (`KBWBVNAUNV`, shared with `barhoppers-guide`) and bundle ID are known and baked into the AASA file from day one.
- Legacy redirects from third-party deep links not under our control — only own-domain old paths get 301 rules.
- Sitemap and robots.txt rewrites — covered if affected, but not the focus.

## URL space (canonical reference)

| URL | Audience | Behavior |
|---|---|---|
| `https://nori-ui.com/docs/components/<slug>` | Web docs | Canonical fumadocs page, full content, indexable |
| `https://nori-ui.com/docs/controls/<slug>` (and other old category paths) | Legacy | 301 → `/docs/components/<slug>` |
| `https://nori-ui.com/components/<slug>` | Universal Link target | iOS w/ app installed → opens `nori-ui://components/<slug>`. Else → 302 to `/docs/components/<slug>` |
| `nori-ui://components/<slug>` | Direct scheme | App only (Spec A handles routing) |

The `/components/<slug>` URL is the **public canonical "share this component"** form. It's deliberately separate from the docs URL so that AASA-scoped path matching doesn't hijack docs traffic from search engines or external links.

## Docs URL flattening

### File migration

For every MDX file under `content/docs/<category>/<slug>.mdx`:

1. Move to `content/docs/components/<slug>.mdx`.
2. Add `category: <category>` to its front-matter, preserving the original folder name as metadata (`controls`, `display`, `feedback`, `inputs`, `misc`, `navigation`, `overlays`, `primitives`).
3. Leave the rest of the front-matter untouched (`title`, `description`, `since`, `tags`, `platform`).

Affected files (full inventory; matches `meta.json`):

```
controls/button.mdx              → components/button.mdx
controls/checkbox.mdx            → components/checkbox.mdx
controls/radio-group.mdx         → components/radio-group.mdx
controls/segmented-control.mdx   → components/segmented-control.mdx
controls/switch.mdx              → components/switch.mdx
controls/toggle-group.mdx        → components/toggle-group.mdx
controls/toggle.mdx              → components/toggle.mdx
display/accordion.mdx            → components/accordion.mdx
display/avatar.mdx               → components/avatar.mdx
display/badge.mdx                → components/badge.mdx
display/card.mdx                 → components/card.mdx
feedback/alert.mdx               → components/alert.mdx
feedback/progress.mdx            → components/progress.mdx
feedback/skeleton.mdx            → components/skeleton.mdx
feedback/spinner.mdx             → components/spinner.mdx
feedback/toast.mdx               → components/toast.mdx
inputs/input-group.mdx           → components/input-group.mdx
inputs/select.mdx                → components/select.mdx
inputs/slider.mdx                → components/slider.mdx
inputs/text-area.mdx             → components/text-area.mdx
inputs/text-input.mdx            → components/text-input.mdx
misc/icon.mdx                    → components/icon.mdx
navigation/tabs.mdx              → components/tabs.mdx
overlays/alert-dialog.mdx        → components/alert-dialog.mdx
overlays/dialog.mdx              → components/dialog.mdx
overlays/popover.mdx             → components/popover.mdx
overlays/tooltip.mdx             → components/tooltip.mdx
primitives/box.mdx               → components/box.mdx
primitives/hstack.mdx            → components/hstack.mdx
primitives/separator.mdx         → components/separator.mdx
primitives/text.mdx              → components/text.mdx
primitives/vstack.mdx            → components/vstack.mdx
```

Note: actual files in `content/docs/` may differ slightly from `meta.json` (a couple of components might be referenced in `meta.json` but not yet have MDX, or vice versa). Implementation enumerates the filesystem, not the meta file, and `meta.json` is regenerated from the source of truth.

### Sidebar grouping via front-matter

`content/docs/meta.json` currently lists `pages` as `<category>/<slug>` paths and uses `---Section---` separator entries to render group headers. After flattening, two structural options:

1. **Keep `meta.json`-driven grouping** — Update `pages` to use `components/<slug>` paths but keep `---Controls---`, `---Display---`, etc. dividers in the same positions. Simplest, no fumadocs config change.
2. **Front-matter-driven auto grouping** — Read `category` from each MDX's front-matter and render sidebar groups dynamically. Requires fumadocs custom layout work.

**Recommendation:** Option 1. `meta.json` already handles this and Option 2 introduces fumadocs surface-area we don't need to touch yet. The `category` front-matter field is added anyway so a future migration to Option 2 is mechanical.

New `meta.json` shape (illustrative, full list in implementation):

```json
{
  "title": "nori-ui",
  "pages": [
    "index",
    "getting-started",
    "theming",
    "---Controls---",
    "components/button",
    "components/checkbox",
    "components/radio-group",
    "components/segmented-control",
    "components/switch",
    "components/toggle",
    "components/toggle-group",
    "---Display---",
    "components/accordion",
    "components/avatar",
    "components/badge",
    "components/card",
    "...",
    "---Project---",
    "changelog"
  ]
}
```

Section ordering preserved exactly as today.

### 301 redirects

Add to `apps/docs/next.config.mjs`:

```js
async redirects() {
    return [
        { source: '/docs/controls/button',           destination: '/docs/components/button',           permanent: true },
        { source: '/docs/controls/checkbox',         destination: '/docs/components/checkbox',         permanent: true },
        // … one entry per moved file
    ];
}
```

Generation strategy: a tiny build-time script (`apps/docs/scripts/build-redirects.mjs`) reads `content/docs/components/*.mdx`, extracts each MDX's `category` front-matter, and emits the redirect map. Imported by `next.config.mjs` so the redirect list stays in lockstep with the file moves automatically.

If a redirect-emit script feels heavy, the alternative is a static hand-written list in `next.config.mjs` (~30 entries). Either works. Build-time generation is the safer long-term choice because adding a new component or moving it across categories is a no-op.

### Source-format URL middleware

`apps/docs/middleware.ts` rewrites `.md` and `.json` source URLs onto a single API route. Its matcher is `/docs/:path*`, which already covers both old and new paths — no change required. Verify after migration that `/docs/components/button.md` and `/docs/components/button.json` still resolve.

### Internal links inside MDX

Some MDX files reference other components via inline links: `[Toggle](/docs/controls/toggle)`. After flattening these should target the new path. Implementation grep + rewrites all `/docs/<category>/<slug>` link targets inside `content/docs/**/*.mdx` to `/docs/components/<slug>`.

## Universal Links

### `/components/<slug>` web route

New file: `apps/docs/app/components/[slug]/page.tsx`

```tsx
import { redirect, notFound } from 'next/navigation';
import { isKnownComponentSlug } from '@/lib/component-slugs';

type Params = { slug: string };

export default async function Page({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    if (!isKnownComponentSlug(slug)) {
        notFound();
    }
    redirect(`/docs/components/${slug}`);
}
```

`isKnownComponentSlug` reads from a generated slug list (or directly from the fumadocs source) — same source of truth as the redirect generator. Unknown slug → 404, not a redirect to a non-existent docs page.

This route is what `https://nori-ui.com/components/<slug>` resolves to on the web. iOS Universal Links never reach it when the app is installed (Apple intercepts before network); web users get the 302 to canonical docs.

### Apple App Site Association file

File: `apps/docs/public/.well-known/apple-app-site-association`

**No file extension.** JSON content. Apple is strict about both the path and the `Content-Type: application/json` response header.

```json
{
    "applinks": {
        "details": [
            {
                "appIDs": ["KBWBVNAUNV.dev.noriui.playground"],
                "components": [
                    { "/": "/components/*", "comment": "Component detail (deep link to playground app)" },
                    { "/": "/", "comment": "Home" }
                ]
            }
        ]
    }
}
```

`KBWBVNAUNV` is the Apple Team ID (same team as `barhoppers-guide`, sourced from `barhoppers-guide/packages/app/eas.json`). `dev.noriui.playground` matches `apps/playground-native/app.json`'s `ios.bundleIdentifier`. A short README at `apps/docs/public/.well-known/README.md` documents the lineage so future contributors don't have to dig.

### Vercel content-type header

`apps/docs/vercel.json` — add a header rule:

```json
{
    "headers": [
        {
            "source": "/.well-known/apple-app-site-association",
            "headers": [{ "key": "Content-Type", "value": "application/json" }]
        }
    ]
}
```

Apple's CDN cache will reject the file silently if served with `text/html` or no content type. Confirmed by `curl -I https://nori-ui.com/.well-known/apple-app-site-association` after deploy.

### `/.well-known/` middleware bypass

`apps/docs/middleware.ts` matcher (`/docs/:path*`) doesn't intercept `/.well-known/*`, so no change needed. Spec verifies this via a test or post-deploy curl.

## Slug consistency between specs

Both specs assume the slug list comes from a single ground truth. Two candidates:

1. **Filesystem of `content/docs/components/*.mdx`** — list lives in one place, but only after Spec B lands.
2. **`packages/core/src/stories/story-registry.tsx`** `components` array — lives in one place, lands with Spec A, accessible from anywhere via the `@nori-ui/core` package.

**Recommendation:** the filesystem is canonical for docs (Spec B). The story registry is canonical for the playground (Spec A). They are independently maintained but must agree.

A small parity test runs in CI:

- `apps/docs/__tests__/component-slug-parity.test.ts` reads the filesystem list and the imported `components` from `@nori-ui/core/stories`. Asserts the two slug sets match. Failures point to either an MDX file without a story or a story without a docs page.

This test ships as part of Spec B (it's the docs-side enforcement). Spec A doesn't depend on it.

## File-by-file changes

| Path | Action | Notes |
|---|---|---|
| `apps/docs/content/docs/<cat>/<slug>.mdx` (×30+) | Move to `apps/docs/content/docs/components/<slug>.mdx`, add `category` front-matter | Preserve commit history with `git mv` |
| `apps/docs/content/docs/<cat>/` (now-empty dirs) | Delete | After all files moved |
| `apps/docs/content/docs/meta.json` | Update `pages` array to `components/<slug>` paths, preserve `---Section---` dividers | |
| `apps/docs/content/docs/**/*.mdx` (inline link rewrites) | Sed/script: replace `/docs/<cat>/<slug>` link targets with `/docs/components/<slug>` | grep first to confirm scope |
| `apps/docs/scripts/build-redirects.mjs` | Create | Reads MDX, emits redirect map |
| `apps/docs/next.config.mjs` | Update | Import generated redirects, add `redirects()` async function |
| `apps/docs/app/components/[slug]/page.tsx` | Create | Universal-Link landing → 302 docs |
| `apps/docs/lib/component-slugs.ts` | Create | Read fumadocs source, export `componentSlugs: string[]` and `isKnownComponentSlug` |
| `apps/docs/public/.well-known/apple-app-site-association` | Create | JSON, no extension |
| `apps/docs/public/.well-known/README.md` | Create | Documents `KBWBVNAUNV.dev.noriui.playground` lineage |
| `apps/docs/vercel.json` | Update | Add Content-Type header rule for AASA |
| `apps/docs/__tests__/component-slug-parity.test.ts` | Create | Parity vs `@nori-ui/core` `components` |
| `apps/docs/__tests__/redirects.test.ts` | Create | Smoke: each old path appears in the redirect map |

## Testing

- **Build:** `pnpm --filter docs build` succeeds with no MDX resolution errors and the redirect list is non-empty.
- **Type check:** `pnpm --filter docs typecheck` passes.
- **Unit:** Slug parity test, redirects smoke test.
- **Local nav:** Dev server: every `meta.json` entry resolves, sidebar grouping renders identical visual structure.
- **Redirect smoke:** `curl -I http://localhost:3000/docs/controls/button` returns `301` with `Location: /docs/components/button`.
- **Universal Link landing:** `curl -I http://localhost:3000/components/button` returns `302` to `/docs/components/button`. Unknown slug returns `404`.
- **AASA:** After deploy, `curl -I https://nori-ui.com/.well-known/apple-app-site-association` returns 200 with `Content-Type: application/json` and a valid JSON body. Apple's domain validation can be checked via `https://app-site-association.cdn-apple.com/a/v1/nori-ui.com` (Apple's CDN — populates within minutes of correct serving).
- **Inline-link rewrites:** Grep `content/docs` for any remaining `/docs/(controls|display|feedback|inputs|misc|navigation|overlays|primitives)/` link targets — should return zero matches after migration.

## Risks and mitigations

- **SEO loss during 301 propagation.** Search engines treat 301s as link-equity-preserving. Real-world impact is small, but to minimise drop, ship redirects in the same deploy as the file moves. Don't move files without redirects.
- **Stale external links.** Anything we don't control (community posts, README references in other repos) hits the 301. Functionally fine.
- **Fumadocs source resolution.** Fumadocs reads `meta.json` and the file tree. If the catch-all route at `app/docs/[[...slug]]/page.tsx` doesn't tolerate the new structure, dev server fails. Mitigation: dev server smoke test as the first verification in implementation.
- **AASA caching by Apple.** Apple caches AASA aggressively (~48h). A bad first deploy can be sticky. Mitigation: verify with `curl` immediately after deploy, before testing Universal Links on a real device.
- **AASA referencing an unprovisioned bundle.** `dev.noriui.playground` may not yet be registered in App Store Connect. AASA is harmless in that case — Apple validates the App ID against the device's installed app, so an unmatched ID just means no Universal Link match (no error, no leak).
- **Catch-all `/components/[slug]` collision.** If anyone later adds a `app/components/page.tsx` that conflicts with the dynamic route, the dynamic route still wins for `/components/<slug>` paths. No collision in this spec.
- **Open Graph and llms-full.txt.** The existing `app/llms-full.txt/` and `app/llms.txt/` routes may hard-code old URL paths in their content. Implementation grep + update both.

## Open questions

None. Team ID and bundle ID are known and baked into the spec.

## Out-of-scope for this spec

- Android App Links (intent-filter, `assetlinks.json`).
- Per-component QR-code rendering on the docs page (future feature, depends on Spec A + Spec B).
- "Open in app" button component on docs pages (small follow-up, trivial after Spec B).
- Versioned docs URLs (`/docs/v1/components/button`).
- I18n routing.
