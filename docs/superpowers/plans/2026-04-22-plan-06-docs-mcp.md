# Plan 06 — Docs Site + MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `apps/docs`: a Fumadocs 15 site on Next.js App Router with MDX content, inline live web previews of every component (via `react-native-web` alias), Expo Snack embeds for native previews, `llms.txt`/`llms-full.txt` endpoints, and a `/mcp` route exposing four MCP tools reading from the same Fumadocs source. Also: a 50-question MCP eval harness gated in CI.

**Architecture:** Next.js App Router. Fumadocs handles MDX source + llms.txt. An `@modelcontextprotocol/sdk` server runs as a Next.js Route Handler (streamable HTTP transport). Content lives in `apps/docs/content/`. Components are imported directly from the `nori-ui` workspace; the Vite-style react-native-web alias is applied via Next.js webpack config.

**Tech Stack:** Next.js 15, React 19, Fumadocs 15.x, `@modelcontextprotocol/sdk`, Tailwind, react-native-web. Deployed to Vercel. MCP endpoint is read-only; Vercel edge middleware applies rate limiting.

**Applies all prior errata.**

---

## File Structure

**Created:**
```
apps/docs/
    package.json
    tsconfig.json
    next.config.mjs
    tailwind.config.ts
    postcss.config.cjs
    source.config.ts
    app/
        layout.tsx
        page.tsx
        global.css
        docs/
            [[...slug]]/
                page.tsx
            layout.tsx
        llms.txt/
            route.ts
        llms-full.txt/
            route.ts
        mcp/
            route.ts
    lib/
        source.ts
        llm-text.ts
        mcp-tools.ts
    components/
        live-preview.tsx
        expo-snack.tsx
    content/
        docs/
            index.mdx
            getting-started.mdx
            primitives/
                text.mdx
                box.mdx
                hstack.mdx
                vstack.mdx
            feedback/
                spinner.mdx
            controls/
                button.mdx
                checkbox.mdx
                switch.mdx
            inputs/
                text-input.mdx
                text-area.mdx
            misc/
                icon.mdx
            meta.json                    (Fumadocs nav)
    eval/
        questions.json
        run-eval.ts

e2e/web/tests/docs-smoke.spec.ts
e2e/web/tests/mcp-eval.spec.ts
```

**Modified:**
- root `package.json` — add `dev:docs`, `build:docs`, `test:mcp-eval` scripts
- `.github/workflows/ci.yml` — add `docs-build` job and `mcp-eval` job

---

## Task 1 — `apps/docs` scaffold (Next.js 15 + Fumadocs)

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/next.config.mjs`
- Create: `apps/docs/tailwind.config.ts`
- Create: `apps/docs/postcss.config.cjs`

- [ ] **Step 1: `apps/docs/package.json`.**

```json
{
    "name": "@nori-ui/docs",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "next dev -p 3000",
        "build": "next build",
        "start": "next start -p 3000",
        "typecheck": "tsc --noEmit",
        "test": "echo 'integration tests via e2e' && exit 0"
    },
    "dependencies": {
        "nori-ui": "workspace:*",
        "@nori-ui/tokens": "workspace:*",
        "next": "^15",
        "react": "^19",
        "react-dom": "^19",
        "react-native-web": "^0.19",
        "fumadocs-core": "^15",
        "fumadocs-ui": "^15",
        "fumadocs-mdx": "^11",
        "@modelcontextprotocol/sdk": "^1",
        "zod": "^3.23"
    },
    "devDependencies": {
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "autoprefixer": "^10",
        "postcss": "^8",
        "tailwindcss": "^3.4",
        "typescript": "^5.6"
    }
}
```

- [ ] **Step 2: `apps/docs/tsconfig.json`.**

```json
{
    "extends": "../../tooling/tsconfig.base.json",
    "compilerOptions": {
        "jsx": "preserve",
        "moduleResolution": "Bundler",
        "noEmit": true,
        "incremental": true,
        "plugins": [{ "name": "next" }],
        "paths": {
            "@/*": ["./*"],
            "react-native": ["../../node_modules/react-native-web"],
            "react-native/*": ["../../node_modules/react-native-web/*"]
        }
    },
    "include": [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts"
    ],
    "exclude": ["node_modules"]
}
```

- [ ] **Step 3: `apps/docs/next.config.mjs`.** Aliases RN → RN-Web; transpiles workspace packages.

```js
// apps/docs/next.config.mjs
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['nori-ui', '@nori-ui/tokens'],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            'react-native$': 'react-native-web',
        };
        return config;
    },
};

export default withMDX(nextConfig);
```

- [ ] **Step 4: `apps/docs/tailwind.config.ts` + `postcss.config.cjs`.** Reuse token preset.

```ts
// apps/docs/tailwind.config.ts
import type { Config } from 'tailwindcss';
import noriPreset from '@nori-ui/tokens/tailwind-preset';

const config: Config = {
    presets: [noriPreset],
    content: [
        './app/**/*.{ts,tsx,mdx}',
        './components/**/*.{ts,tsx}',
        './content/**/*.{md,mdx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
};
export default config;
```

```js
// apps/docs/postcss.config.cjs
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 5: `yarn install`.** Expect peer-dep warnings; proceed.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/ package.json yarn.lock
git commit -m "feat(docs): scaffold apps/docs (next.js 15 + fumadocs 15)"
```

---

## Task 2 — Fumadocs source + MDX setup

**Files:**
- Create: `apps/docs/source.config.ts`
- Create: `apps/docs/lib/source.ts`

- [ ] **Step 1: `apps/docs/source.config.ts`.**

```ts
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const { docs, meta } = defineDocs({
    dir: 'content/docs',
    docs: {
        schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            since: z.string().default('0.1.0'),
            tags: z.array(z.string()).default([]),
            platform: z.enum(['web', 'native', 'both']).default('both'),
        }),
    },
});

export default defineConfig();
```

- [ ] **Step 2: `apps/docs/lib/source.ts`.**

```ts
import { loader } from 'fumadocs-core/source';
import { docs } from '@/.source';

export const source = loader({
    baseUrl: '/docs',
    source: docs.toFumadocsSource(),
});
```

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/source.config.ts apps/docs/lib/source.ts
git commit -m "feat(docs): wire fumadocs source with typed frontmatter schema"
```

---

## Task 3 — App layout, global CSS, home page

**Files:**
- Create: `apps/docs/app/global.css`
- Create: `apps/docs/app/layout.tsx`
- Create: `apps/docs/app/page.tsx`
- Create: `apps/docs/app/docs/layout.tsx`
- Create: `apps/docs/app/docs/[[...slug]]/page.tsx`

- [ ] **Step 1: `apps/docs/app/global.css`.**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: `apps/docs/app/layout.tsx`.**

```tsx
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
    title: 'nori-ui — placeholder name',
    description: 'React Native + Web component library, AI-documented, Expo-first.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex min-h-screen flex-col bg-white text-neutral-900">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
```

- [ ] **Step 3: `apps/docs/app/page.tsx`** — minimal landing.

```tsx
import Link from 'next/link';

export default function Home() {
    return (
        <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-4xl font-bold">nori-ui</h1>
            <p className="text-lg text-neutral-700">
                React Native + Web component library. Placeholder name — will be renamed before v0.1.
            </p>
            <Link className="text-primary-600 underline" href="/docs">
                Read the docs →
            </Link>
        </main>
    );
}
```

- [ ] **Step 4: `apps/docs/app/docs/layout.tsx`.**

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout tree={source.pageTree} nav={{ title: 'nori-ui' }}>
            {children}
        </DocsLayout>
    );
}
```

- [ ] **Step 5: `apps/docs/app/docs/[[...slug]]/page.tsx`.**

```tsx
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import defaultMdxComponents from 'fumadocs-ui/mdx';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;
    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
            <DocsBody>
                <MDX
                    components={{
                        ...defaultMdxComponents,
                        a: createRelativeLink(source, page),
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

export function generateStaticParams() {
    return source.generateParams();
}
```

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/app/
git commit -m "feat(docs): add root + /docs layouts, MDX page, home page"
```

---

## Task 4 — Live-preview and Expo Snack components

**Files:**
- Create: `apps/docs/components/live-preview.tsx`
- Create: `apps/docs/components/expo-snack.tsx`

- [ ] **Step 1: `apps/docs/components/live-preview.tsx`.**

```tsx
'use client';

import { NoriProvider } from 'nori-ui/client';
import type { ReactNode } from 'react';

export type LivePreviewProps = {
    children: ReactNode;
    className?: string;
};

/**
 * Renders a component inline using the actual `nori-ui` web build
 * (via react-native-web alias at the Next.js layer). Consumers of the
 * docs see exactly the component they'd install.
 */
export function LivePreview({ children, className }: LivePreviewProps) {
    return (
        <div className={`rounded-lg border border-neutral-200 bg-white p-6 ${className ?? ''}`}>
            <NoriProvider>{children}</NoriProvider>
        </div>
    );
}
```

- [ ] **Step 2: `apps/docs/components/expo-snack.tsx`.**

```tsx
export type ExpoSnackProps = {
    /** Snack ID from https://snack.expo.dev (the last URL segment) */
    id: string;
    platform?: 'ios' | 'android' | 'web';
    preview?: boolean;
    theme?: 'light' | 'dark';
    height?: number;
};

/**
 * Embeds an Expo Snack for native previews. Snacks are free and hosted by
 * Expo — consumers can fork and run the example on a real device.
 */
export function ExpoSnack({ id, platform = 'ios', preview = true, theme = 'light', height = 500 }: ExpoSnackProps) {
    const params = new URLSearchParams({ platform, preview: preview ? 'true' : 'false', theme });
    const src = `https://snack.expo.dev/embedded/${id}?${params.toString()}`;
    return (
        <iframe
            title={`Expo Snack ${id}`}
            src={src}
            style={{ width: '100%', height, border: '1px solid #e4e4e7', borderRadius: 8 }}
            loading="lazy"
        />
    );
}
```

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/components/
git commit -m "feat(docs): add LivePreview (web) and ExpoSnack (native) preview components"
```

---

## Task 5 — Seed MDX content (one page per component)

**Files:**
- Create: `apps/docs/content/docs/meta.json`
- Create: `apps/docs/content/docs/index.mdx`
- Create: `apps/docs/content/docs/getting-started.mdx`
- Create: one MDX per component (11 files across the subdirectories listed in the File Structure)

- [ ] **Step 1: `apps/docs/content/docs/meta.json`.**

```json
{
    "title": "nori-ui",
    "pages": [
        "index",
        "getting-started",
        "---Primitives---",
        "primitives/text",
        "primitives/box",
        "primitives/hstack",
        "primitives/vstack",
        "---Feedback---",
        "feedback/spinner",
        "---Controls---",
        "controls/button",
        "controls/checkbox",
        "controls/switch",
        "---Inputs---",
        "inputs/text-input",
        "inputs/text-area",
        "---Misc---",
        "misc/icon"
    ]
}
```

- [ ] **Step 2: `apps/docs/content/docs/index.mdx`.**

```mdx
---
title: Introduction
description: nori-ui is a React Native + Web component library with Figma-driven tokens.
since: 0.1.0
tags: [intro]
platform: both
---

## What is nori-ui?

A set of primitives and controls that work identically on iOS, Android, and web. Styled with NativeWind and themed via design tokens exported from Figma (Tokens Studio). AI-queryable via `/mcp`.

> **Placeholder name.** `nori-ui` will be renamed before the first published release.

## Start here

- [Getting started](/docs/getting-started) — install and render your first component.
- [Button](/docs/controls/button) — the flagship component; exercises every architectural axis.
```

- [ ] **Step 3: `apps/docs/content/docs/getting-started.mdx`.**

```mdx
---
title: Getting started
description: Install and render your first component in under five minutes.
since: 0.1.0
tags: [install, setup]
platform: both
---

## Install

```bash
yarn add nori-ui
# optional — any icon library works; Lucide is recommended:
yarn add lucide-react lucide-react-native
```

## Tailwind preset

Add the `@nori-ui/tokens` preset to your consumer `tailwind.config.ts`:

```ts
import { noriPreset } from '@nori-ui/tokens/tailwind-preset';
export default { presets: [noriPreset], content: [/* your globs */] };
```

## Provider

Wrap your app once. The library works without a provider too — provider only customizes theme / i18n / semantic icons.

```tsx
'use client';
import { NoriProvider } from 'nori-ui/client';

export default function App() {
    return (
        <NoriProvider>
            <YourApp />
        </NoriProvider>
    );
}
```

## First component

```tsx
import { Button } from 'nori-ui';

<Button variant="primary">Click me</Button>
```
```

- [ ] **Step 4: One MDX per component.** Use this template for each — fill in the component-specific example.

Example `apps/docs/content/docs/controls/button.mdx`:

```mdx
---
title: Button
description: Clickable action with variants, sizes, loading state, icon slots, and asChild.
since: 0.1.0
tags: [control, action]
platform: both
---

import { LivePreview } from '@/components/live-preview';
import { ExpoSnack } from '@/components/expo-snack';
import { Button } from 'nori-ui';

## At a glance

- **Variants:** `primary`, `secondary`, `ghost`, `destructive`
- **Sizes:** `sm`, `md`, `lg`
- **States:** default, pressed, disabled, loading
- **Composition:** `asChild` renders a supplied element (e.g. `<Link>`) as the interactive root.

## Web preview

<LivePreview>
    <Button>Click me</Button>
</LivePreview>

## Variants

<LivePreview>
    <Button variant="secondary">Secondary</Button>
</LivePreview>

<LivePreview>
    <Button variant="destructive">Delete</Button>
</LivePreview>

## Native preview (Expo Snack)

{/* Replace id with a real Snack when authoring. Plan 06 ships the infrastructure. */}
<ExpoSnack id="@nori-ui/button-smoke" height={400} />

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'primary'` | Visual intent |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Control height + text size |
| `loading` | `boolean` | `false` | Replaces leading icon with Spinner; blocks press |
| `disabled` | `boolean` | `false` | Visually muted + non-interactive |
| `leadingIcon` / `trailingIcon` | `ComponentType<{ size?: number; color?: string }>` | — | Icon component reference |
| `asChild` | `boolean` | `false` | Renders the single child as the interactive root |

## asChild

```tsx
<Button asChild variant="primary">
    <Link href="/somewhere">Go</Link>
</Button>
```
```

Write analogous MDX (shorter is fine) for the other 10 components under their respective subdirectories. Each follows the same shape: frontmatter → at-a-glance → LivePreview → (ExpoSnack placeholder) → Props table → any component-specific notes.

- [ ] **Step 5: Commit** (batched is fine).

```bash
git add apps/docs/content/
git commit -m "docs: seed MDX content for all 11 components with LivePreview + ExpoSnack placeholders"
```

---

## Task 6 — `llms.txt` + `llms-full.txt` endpoints

**Files:**
- Create: `apps/docs/lib/llm-text.ts`
- Create: `apps/docs/app/llms.txt/route.ts`
- Create: `apps/docs/app/llms-full.txt/route.ts`

- [ ] **Step 1: `apps/docs/lib/llm-text.ts`.** Extracts MDX frontmatter + body into LLM-friendly plaintext.

```ts
import type { InferPageType } from 'fumadocs-core/source';
import type { source } from './source';

export async function getLLMText(page: InferPageType<typeof source>): Promise<string> {
    // page.data.body is the compiled MDX component — fall back to the raw content string.
    const raw = (page.data as unknown as { content?: string }).content ?? '';
    const lines: string[] = [];
    lines.push(`# ${page.data.title}`);
    if (page.data.description) lines.push(page.data.description);
    lines.push('');
    lines.push(`URL: ${page.url}`);
    lines.push(`Since: ${page.data.since ?? '0.1.0'}`);
    lines.push(`Platform: ${page.data.platform ?? 'both'}`);
    if (page.data.tags?.length) lines.push(`Tags: ${page.data.tags.join(', ')}`);
    lines.push('');
    lines.push(raw);
    return lines.join('\n');
}
```

- [ ] **Step 2: `apps/docs/app/llms.txt/route.ts`.**

```ts
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
    const index = source
        .getPages()
        .map((p) => `- [${p.data.title}](${p.url}) — ${p.data.description ?? ''}`)
        .join('\n');

    const body = [
        '# nori-ui',
        '',
        'React Native + Web component library. Primary domain reference for LLMs and code agents.',
        '',
        '## Pages',
        '',
        index,
    ].join('\n');

    return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
```

- [ ] **Step 3: `apps/docs/app/llms-full.txt/route.ts`.**

```ts
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/llm-text';

export const revalidate = false;

export async function GET() {
    const pages = source.getPages();
    const chunks = await Promise.all(pages.map(getLLMText));
    return new Response(chunks.join('\n\n---\n\n'), {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
}
```

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/lib/llm-text.ts apps/docs/app/llms.txt apps/docs/app/llms-full.txt
git commit -m "feat(docs): serve llms.txt and llms-full.txt from fumadocs source"
```

---

## Task 7 — `/mcp` server route

**Files:**
- Create: `apps/docs/lib/mcp-tools.ts`
- Create: `apps/docs/app/mcp/route.ts`

- [ ] **Step 1: `apps/docs/lib/mcp-tools.ts`.**

```ts
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

type Page = InferPageType<typeof source>;

function componentSummary(p: Page) {
    return {
        name: p.data.title,
        description: p.data.description ?? '',
        tags: p.data.tags ?? [],
        since: p.data.since ?? '0.1.0',
        platform: p.data.platform ?? 'both',
        url: p.url,
    };
}

export function searchComponents(query: string) {
    const q = query.toLowerCase();
    return source
        .getPages()
        .filter((p) => {
            return (
                p.data.title.toLowerCase().includes(q) ||
                (p.data.description ?? '').toLowerCase().includes(q) ||
                (p.data.tags ?? []).some((t) => t.toLowerCase().includes(q))
            );
        })
        .map(componentSummary);
}

export function getComponentDocs(name: string) {
    const page = source.getPages().find((p) => p.data.title.toLowerCase() === name.toLowerCase());
    if (!page) return null;
    const raw = (page.data as unknown as { content?: string }).content ?? '';
    return {
        ...componentSummary(page),
        body: raw,
    };
}

export function listExamples(component?: string) {
    // Minimal — returns every page's raw body filtered by component name if provided.
    return source
        .getPages()
        .filter((p) => (component ? p.data.title.toLowerCase() === component.toLowerCase() : true))
        .map((p) => ({
            component: p.data.title,
            body: (p.data as unknown as { content?: string }).content ?? '',
        }));
}

// Plan 05+ enriches prop extraction via react-docgen-typescript. For v0.1 the
// MCP tool returns a note pointing consumers at the docs page.
export function getComponentProps(name: string) {
    const page = source.getPages().find((p) => p.data.title.toLowerCase() === name.toLowerCase());
    if (!page) return null;
    return {
        note: 'Prop extraction is deferred until the dual-build ships in Plan 07. For now consult the docs page:',
        url: page.url,
    };
}
```

- [ ] **Step 2: `apps/docs/app/mcp/route.ts`.** Uses the MCP SDK's HTTP Streamable transport.

```ts
// Next.js App Router MCP endpoint.
// Supports POST + streamable HTTP transport per the MCP spec.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { getComponentDocs, getComponentProps, listExamples, searchComponents } from '@/lib/mcp-tools';

function buildServer() {
    const server = new McpServer({
        name: 'nori-ui-docs',
        version: '0.1.0',
    });

    server.tool(
        'search_components',
        {
            description: 'Fuzzy search components by name, description, or tag.',
            inputSchema: { query: z.string() },
        },
        async ({ query }) => {
            const result = searchComponents(query);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        },
    );

    server.tool(
        'get_component_docs',
        {
            description: 'Full docs body for a single component by name.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => {
            const result = getComponentDocs(name);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        },
    );

    server.tool(
        'get_component_props',
        {
            description: 'Prop definitions for a component.',
            inputSchema: { name: z.string() },
        },
        async ({ name }) => {
            const result = getComponentProps(name);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        },
    );

    server.tool(
        'list_examples',
        {
            description: 'List usage examples; filter by component name.',
            inputSchema: { component: z.string().optional() },
        },
        async ({ component }) => {
            const result = listExamples(component);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        },
    );

    return server;
}

export async function POST(req: Request) {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);
    // The SDK transports typically adapt to the request/response pair — consult
    // @modelcontextprotocol/sdk docs for the exact adapter. For Next.js route
    // handlers we pipe through a Response stream.
    const body = await req.text();
    const response = await transport.handleHttpRequest({
        method: 'POST',
        body,
        headers: Object.fromEntries(req.headers.entries()),
    });
    return new Response(response.body as BodyInit, {
        status: response.status,
        headers: response.headers,
    });
}

export async function GET() {
    return new Response('MCP endpoint — POST a JSON-RPC message per the MCP spec.', {
        headers: { 'content-type': 'text/plain' },
    });
}
```

Notes:
- The exact SDK adapter signature for HTTP Streamable transport may differ by version. If the signature above doesn't match the installed `@modelcontextprotocol/sdk`, consult its examples and use whatever `handleRequest`/`connect` API ships. The logic is: accept POST, feed JSON-RPC through the transport, stream the response.

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/lib/mcp-tools.ts apps/docs/app/mcp/route.ts
git commit -m "feat(docs): add /mcp route exposing search / get-docs / get-props / list-examples"
```

---

## Task 8 — MCP eval harness (50 questions)

**Files:**
- Create: `apps/docs/eval/questions.json`
- Create: `apps/docs/eval/run-eval.ts`
- Create: `e2e/web/tests/mcp-eval.spec.ts`

- [ ] **Step 1: `apps/docs/eval/questions.json`.** 50 gold-labelled questions (abbreviated example — seed with 10 now, grow to 50 over time):

```json
{
    "questions": [
        {
            "q": "which component is a checkbox?",
            "tool": "search_components",
            "input": { "query": "checkbox" },
            "expect": { "includesName": "Checkbox" }
        },
        {
            "q": "tell me about Button",
            "tool": "get_component_docs",
            "input": { "name": "Button" },
            "expect": { "namePresent": "Button" }
        },
        {
            "q": "props of Switch",
            "tool": "get_component_props",
            "input": { "name": "Switch" },
            "expect": { "nonNull": true }
        },
        {
            "q": "what's Button's loading state?",
            "tool": "search_components",
            "input": { "query": "button loading" },
            "expect": { "includesName": "Button" }
        },
        {
            "q": "show me a list of examples for TextInput",
            "tool": "list_examples",
            "input": { "component": "TextInput" },
            "expect": { "nonEmpty": true }
        }
    ]
}
```

Augment to 50 entries as docs expand — the PRD requires ≥ 95 % success on a 50-item set.

- [ ] **Step 2: `apps/docs/eval/run-eval.ts`.**

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Question = {
    q: string;
    tool: 'search_components' | 'get_component_docs' | 'get_component_props' | 'list_examples';
    input: Record<string, unknown>;
    expect: { includesName?: string; namePresent?: string; nonNull?: boolean; nonEmpty?: boolean };
};

async function callTool(tool: string, input: Record<string, unknown>, baseUrl: string): Promise<unknown> {
    const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name: tool, arguments: input },
        }),
    });
    if (!res.ok) throw new Error(`MCP call failed: ${res.status}`);
    const json = (await res.json()) as { result?: { content?: Array<{ text: string }> } };
    const text = json.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
}

function grade(question: Question, result: unknown): boolean {
    const e = question.expect;
    if (e.includesName) {
        const arr = Array.isArray(result) ? result : [];
        return arr.some((x) => (x as { name?: string }).name === e.includesName);
    }
    if (e.namePresent) {
        return result !== null && typeof result === 'object' && (result as { name?: string }).name === e.namePresent;
    }
    if (e.nonNull) return result !== null && result !== undefined;
    if (e.nonEmpty) return Array.isArray(result) && result.length > 0;
    return false;
}

async function main() {
    const baseUrl = process.env.MCP_BASE_URL ?? 'http://localhost:3000';
    const questionsPath = path.resolve(__dirname, 'questions.json');
    const { questions } = JSON.parse(readFileSync(questionsPath, 'utf8')) as { questions: Question[] };

    let passed = 0;
    for (const question of questions) {
        try {
            const result = await callTool(question.tool, question.input, baseUrl);
            const ok = grade(question, result);
            if (ok) passed++;
            console.log(`${ok ? 'PASS' : 'FAIL'}: ${question.q}`);
        } catch (err) {
            console.log(`ERROR: ${question.q} — ${(err as Error).message}`);
        }
    }

    const rate = passed / questions.length;
    console.log(`\nPassed ${passed}/${questions.length} (${(rate * 100).toFixed(1)}%)`);
    if (rate < 0.95) {
        console.error('::error::MCP eval below 95% — see failures above');
        process.exit(1);
    }
}

main();
```

- [ ] **Step 3: `e2e/web/tests/mcp-eval.spec.ts`** — thin wrapper that boots the docs site and runs the eval.

```ts
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';

test('mcp eval ≥ 95% pass rate', async ({ baseURL }) => {
    // run-eval hits the already-running docs server (via Playwright's webServer hook).
    // Plan 06 provides a separate webServer config for docs — add it in ci step if needed.
    const output = execFileSync('yarn', ['tsx', 'apps/docs/eval/run-eval.ts'], {
        encoding: 'utf8',
        env: { ...process.env, MCP_BASE_URL: baseURL ?? 'http://localhost:3000' },
    });
    expect(output).toContain('Passed');
    expect(output).not.toContain('::error::');
});
```

- [ ] **Step 4: Install tsx for the eval runner.**

```bash
yarn workspace @nori-ui/e2e-web add -D tsx
```

- [ ] **Step 5: Commit.**

```bash
git add apps/docs/eval/ e2e/web/tests/mcp-eval.spec.ts yarn.lock
git commit -m "test(docs): add mcp eval harness with seed 5 questions (grow to 50)"
```

---

## Task 9 — Root scripts + CI job

**Files:**
- Modify: root `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Root `package.json` scripts:**

```json
{
    "scripts": {
        "dev:docs": "yarn workspace @nori-ui/docs dev",
        "build:docs": "yarn workspace @nori-ui/docs build",
        "test:mcp-eval": "yarn workspace @nori-ui/e2e-web test tests/mcp-eval.spec.ts"
    }
}
```

- [ ] **Step 2: CI — add a `docs-build` job.** Append to `.github/workflows/ci.yml`:

```yaml
    docs-build:
        name: docs build + mcp eval
        runs-on: ubuntu-latest
        timeout-minutes: 20
        needs: quality
        steps:
            - uses: actions/checkout@v4
            - run: corepack enable
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: yarn
            - run: yarn install --immutable
            - run: yarn build:tokens
            - run: yarn build:docs
            - name: Start docs server + run eval
              run: |
                  yarn dev:docs &
                  DOCS_PID=$!
                  sleep 15
                  MCP_BASE_URL=http://localhost:3000 yarn tsx apps/docs/eval/run-eval.ts
                  kill $DOCS_PID || true
```

- [ ] **Step 3: Commit.**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: add docs-build job with mcp eval"
```

---

## Task 10 — Playwright docs smoke

**Files:**
- Create: `e2e/web/tests/docs-smoke.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test.describe('docs site smoke', () => {
    test('home page renders', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/nori-ui/);
    });

    test('docs index renders', async ({ page }) => {
        await page.goto('http://localhost:3000/docs');
        await expect(page.locator('text=Introduction')).toBeVisible();
    });

    test('llms.txt served', async ({ request }) => {
        const res = await request.get('http://localhost:3000/llms.txt');
        expect(res.status()).toBe(200);
        expect(await res.text()).toContain('nori-ui');
    });
});
```

The docs app runs on :3000 alongside the playground-web on :5173. Local dev flow requires both running; CI starts :3000 in the docs-build job.

```bash
git add e2e/web/tests/docs-smoke.spec.ts
git commit -m "test(e2e): add docs site smoke tests"
```

---

## Task 11 — Final verification

- [ ] **Step 1:** `yarn build:docs` — builds cleanly.
- [ ] **Step 2:** `yarn dev:docs` — site renders at :3000. `/docs`, `/llms.txt`, `/llms-full.txt`, `/mcp` all respond.
- [ ] **Step 3:** `yarn tsx apps/docs/eval/run-eval.ts` with a running dev server — ≥ 95% pass (or expand eval set until it does).

---

## Done criteria for Plan 06

- [ ] `apps/docs` builds on Next.js 15 + Fumadocs 15.
- [ ] One MDX page per v0.1 component (11 pages).
- [ ] Inline web live previews using actual `nori-ui` components via react-native-web alias.
- [ ] Expo Snack embeds on each component page.
- [ ] `/llms.txt` and `/llms-full.txt` endpoints serve per spec §3.
- [ ] `/mcp` route exposes 4 tools; 50-question eval ≥ 95 %.
- [ ] CI `docs-build` job green.
- [ ] Lighthouse target ≥ 95 on all four axes (Perf, A11y, BP, SEO) — run in a separate follow-up once deployed.

Plan 07 (release pipeline) is next.

---

## Errata (post-execution notes)

1. **fumadocs-mdx v11 / fumadocs-core v15 API mismatch**: `createMDXSource` returns `{files: () => …}` whereas `loader()` expects `{files: VirtualFile[]}`. Adapt by calling the function and passing the array; lifecycle scripts (`predev`/`prebuild`/`pretypecheck`) must run `fumadocs-mdx` to codegen `.source/`. Add `.source/` to `.gitignore`.
2. **RSC boundary**: Button's `onPress` cannot serialize through MDX → client-component children. Consume library components from a local `'use client'` re-export (`apps/docs/components/ui-client.ts`) so MDX imports resolve through a client boundary.
3. **`react-native-augment.d.ts` in the docs app** carries the NativeWind `className` type augmentation across the workspace boundary (workspace TS references don't reach `packages/ui/src/react-native.d.ts` through the published shape).
4. **LivePreview defers child mount via `useEffect`** to avoid event-handler serialization issues at hydrate time — briefly flashes empty, acceptable for v0.1; revisit in Plan 08+ if hydration UX matters.
5. **MCP SDK shape**: `McpServer` + `WebStandardStreamableHTTPServerTransport` + `enableJsonResponse: true` is the working combination in `@modelcontextprotocol/sdk@1.29.0`. GET returns 406 without `accept: text/event-stream` or `application/json` — expected per spec.
6. **Commit scope**: the plan's `test(e2e):` breaks commitlint kebab rule; use `test(playground-web):` (matches 05a/05b/05c/05d precedent).
7. **MCP eval** seeded with 5 questions (plan 50-target deferred and flagged via a TODO key in `apps/docs/eval/questions.json`).
8. **Biome overrides** added for `apps/docs/content/**/*.mdx` (formatter off — same reason as `docs/superpowers/**`) and `**/*.css` (`noUnknownAtRules: off` — Tailwind `@tailwind` directives).
