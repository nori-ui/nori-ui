// CSF loader — discovers every `*.stories.tsx` file under `../components`
// at bundle time via Metro's `require.context`, normalises the CSF default
// export + named story exports into the `ComponentEntry` shape consumed by
// the native playground.
//
// This is the runtime side of the "CSF as the single source of truth"
// architecture (see `docs/superpowers/specs/2026-04-28-playground-showcase-design.md`).
// It deliberately handles only the CSF surface the existing stories use:
//   - default.title (string)
//   - default.component (component)
//   - default.args (object, optional)
//   - default.render (function, optional)
//   - named exports: each with optional `args` and optional `render`
// `parameters`, `decorators`, `loaders`, and `play` are ignored.

import { type ComponentType, createElement, type ReactNode } from 'react';

export type Story = {
    /** kebab-case story id (export name, kebab-cased) */
    id: string;
    /** Humanised story title (export name, spaced) */
    title: string;
    /** Component that renders this story with its merged args */
    render: ComponentType<Record<string, never>>;
};

export type ComponentEntry = {
    /** kebab-case slug (last segment of CSF title, kebab-cased) */
    slug: string;
    /** Display name (last segment of CSF title) */
    name: string;
    /** Stories in CSF declaration order */
    stories: Story[];
};

/**
 * Convert PascalCase → kebab-case. `'WithGap'` → `'with-gap'`.
 *
 * Splits only at lowercase→uppercase boundaries so leading acronyms stay
 * intact: `'HStack'` → `'hstack'`, `'AlertDialog'` → `'alert-dialog'`.
 * This matches the docs MDX filename convention (`hstack.mdx`, not
 * `h-stack.mdx`).
 */
export function pascalToKebab(s: string): string {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert PascalCase → "With Gap" for display. Same boundary rule as
 * pascalToKebab (only lowercase→uppercase splits).
 */
export function humanise(s: string): string {
    const spaced = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type CsfModule = {
    default: {
        title: string;
        component?: ComponentType<unknown>;
        args?: Record<string, unknown>;
        render?: (args: Record<string, unknown>) => unknown;
    };
    [key: string]: unknown;
};

type RequireContext = {
    keys(): string[];
    (path: string): CsfModule;
};

// Ambient `require.context` typing for Metro/webpack. We avoid pulling
// @types/node or @types/webpack-env into the lib build by declaring just
// the surface we touch. The optional chain on `.context` plus the
// `typeof require` runtime check keeps this safe when neither extension
// is present.
declare const require: {
    (id: string): unknown;
    context?: (directory: string, useSubdirectories: boolean, regExp: RegExp) => RequireContext;
};

// Metro and webpack both expose `require.context`. Tests stub this via
// `__setCsfModules` below.
let testModules: Record<string, CsfModule> | null = null;

/** Test-only: inject CSF modules so Jest can exercise the loader logic. */
export function __setCsfModules(modules: Record<string, CsfModule> | null): void {
    testModules = modules;
}

function readModules(): Record<string, CsfModule> {
    if (testModules) {
        return testModules;
    }

    // Bundler matrix:
    //   - Metro (playground-native): supports `require.context` when
    //     `transformer.unstable_allowRequireContext` is enabled.
    //   - Vite (playground-web, web Storybook on Vite): supports
    //     `import.meta.glob` natively and statically transforms it at
    //     build time.
    //   - tsup / Node / Jest: neither is available; loader returns {}.
    //     Tests use `__setCsfModules` to inject fixtures instead.
    //
    // Both calls below are static-string forms so each bundler's
    // analyzer can pick them up. The unsupported path returns undefined
    // at runtime and we fall through.

    // Vite / Rollup — `import.meta.glob` is statically transformed at
    // build time. The literal call below MUST stay verbatim so Vite's
    // glob-import plugin recognises and replaces it. We guard with
    // `typeof` checks so runtimes without `import.meta` (CJS dist) hit
    // the fallback below instead of throwing.
    try {
        // biome-ignore lint/suspicious/noExplicitAny: `glob` is a Vite extension to ImportMeta
        const meta = import.meta as any;
        if (meta && typeof meta.glob === 'function') {
            // biome-ignore lint/suspicious/noExplicitAny: Vite types live in `vite/client` which we don't pull in
            const modules = (import.meta as any).glob('../components/**/*.stories.tsx', { eager: true }) as Record<
                string,
                CsfModule
            >;
            if (modules && Object.keys(modules).length > 0) {
                return modules;
            }
        }
    } catch {
        // import.meta access can throw in non-ESM contexts — ignore.
    }

    // Metro / webpack — `require.context` is a Metro/webpack extension
    // not part of standard CommonJS. The literal `require.context(...)`
    // call below MUST stay verbatim because Metro's static analyzer
    // matches the exact AST shape and transforms it at bundle time. The
    // try/catch lets non-Metro/webpack runtimes (Node, Vite) fail
    // gracefully when `require` is undefined or `.context` is missing.
    try {
        if (typeof require === 'function' && typeof require.context === 'function') {
            const ctx = require.context('../components', true, /\.stories\.tsx$/);
            const out: Record<string, CsfModule> = {};
            for (const key of ctx.keys()) {
                out[key] = ctx(key);
            }
            return out;
        }
    } catch {
        // require may be undefined under pure ESM — ignore.
    }

    return {};
}

export function buildComponents(modules: Record<string, CsfModule>): ComponentEntry[] {
    const entries: ComponentEntry[] = [];
    for (const path of Object.keys(modules)) {
        const mod = modules[path];
        const meta = mod?.default;
        if (!meta || typeof meta.title !== 'string') {
            continue;
        }

        const titleLast = meta.title.split('/').pop() ?? meta.title;
        const slug = pascalToKebab(titleLast);

        const stories: Story[] = [];
        // Object.keys preserves declaration order for own string keys
        // (per ECMAScript spec). We rely on this for "stories in CSF
        // declaration order".
        for (const key of Object.keys(mod)) {
            if (key === 'default') {
                continue;
            }
            const story = mod[key] as
                | { args?: Record<string, unknown>; render?: (a: Record<string, unknown>) => unknown }
                | undefined;
            if (!story || typeof story !== 'object') {
                continue;
            }

            const mergedArgs: Record<string, unknown> = { ...(meta.args ?? {}), ...(story.args ?? {}) };
            const renderFn = story.render ?? meta.render;
            const Component = meta.component;

            const Render: ComponentType<Record<string, never>> = renderFn
                ? () => renderFn(mergedArgs) as ReactNode
                : Component
                  ? () => createElement(Component as ComponentType<Record<string, unknown>>, mergedArgs)
                  : () => null;

            stories.push({
                id: pascalToKebab(key),
                title: humanise(key),
                render: Render,
            });
        }

        if (stories.length === 0) {
            continue;
        }

        entries.push({ slug, name: titleLast, stories });
    }

    entries.sort((a, b) => a.slug.localeCompare(b.slug));
    return entries;
}

/** Native playground's source of truth for components + stories. */
export const components: ComponentEntry[] = buildComponents(readModules());
