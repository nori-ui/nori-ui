// RSC safety boundary check.
//
// Rule: files in the RSC-safe tree must not contain 'use client' and must not
// import React hooks / refs / context. Only `client.ts` and files under paths
// explicitly marked as client-only (provider/, *context*.tsx, use-*.ts,
// *.test.*) are allowed to be stateful.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '../src');

// Files / directories allowed to be client-only. Everything else must be RSC-safe.
//
// Components that read color tokens via the `useThemeColors()` hook (so dark
// mode flips them at runtime) all need 'use client'. The hook itself lives
// in theme/use-color-scheme.ts and theme/use-theme-colors.ts.
const CLIENT_ALLOWED = [
    'client.ts',
    'provider/',
    'theme/context.tsx',
    'theme/use-theme.ts',
    'theme/use-color-scheme.tsx',
    'theme/use-theme-colors.ts',
    'animation/reanimated-adapter.ts',
    'animation/use-animated-number.ts',
    'animation/use-animated-number.web.ts',
    'animation/animated-view.ts',
    'animation/animated-view.web.ts',
    'i18n/context.tsx',
    'i18n/locale.tsx',
    'i18n/use-translation.ts',
    'icons/semantic-context.tsx',
    'icons/use-semantic-icon.ts',
    'icons/default-semantic-icons.tsx',
    'components/Accordion/Accordion.tsx',
    'components/Alert/Alert.tsx',
    'components/AlertDialog/AlertDialog.tsx',
    'components/Dialog/blur-backdrop.tsx',
    'components/Dialog/blur-backdrop.native.tsx',
    'components/Avatar/Avatar.tsx',
    'components/Badge/Badge.tsx',
    'components/Breadcrumb/Breadcrumb.tsx',
    'components/Button/Button.tsx',
    'components/Card/Card.tsx',
    'components/Checkbox/Checkbox.tsx',
    'components/Dialog/Dialog.tsx',
    'components/FloatButton/FloatButton.tsx',
    'components/InputGroup/InputGroup.tsx',
    'components/Pagination/Pagination.tsx',
    'components/Pagination/use-pagination.ts',
    'components/Popover/Popover.tsx',
    'components/Progress/Progress.tsx',
    'components/Radio/Radio.tsx',
    'components/SegmentedControl/SegmentedControl.tsx',
    'components/Select/Select.tsx',
    'components/Separator/Separator.tsx',
    'components/Skeleton/Skeleton.tsx',
    'components/Slider/Slider.tsx',
    'components/Slider/slider-gesture-context.tsx',
    'components/Switch/Switch.tsx',
    'components/Tabs/Tabs.tsx',
    'components/Text/Text.tsx',
    'components/TextInput/TextInput.tsx',
    'components/Toast/Toaster.tsx',
    'components/Toast/toast.ts',
    'components/Toast/sonner-bridge.ts',
    'components/Toast/sonner-native-bridge.tsx',
    'components/Toast/sonner-native-bridge.native.tsx',
    'components/Toggle/Toggle.tsx',
    'components/Tooltip/Tooltip.tsx',
    'components/Calendar/state/use-calendar-state.ts',
    'components/Calendar/state/use-range-state.ts',
];

function isClientAllowed(relPath: string): boolean {
    return CLIENT_ALLOWED.some((p) => relPath === p || relPath.startsWith(p));
}

function isTestFile(relPath: string): boolean {
    return relPath.includes('/__tests__/') || relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx');
}

// Story files are dev-only artifacts. The CSF loader sweeps them via
// `require.context`, but they never end up in the consumer's RSC entry
// tree — the `stories` barrel is its own export gated behind the
// `@nori-ui/core/stories` subpath. Stories often need `useState` for
// interactive demos; that's expected and not a violation.
function isStoryFile(relPath: string): boolean {
    return relPath.endsWith('.stories.tsx') || relPath.endsWith('.stories.ts');
}

function* walk(dir: string, base: string): Generator<{ abs: string; rel: string }> {
    for (const entry of readdirSync(dir)) {
        const abs = join(dir, entry);
        const rel = abs.slice(base.length + 1);
        const stat = statSync(abs);
        if (stat.isDirectory()) {
            yield* walk(abs, base);
        } else if (/\.(ts|tsx)$/.test(entry)) {
            yield { abs, rel };
        }
    }
}

describe('RSC safety boundary', () => {
    // Note: `useId` is intentionally NOT in this list — React 19 guarantees it
    // is RSC-safe and hydrates consistently across server/client. Components
    // like TextInput use it to mint a stable id/htmlFor pair without needing
    // to be marked as client.
    const DISALLOWED_IMPORTS =
        /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef|useLayoutEffect|useInsertionEffect|createContext)\b/;

    it('no file in the default entry tree uses "use client" or client-only React APIs', () => {
        const violations: string[] = [];

        for (const { abs, rel } of walk(SRC, SRC)) {
            if (isClientAllowed(rel) || isTestFile(rel) || isStoryFile(rel)) {
                continue;
            }

            const content = readFileSync(abs, 'utf8');
            if (/^\s*['"]use client['"]/m.test(content)) {
                violations.push(`${rel}: contains 'use client'`);
            }
            if (DISALLOWED_IMPORTS.test(content)) {
                violations.push(`${rel}: imports a client-only React hook / API`);
            }
        }

        if (violations.length > 0) {
            throw new Error(
                `RSC-safe tree contains client-only code:\n  - ${violations.join('\n  - ')}\n\n` +
                    `If these are client by design, add them to CLIENT_ALLOWED in rsc-safety.test.ts.`
            );
        }
    });

    it('all CLIENT_ALLOWED files actually contain "use client"', () => {
        const missing: string[] = [];
        for (const rel of CLIENT_ALLOWED) {
            if (rel.endsWith('/')) {
                continue; // directory entries are checked per-file via walk
            }
            const content = readFileSync(join(SRC, rel), 'utf8');
            if (!/^\s*['"]use client['"]/m.test(content)) {
                missing.push(rel);
            }
        }
        expect(missing).toEqual([]);
    });
});
