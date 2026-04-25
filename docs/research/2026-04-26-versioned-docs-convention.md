---
title: Versioned docs URL convention
date: 2026-04-26
type: convention
status: agreed — will rot if not followed
---

# Versioned docs URL convention

## Why this exists

We're at 0.0.x and pre-1.0. We have no version selector in the docs and we
don't need one yet — there's only one version to read. But Paper's deep
v1–v5 history is one of its biggest moats, and retrofitting URL patterns
once a million inbound links exist is painful. So: lock the convention
**now** so the eventual version selector slots in without rewrites.

## The convention

| URL | What it serves |
|---|---|
| `/docs/...` | The **current** stable version's docs. Always. Default for inbound links. |
| `/docs/v0/...` | The 0.x branch frozen at the last 0.x patch. Created the day 0.1 ships. |
| `/docs/next/...` | The unreleased main branch. Created the day we cut the first stable. |

Rules:

- **Latest stable wins the bare path.** Never expose `/docs/v1/...` as the
  canonical URL for the current major. SEO juice and inbound links live at
  `/docs/...`.
- **Version branches are append-only.** When 0.1 ships, copy `/docs/...`
  into `/docs/v0/...` *unchanged* and forget about it. We never edit a
  frozen branch — bug fixes for old majors are exceptional and should be
  rare.
- **`/docs/next/...` mirrors main.** Built from the same MDX as
  `/docs/...` once we have a stable. Until then it's omitted.
- **Slugs match across versions.** `/docs/controls/button` →
  `/docs/v0/controls/button`. The URL after the version segment is the
  same. Never reorganize an old version's tree.

## What ships before 1.0

Just this convention doc. No code changes. The reasons:

1. The version selector UI matters only when there is more than one
   option to select from. Today there is only the current version.
2. The URL pattern is a header decision — fumadocs's source loader can be
   sliced by `version` segment when we add it. Doing it now would mean
   maintaining duplicate trees with no payoff.
3. Cutting a frozen v0 too early would mean every MDX edit propagates to
   "main" but not v0, which is the worst of both worlds — divergence
   without history.

## What ships when 0.1 is cut

Concrete migration plan (the day we publish 0.1.0):

1. Snapshot `apps/docs/content/docs/` into a new directory
   `apps/docs/content/docs-v0/` with no edits.
2. Add a route layer that maps `/docs/v0/...` to the v0 source. Two
   options to evaluate at the time:
   - **Sub-source**: register a second fumadocs source rooted at
     `content/docs-v0/` with a `baseUrl: '/docs/v0'`. Cleanest but doubles
     the source-loader registration logic.
   - **Path-prefixed source**: extend the existing source's URL builder to
     prefix entries from `content/docs-v0/` with `/docs/v0/`.
3. Add a small `<VersionSwitcher>` component to the layout (top-left next
   to the logo, or in the header) populated from a static
   `apps/docs/content/docs/versions.json` file.
4. Add a banner on every `/docs/v0/...` page reading "Viewing docs for
   v0 (frozen). Latest stable: 0.1." with a link to the equivalent
   `/docs/...` URL.
5. Update `llms.txt` and `llms-full.txt` to be the *current* version
   only. Add `/docs/v0/llms.txt` for v0. Versioned llms.txt is what
   AI consumers will actually want.

## What we do NOT do

- **No `/docs/0.0.5/...` per-patch URLs.** Patches don't deserve frozen
  URLs; only majors (or pre-1.0 minors) do.
- **No `/v0/docs/...`.** Version segment goes inside the docs tree, not
  in front of it. Easier to reason about, easier to generate sitemaps.
- **No automatic version branches via git tags.** Cutting v0 is a manual
  one-time operation when 0.1 ships, then forgotten. Automating it
  invites accidents.

## Open questions to revisit at 0.1 cut

- Do we want `latest` as a soft alias (`/docs/latest/...`)? Probably no —
  the bare `/docs/...` is the latest by definition.
- How to handle `llms.txt` for old versions that AI consumers might still
  cache? Probably append a `version: v0` field in frontmatter and let
  consumers filter.
- Search index per version, or unified? Per-version is more honest;
  unified is easier to wire. Likely per-version with a default to current.
