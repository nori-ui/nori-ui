// Bundler-specific CSF discovery — kept in its own file because
// `import.meta` cannot be compiled to CommonJS, which ts-jest's default
// transform produces. The Jest config redirects this module to a stub
// during tests so the parser never sees `import.meta`.
//
// Production callers come from Metro (require.context) or Vite
// (import.meta.glob). Both static-string call sites must remain verbatim
// — each bundler's static analyser matches the AST shape literally and
// rewrites it at build time.

import type { CsfModule, RequireContext } from './csf-loader';

declare const require: {
    (id: string): unknown;
    context?: (directory: string, useSubdirectories: boolean, regExp: RegExp) => RequireContext;
};

export function discoverCsfModules(): Record<string, CsfModule> {
    // Vite / Rollup — `import.meta.glob` statically transformed at build time.
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
        // import.meta access can throw in non-ESM contexts — fall through.
    }

    // Metro / webpack — `require.context` static call rewritten at bundle time.
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
        // require may be undefined under pure ESM — fall through.
    }

    return {};
}
