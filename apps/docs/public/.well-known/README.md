# `apps/docs/public/.well-known/`

This directory ships static well-known files served from the root of
`https://nori-ui.com/.well-known/...`.

## `apple-app-site-association`

JSON file (intentionally extensionless — Apple is strict about both the
filename and the response content type) that authorises the playground app
to claim a set of `https://nori-ui.com/...` URLs as iOS Universal Links.

### Lineage of the IDs

```
"appIDs": ["KBWBVNAUNV.com.nori-ui.playground"]
              ^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^
              Team ID     iOS bundle identifier
```

- **`KBWBVNAUNV`** — Apple Team ID, sourced from the `barhoppers-guide`
  repository (`packages/app/eas.json`). The same Apple Developer account
  signs both the Bar Hoppers Guide app and the nori-ui playground.
- **`com.nori-ui.playground`** — iOS bundle identifier set in
  `apps/playground-native/app.json`. Note the asymmetry with Android,
  which uses `com.noriui.playground` because Android's `applicationId`
  rules disallow hyphens. iOS allows hyphens, so we keep the brand-
  consistent form there.

### Routes claimed

```
/components/*   → opens nori-ui://components/<slug> in the playground app
/               → home
```

Routes not listed above (notably the entire `/docs/...` tree) are explicitly
left to the web — search engines, AI crawlers, and shared-link previews must
land on the canonical docs page even on iOS.

### Serving requirements

Apple requires:

1. The file path to be exactly `/.well-known/apple-app-site-association` —
   no `.json` extension, no redirects.
2. The response to set `Content-Type: application/json`.

`apps/docs/vercel.json` adds the Content-Type header rule. Verify after
deploy with `curl -I https://nori-ui.com/.well-known/apple-app-site-association`.
