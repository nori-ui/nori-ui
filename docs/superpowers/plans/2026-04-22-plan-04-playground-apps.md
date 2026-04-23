# Plan 04 — Playground Apps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the two apps that serve as e2e test targets: `apps/playground-web` (Vite + React + `react-native-web` + Storybook 8, Playwright target) and `apps/playground-native` (Expo SDK 55 + New Architecture + NativeWind, Maestro target). Both boot, render a smoke screen that consumes `@nori-ui/tokens` via `useTheme()`, and can be driven by their respective e2e tool.

**Architecture:** Each playground is an independent workspace that depends on `nori-ui` (workspace:*). Component stories live in `packages/ui/src/<component>/*.stories.tsx` (CSF 3 format) as a single source of truth — the web Storybook indexes them directly; a tiny `story-registry.ts` in `packages/ui/src/stories/` enumerates the same set so `playground-native` can iterate and render them for Maestro. Plan 04 ships the infrastructure and a placeholder story; the 11 real component stories arrive in Plan 05.

**Tech Stack:** Vite 5, React 19, `react-native-web`, Storybook 8 with the Vite builder, Expo SDK 55 (React Native 0.83, React 19, New Architecture default), NativeWind v4, Playwright 1.x, Maestro CLI.

**Applies all prior errata.** Especially: no `-W`, workspace-specific devDeps in the workspace, Biome 2.x config, tokens at `packages/tokens/`.

---

## File Structure

**Created in this plan:**
```
apps/playground-web/
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    tailwind.config.ts
    postcss.config.cjs
    src/
        main.tsx
        App.tsx
        styles.css
    .storybook/
        main.ts
        preview.ts

apps/playground-native/
    package.json
    tsconfig.json
    app.json
    metro.config.js
    babel.config.js
    tailwind.config.ts
    global.css
    index.ts
    App.tsx

packages/ui/src/stories/
    story-registry.ts
    PlaceholderSmoke.stories.tsx

e2e/web/
    playwright.config.ts
    tests/smoke.spec.ts

e2e/native/
    flows/smoke.yaml

.github/workflows/
    ci.yml                                 (modified — adds Playwright job)

package.json                               (modified — add dev/e2e scripts)
```

---

## Task 1 — `apps/playground-web` scaffold (Vite + React 19)

**Files:**
- Create: `apps/playground-web/package.json`
- Create: `apps/playground-web/tsconfig.json`
- Create: `apps/playground-web/vite.config.ts`
- Create: `apps/playground-web/index.html`
- Create: `apps/playground-web/src/main.tsx`
- Create: `apps/playground-web/src/App.tsx`
- Create: `apps/playground-web/src/styles.css`

- [ ] **Step 1: Create `apps/playground-web/package.json`.**

```json
{
    "name": "playground-web",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview --port 4173",
        "typecheck": "tsc --noEmit",
        "test": "echo 'no unit tests — e2e only' && exit 0",
        "storybook": "storybook dev -p 6006 --no-open",
        "build:storybook": "storybook build -o storybook-static"
    },
    "dependencies": {
        "nori-ui": "workspace:*",
        "@nori-ui/tokens": "workspace:*",
        "react": "^19",
        "react-dom": "^19",
        "react-native-web": "^0.19"
    },
    "devDependencies": {
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@vitejs/plugin-react": "^4",
        "autoprefixer": "^10",
        "postcss": "^8",
        "tailwindcss": "^3.4",
        "nativewind": "^4",
        "typescript": "^5.6",
        "vite": "^5"
    }
}
```

- [ ] **Step 2: Install.**

```bash
yarn install
```

- [ ] **Step 3: `apps/playground-web/tsconfig.json`.**

```json
{
    "extends": "../../tooling/tsconfig.base.json",
    "compilerOptions": {
        "jsx": "react-jsx",
        "moduleResolution": "Bundler",
        "allowImportingTsExtensions": false,
        "types": ["vite/client"],
        "noEmit": true,
        "paths": {
            "react-native": ["../../node_modules/react-native-web"],
            "react-native/*": ["../../node_modules/react-native-web/*"]
        }
    },
    "include": ["src/**/*", "vite.config.ts", ".storybook/**/*"]
}
```

- [ ] **Step 4: `apps/playground-web/vite.config.ts`.**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Alias react-native → react-native-web so imports from `nori-ui` and
// `lucide-react-native` resolve to web-compatible components.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^react-native$/, replacement: 'react-native-web' },
            { find: /^react-native\/(.*)$/, replacement: 'react-native-web/$1' },
        ],
    },
    server: {
        port: 5173,
    },
    // Let Vite prebundle workspace packages to speed up cold starts.
    optimizeDeps: {
        include: ['nori-ui', 'nori-ui/client', '@nori-ui/tokens'],
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
});
```

- [ ] **Step 5: `apps/playground-web/index.html`.**

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>nori-ui playground (web)</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
```

- [ ] **Step 6: `apps/playground-web/src/main.tsx`.**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

createRoot(el).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
```

- [ ] **Step 7: `apps/playground-web/src/App.tsx`** — smoke page using `useTheme()` from nori-ui/client.

```tsx
'use client';

import { NoriProvider, useTheme } from 'nori-ui/client';

function SmokeContent() {
    const theme = useTheme();
    return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 data-testid="title">nori-ui playground (web)</h1>
            <p>
                Primary token value resolved from <code>@nori-ui/tokens</code>:
            </p>
            <div
                data-testid="primary-swatch"
                style={{
                    width: 96,
                    height: 32,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
            <p data-testid="primary-hex">{theme.color.primary['500']}</p>
        </div>
    );
}

export function App() {
    return (
        <NoriProvider>
            <SmokeContent />
        </NoriProvider>
    );
}
```

- [ ] **Step 8: `apps/playground-web/src/styles.css`** — minimal reset.

```css
* {
    box-sizing: border-box;
}
body {
    margin: 0;
    background: white;
    color: #18181b;
}
```

- [ ] **Step 9: Boot the dev server to verify it works.**

```bash
yarn workspace playground-web dev &
sleep 5
curl -sf http://localhost:5173 > /dev/null && echo OK
kill %1 2>/dev/null || pkill -f "vite.*playground-web" || true
```

Expected: `OK`. If fetch fails, check Vite's stderr for resolution errors.

- [ ] **Step 10: Commit.**

```bash
git add apps/playground-web/ package.json yarn.lock
git commit -m "feat(playground-web): scaffold vite + react 19 + react-native-web"
```

---

## Task 2 — NativeWind + Tailwind preset in playground-web

**Files:**
- Create: `apps/playground-web/tailwind.config.ts`
- Create: `apps/playground-web/postcss.config.cjs`
- Modify: `apps/playground-web/src/styles.css` (add Tailwind directives)

- [ ] **Step 1: `apps/playground-web/tailwind.config.ts`.** Uses the preset from `@nori-ui/tokens`.

```ts
import type { Config } from 'tailwindcss';
// biome-ignore lint/correctness/noNodejsModules: tailwind config runs in node
import noriPreset from '@nori-ui/tokens/tailwind-preset';

const config: Config = {
    presets: [noriPreset],
    content: [
        './index.html',
        './src/**/*.{ts,tsx}',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
};

export default config;
```

- [ ] **Step 2: `apps/playground-web/postcss.config.cjs`.**

```js
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};
```

- [ ] **Step 3: Update `apps/playground-web/src/styles.css`.**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
    box-sizing: border-box;
}
body {
    margin: 0;
    background: white;
    color: #18181b;
}
```

- [ ] **Step 4: Confirm Tailwind compiles.**

```bash
yarn workspace playground-web build
```

Expected: `dist/` produced, `dist/assets/*.css` contains Tailwind utility classes.

- [ ] **Step 5: Commit.**

```bash
git add apps/playground-web/tailwind.config.ts apps/playground-web/postcss.config.cjs apps/playground-web/src/styles.css
git commit -m "feat(playground-web): wire nativewind + tailwind preset from @nori-ui/tokens"
```

---

## Task 3 — Shared story registry + one placeholder story

**Files:**
- Create: `packages/ui/src/stories/story-registry.ts`
- Create: `packages/ui/src/stories/PlaceholderSmoke.stories.tsx`
- Modify: `packages/ui/package.json` (add `./stories` subpath export)

- [ ] **Step 1: `packages/ui/src/stories/story-registry.ts`.**

```ts
// Story registry — enumerated list of CSF stories in the library.
// Used by playground-native (which can't auto-discover via Storybook) to
// render the same set of variants.
//
// Each entry maps a display title to a render function. Plan 05 adds one
// entry per component variant.

import type { ComponentType } from 'react';

export type StoryEntry = {
    /** Dot-separated story id, e.g. "Button/Primary" */
    id: string;
    /** Human title shown in Storybook + playground-native */
    title: string;
    /** Renderable component (already wrapped with its args) */
    render: ComponentType<Record<string, never>>;
};

export const stories: StoryEntry[] = [
    // Plan 05 appends entries as each component ships.
];
```

- [ ] **Step 2: `packages/ui/src/stories/PlaceholderSmoke.stories.tsx`.**

```tsx
// Smoke placeholder story — exists so Storybook + the playgrounds have
// something to render before Plan 05. Remove when Button lands.

import type { Meta, StoryObj } from '@storybook/react';
import { NoriProvider, useTheme } from 'nori-ui/client';

function PlaceholderSmoke() {
    const theme = useTheme();
    return (
        <div data-testid="smoke" style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <strong>nori-ui smoke</strong>
            <div
                data-testid="smoke-swatch"
                style={{
                    width: 64,
                    height: 24,
                    marginTop: 8,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
        </div>
    );
}

function WrappedSmoke() {
    return (
        <NoriProvider>
            <PlaceholderSmoke />
        </NoriProvider>
    );
}

const meta: Meta<typeof WrappedSmoke> = {
    title: 'Smoke/Placeholder',
    component: WrappedSmoke,
};

export default meta;

export const Default: StoryObj<typeof WrappedSmoke> = {};
```

- [ ] **Step 3: Install `@storybook/react` types** into the ui workspace so the story typechecks.

```bash
yarn workspace nori-ui add -D @storybook/react
```

- [ ] **Step 4: Add `./stories` subpath export** in `packages/ui/package.json`:

```json
{
    "exports": {
        ".": "./src/index.ts",
        "./client": "./src/client.ts",
        "./theme": "./src/theme/index.ts",
        "./i18n": "./src/i18n/index.ts",
        "./icons": "./src/icons/index.ts",
        "./slot": "./src/slot/index.ts",
        "./utils/cn": "./src/utils/cn.ts",
        "./stories": "./src/stories/story-registry.ts"
    }
}
```

- [ ] **Step 5: Typecheck.**

```bash
yarn workspace nori-ui typecheck
```

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/stories/ packages/ui/package.json yarn.lock
git commit -m "feat(ui): add story registry and placeholder smoke story"
```

---

## Task 4 — Storybook 8 in playground-web

**Files:**
- Create: `apps/playground-web/.storybook/main.ts`
- Create: `apps/playground-web/.storybook/preview.ts`

- [ ] **Step 1: Install Storybook 8 with the Vite builder.**

```bash
yarn workspace playground-web add -D storybook@^8 @storybook/react-vite@^8 @storybook/react@^8 @storybook/addon-essentials@^8 @storybook/addon-a11y@^8
```

- [ ] **Step 2: `apps/playground-web/.storybook/main.ts`.**

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: [
        '../../../packages/ui/src/**/*.stories.@(ts|tsx)',
    ],
    addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: { autodocs: 'tag' },
    typescript: { check: false },
};

export default config;
```

- [ ] **Step 3: `apps/playground-web/.storybook/preview.ts`.**

```ts
import type { Preview } from '@storybook/react';
import '../src/styles.css';

const preview: Preview = {
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#ffffff' },
                { name: 'dark', value: '#18181b' },
            ],
        },
        a11y: { disable: false },
    },
};

export default preview;
```

- [ ] **Step 4: Verify Storybook boots.**

```bash
yarn workspace playground-web storybook &
sleep 10
curl -sf http://localhost:6006/iframe.html?id=smoke-placeholder--default > /dev/null && echo OK
pkill -f "storybook" || true
```

Expected: `OK`. If Storybook fails to discover the story, double-check the path in `stories` glob (three `..` because `.storybook/` is at `apps/playground-web/.storybook/`).

- [ ] **Step 5: Build static Storybook** so Playwright can serve it later without the dev server.

```bash
yarn workspace playground-web build:storybook
```

Expected: `apps/playground-web/storybook-static/` produced.

- [ ] **Step 6: Add `storybook-static/` to `.gitignore`** (it's a build artifact).

Append to `.gitignore`:

```
# storybook
storybook-static/
```

- [ ] **Step 7: Commit.**

```bash
git add apps/playground-web/.storybook/ apps/playground-web/package.json .gitignore yarn.lock
git commit -m "feat(playground-web): add storybook 8 on vite builder, discovers stories from packages/ui"
```

---

## Task 5 — `apps/playground-native` scaffold (Expo SDK 55)

**Files:**
- Create: `apps/playground-native/package.json`
- Create: `apps/playground-native/tsconfig.json`
- Create: `apps/playground-native/app.json`
- Create: `apps/playground-native/index.ts`
- Create: `apps/playground-native/App.tsx`

- [ ] **Step 1: `apps/playground-native/package.json`.**

```json
{
    "name": "playground-native",
    "version": "0.0.0",
    "private": true,
    "main": "index.ts",
    "scripts": {
        "start": "expo start",
        "ios": "expo start --ios",
        "android": "expo start --android",
        "web": "expo start --web",
        "typecheck": "tsc --noEmit",
        "test": "echo 'no unit tests — e2e only' && exit 0"
    },
    "dependencies": {
        "nori-ui": "workspace:*",
        "@nori-ui/tokens": "workspace:*",
        "expo": "~55.0.0",
        "expo-status-bar": "~2.3.0",
        "react": "^19",
        "react-native": "0.83.0",
        "nativewind": "^4",
        "react-native-reanimated": "~4.1.0",
        "react-native-safe-area-context": "5.6.0",
        "react-native-screens": "4.20.0"
    },
    "devDependencies": {
        "@babel/core": "^7.25.0",
        "@types/react": "^19",
        "typescript": "^5.6",
        "tailwindcss": "^3.4"
    }
}
```

Notes:
- Expo SDK 55 manifest pairs: RN 0.83, React 19. Exact Expo-managed-dep versions (`expo-status-bar`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`) should match what `npx expo install --check` reports for SDK 55; if a version here conflicts, adjust to what Expo recommends and log it.
- `nativewind@^4` requires `react-native-reanimated` (v4 with New Architecture support).

- [ ] **Step 2: `apps/playground-native/tsconfig.json`.**

```json
{
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
        "strict": true,
        "jsx": "react-jsx",
        "types": ["react-native", "jest"]
    },
    "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 3: `apps/playground-native/app.json`.** New Architecture on, bare-minimum config.

```json
{
    "expo": {
        "name": "nori-ui-playground",
        "slug": "nori-ui-playground",
        "version": "0.0.0",
        "orientation": "portrait",
        "newArchEnabled": true,
        "ios": { "supportsTablet": true, "bundleIdentifier": "dev.noriui.playground" },
        "android": { "package": "dev.noriui.playground" },
        "web": { "bundler": "metro" },
        "plugins": []
    }
}
```

- [ ] **Step 4: `apps/playground-native/index.ts`.**

```ts
import { registerRootComponent } from 'expo';
import { App } from './App';

registerRootComponent(App);
```

- [ ] **Step 5: `apps/playground-native/App.tsx`** — smoke screen mirroring the web one.

```tsx
import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import { NoriProvider, useTheme } from 'nori-ui/client';

function SmokeContent() {
    const theme = useTheme();
    return (
        <View style={{ padding: 24, gap: 12 }}>
            <Text testID="title" style={{ fontSize: 22, fontWeight: '600' }}>
                nori-ui playground (native)
            </Text>
            <Text>Primary token value resolved from @nori-ui/tokens:</Text>
            <View
                testID="primary-swatch"
                style={{
                    width: 96,
                    height: 32,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
            <Text testID="primary-hex">{theme.color.primary['500']}</Text>
        </View>
    );
}

export function App() {
    return (
        <NoriProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar />
                <SmokeContent />
            </SafeAreaView>
        </NoriProvider>
    );
}
```

- [ ] **Step 6: Install.**

```bash
yarn install
```

If Expo complains about version mismatches, run `yarn workspace playground-native npx expo install --check` and adjust `package.json` versions to match Expo's expectations, then `yarn install` again. Log any version bumps.

- [ ] **Step 7: Commit.**

```bash
git add apps/playground-native/ package.json yarn.lock
git commit -m "feat(playground-native): scaffold expo sdk 55 + new architecture"
```

---

## Task 6 — NativeWind + Metro config in playground-native

**Files:**
- Create: `apps/playground-native/babel.config.js`
- Create: `apps/playground-native/metro.config.js`
- Create: `apps/playground-native/tailwind.config.ts`
- Create: `apps/playground-native/global.css`

- [ ] **Step 1: `apps/playground-native/babel.config.js`.**

```js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    };
};
```

- [ ] **Step 2: `apps/playground-native/metro.config.js`.** Enables workspace-aware resolution + NativeWind + CSS.

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the full monorepo so workspace packages update on change.
config.watchFolders = [workspaceRoot];

// Look up modules from both the app's node_modules and the workspace root's.
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Allow symlinked workspace packages.
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 3: `apps/playground-native/tailwind.config.ts`** — reuses the preset.

```ts
import type { Config } from 'tailwindcss';
import noriPreset from '@nori-ui/tokens/tailwind-preset';

const config: Config = {
    presets: [noriPreset],
    content: [
        './App.tsx',
        './index.ts',
        '../../packages/ui/src/**/*.{ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
};

export default config;
```

Note: NativeWind ships its own Tailwind preset that must be included alongside the token preset. Order matters — token preset first so NativeWind's style handlers apply to the token colors.

- [ ] **Step 4: `apps/playground-native/global.css`.** Required by NativeWind v4.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Install NativeWind.**

```bash
yarn workspace playground-native add nativewind@^4 tailwindcss@^3.4
# NativeWind peer deps:
yarn workspace playground-native add react-native-reanimated@~4.1.0 react-native-safe-area-context@5.6.0
```

- [ ] **Step 6: Bundle the app once to confirm Metro is happy.**

```bash
cd apps/playground-native && yarn expo export --platform web && cd ../..
```

Expected: `dist/` produced. If Metro fails, most common causes: NativeWind version mismatch, missing Reanimated Babel plugin, or Metro resolver paths wrong — fix and retry.

- [ ] **Step 7: Commit.**

```bash
git add apps/playground-native/babel.config.js apps/playground-native/metro.config.js apps/playground-native/tailwind.config.ts apps/playground-native/global.css apps/playground-native/package.json yarn.lock
git commit -m "feat(playground-native): wire nativewind v4, metro workspace resolution, tokens preset"
```

---

## Task 7 — Playwright install + smoke test

**Files:**
- Create: `e2e/web/playwright.config.ts`
- Create: `e2e/web/package.json`
- Create: `e2e/web/tests/smoke.spec.ts`

- [ ] **Step 1: Create `e2e/web/package.json`** as a separate workspace (keeps e2e deps out of the library).

```json
{
    "name": "@nori-ui/e2e-web",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "test": "playwright test",
        "test:headed": "playwright test --headed",
        "codegen": "playwright codegen http://localhost:5173",
        "install:browsers": "playwright install --with-deps chromium"
    },
    "devDependencies": {
        "@playwright/test": "^1.48",
        "@axe-core/playwright": "^4.10",
        "playwright": "^1.48"
    }
}
```

- [ ] **Step 2: Update root `package.json` workspaces** to include `e2e/*`.

```json
{
    "workspaces": [
        "packages/*",
        "apps/*",
        "tooling",
        "e2e/*"
    ]
}
```

- [ ] **Step 3: Install.**

```bash
yarn install
yarn workspace @nori-ui/e2e-web install:browsers
```

- [ ] **Step 4: `e2e/web/playwright.config.ts`.**

```ts
import { defineConfig, devices } from '@playwright/test';

// Hosts the playground-web dev server for the whole test run.
export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        baseURL: 'http://localhost:5173',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'yarn workspace playground-web dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
```

- [ ] **Step 5: `e2e/web/tests/smoke.spec.ts`.**

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('web playground smoke', () => {
    test('renders the title and primary swatch from @nori-ui/tokens', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('title')).toHaveText('nori-ui playground (web)');
        const swatch = page.getByTestId('primary-swatch');
        await expect(swatch).toBeVisible();
        const hex = await page.getByTestId('primary-hex').textContent();
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('passes axe-core a11y audit on the smoke page', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
});
```

- [ ] **Step 6: Run.**

```bash
yarn workspace @nori-ui/e2e-web test
```

Expected: 2 passed. Playwright boots the Vite dev server automatically, runs the tests, shuts the server down.

- [ ] **Step 7: Add `playwright-report/` to `.gitignore`.**

```
# playwright
e2e/web/playwright-report/
e2e/web/test-results/
```

- [ ] **Step 8: Commit.**

```bash
git add e2e/web/ package.json .gitignore yarn.lock
git commit -m "test(e2e): add playwright smoke test for playground-web with axe a11y audit"
```

---

## Task 8 — Maestro flow YAML for playground-native

**Files:**
- Create: `e2e/native/flows/smoke.yaml`
- Create: `e2e/native/README.md`

- [ ] **Step 1: `e2e/native/flows/smoke.yaml`.**

```yaml
# Maestro smoke flow for playground-native.
# Run locally with:
#   cd apps/playground-native && yarn ios  # or yarn android, start a dev build
#   maestro test e2e/native/flows/smoke.yaml
#
# Requires Maestro CLI installed: https://maestro.mobile.dev

appId: dev.noriui.playground
---
- launchApp
- assertVisible:
    id: 'title'
- assertVisible:
    id: 'primary-swatch'
- assertVisible:
    id: 'primary-hex'
```

- [ ] **Step 2: `e2e/native/README.md`** (dual-audience: humans + LLMs).

```markdown
# Maestro native e2e

## Prerequisites

- Maestro CLI: `curl -Ls 'https://get.maestro.mobile.dev' | bash`
- iOS simulator (Xcode) or Android emulator
- `apps/playground-native` built for a dev client

## Running the smoke flow

```bash
cd apps/playground-native
yarn ios      # or yarn android — start the app
# in another shell:
maestro test e2e/native/flows/smoke.yaml
```

Expected: 3 asserts pass (title, swatch, hex).

## CI

Maestro in CI is set up in Plan 07 (release pipeline). v0.1 Maestro runs locally on dev machines.
```

- [ ] **Step 3: Commit.**

```bash
git add e2e/native/
git commit -m "test(e2e): add maestro smoke flow + README for playground-native"
```

---

## Task 9 — Root convenience scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Append to root `scripts`:**

```json
{
    "scripts": {
        "dev:web": "yarn workspace playground-web dev",
        "dev:native": "yarn workspace playground-native start",
        "dev:storybook": "yarn workspace playground-web storybook",
        "build:storybook": "yarn workspace playground-web build:storybook",
        "test:e2e:web": "yarn workspace @nori-ui/e2e-web test",
        "e2e:browsers": "yarn workspace @nori-ui/e2e-web install:browsers"
    }
}
```

- [ ] **Step 2: Commit.**

```bash
git add package.json
git commit -m "chore: add dev / e2e convenience scripts to root package"
```

---

## Task 10 — CI: Playwright job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add a new job** after `quality`.

Full updated `ci.yml`:

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
            - uses: actions/checkout@v4
            - run: corepack enable
            - uses: actions/setup-node@v4
              with:
                  node-version: 20
                  cache: yarn
            - run: yarn install --immutable
            - run: yarn build:tokens
            - name: Verify tokens/build is up to date
              run: |
                  if [[ -n "$(git status --porcelain packages/tokens/build/)" ]]; then
                      echo "::error::tokens/build is stale — commit regenerated outputs."
                      git --no-pager diff packages/tokens/build/
                      exit 1
                  fi
            - run: yarn biome check .
            - run: yarn eslint .
            - run: yarn typecheck
            - run: yarn test
            - run: yarn size

    e2e-web:
        name: playwright (chromium)
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
            - name: Install Playwright browsers
              run: yarn e2e:browsers
            - name: Run Playwright tests
              run: yarn test:e2e:web
            - name: Upload Playwright report on failure
              if: failure()
              uses: actions/upload-artifact@v4
              with:
                  name: playwright-report
                  path: e2e/web/playwright-report/
                  retention-days: 7
```

- [ ] **Step 2: Commit.**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add playwright e2e job for playground-web"
```

---

## Task 11 — Final verification

- [ ] **Step 1: Full local green-build.**

```bash
yarn install --immutable
yarn build:tokens
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
yarn build:storybook
yarn test:e2e:web
```

All exit 0.

- [ ] **Step 2: Confirm both playgrounds boot** in a quick manual check.

```bash
# web
yarn dev:web &
sleep 5
curl -sf http://localhost:5173 | grep -q "nori-ui playground" && echo WEB_OK
kill %1 2>/dev/null

# native — skip unless you have a simulator/emulator up; Maestro is manual in v0.1
```

- [ ] **Step 3: Commit if anything changed** (shouldn't).

```bash
git status
git add -A && git commit -m "chore: finalize playground apps scaffold" || true
```

---

## Done criteria for Plan 04

- [ ] `yarn dev:web` boots Vite on :5173 with the smoke page rendering `@nori-ui/tokens` theme values.
- [ ] `yarn dev:native` starts Metro + Expo on the workspace app.
- [ ] `yarn dev:storybook` boots Storybook 8 on :6006 with the PlaceholderSmoke story visible.
- [ ] `yarn test:e2e:web` runs Playwright + axe — 2 tests passing.
- [ ] `maestro test e2e/native/flows/smoke.yaml` runs locally against a booted playground-native.
- [ ] CI's Playwright job is green.
- [ ] Both playgrounds depend on `nori-ui` + `@nori-ui/tokens` via workspace:* (no published versions referenced).
- [ ] NativeWind is wired in both: Tailwind preset from `@nori-ui/tokens` is loaded; NativeWind preset is loaded alongside it on native.
- [ ] `storybook-static/`, `playwright-report/`, `test-results/` are gitignored.

When all boxes are ticked, Plan 04 is complete and Plan 05 (v0.1 components) can begin.

---

## Errata (post-execution notes)

1. **`test(e2e): …` commit scope is rejected by commitlint.** The repo's `scope-case = kebab-case` rule blocks scopes containing digits. Use `test(playground-web)` and `test(native)` (or equivalent) instead. Later plans (05a–05d, 06, 07) that use `test(e2e):` scopes must do the same swap.
2. **Expo-managed version bumps via `npx expo install --check`** (applies to Plan 04 Task 5 Step 6 and any future Expo bumps):
   - `expo-status-bar`: `~55.0.0` (plan's `~2.3.0` was pre-SDK-55 versioning)
   - `react-native`: `0.83.6` (plan said `0.83.0`)
   - `react-native-reanimated`: `~4.2.0` (plan said `~4.1.0`)
   - `react-native-safe-area-context`: `~5.6.2` (plan said `5.6.0`)
   - `react-native-screens`: `~4.23.0` (plan said `4.20.0`)
   - Add `react-native-worklets@^0.8.1` — new Reanimated peer dep.
3. **Duplicate `presets` field in Task 6's `tailwind.config.ts`** — combine into one array: `presets: [noriPreset, require('nativewind/preset')]`.
4. **`App.tsx` needs a `<main>` landmark** for axe-core to pass. Use `<main>` (not `<div>`) as the outer element when the smoke page renders page-level content.
5. **`nativewind-env.d.ts` is auto-generated** by NativeWind on first `expo export`. Commit the file as-is (NativeWind also patches `tsconfig.json` to include it).
6. **Storybook 8.6.x (not 10.x)** — React 19 support in the 8.4+ line. Upgrading to 10.x is a future plan.
7. **React 19.2.5 vs Expo-recommended 19.2.0** is a 0.5-patch delta — leave unless native surface regressions appear; then pin via `resolutions` in the root `package.json`.
8. **Final chore commit message should describe the actual diff** — don't commit a no-op "finalize" message when there's a substantive change. Match the message to the change.
