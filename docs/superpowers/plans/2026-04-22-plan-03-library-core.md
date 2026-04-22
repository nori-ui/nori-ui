# Plan 03 — Library Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational primitives every component (Plan 05) depends on: the `cn()` class-merger, the `<Slot>` primitive for `asChild` composition, the i18n runtime with i18next-shape `t()`, the theme provider + hook, the swappable semantic-icon registry + `<Icon>` wrapper, and the RSC-safe / client-entry split (`unbogify-ui` vs `unbogify-ui/client`). Ship these with behavior tests that a consumer can audit.

**Architecture:** `packages/ui/src/` is split into tightly-scoped modules — one concern per folder (`slot/`, `i18n/`, `theme/`, `icons/`, `utils/`). The default entry (`src/index.ts`) re-exports only RSC-safe pieces (types, pure functions, pure components); stateful pieces (`UnbogifyProvider`, hooks) live under `src/client.ts` with `'use client'` at the top. The package's `exports` map exposes both entries plus subpath exports per module so consumers can cherry-pick.

**Tech Stack:** React 19 (peer dep + workspace dev dep). No React Native yet — v0.1 component code in Plan 05 adds RN; Plan 03 stays platform-agnostic so the core modules work in RSC, jsdom, and native environments unchanged.

**Applies Plan 01 + 02 errata:** no `-W` flag; workspace-specific devDeps go in the workspace; Biome 2.x config is authoritative; `packages/tokens` is the tokens package location.

---

## File Structure

**Created in this plan:**
```
packages/ui/src/utils/cn.ts
packages/ui/src/utils/__tests__/cn.test.ts

packages/ui/src/slot/slot.tsx
packages/ui/src/slot/compose-refs.ts
packages/ui/src/slot/index.ts
packages/ui/src/slot/__tests__/slot.test.tsx

packages/ui/src/i18n/types.ts
packages/ui/src/i18n/default-dictionary.ts
packages/ui/src/i18n/resolve.ts
packages/ui/src/i18n/context.tsx
packages/ui/src/i18n/use-translation.ts
packages/ui/src/i18n/index.ts
packages/ui/src/i18n/__tests__/resolve.test.ts
packages/ui/src/i18n/__tests__/context.test.tsx

packages/ui/src/theme/context.tsx
packages/ui/src/theme/use-theme.ts
packages/ui/src/theme/__tests__/context.test.tsx
(existing from Plan 02:) packages/ui/src/theme/index.ts — extended to re-export the hook's type only

packages/ui/src/icons/icon.tsx
packages/ui/src/icons/semantic-context.tsx
packages/ui/src/icons/use-semantic-icon.ts
packages/ui/src/icons/default-semantic-icons.ts
packages/ui/src/icons/index.ts
packages/ui/src/icons/__tests__/icon.test.tsx
packages/ui/src/icons/__tests__/semantic.test.tsx

packages/ui/src/provider/unbogify-provider.tsx
packages/ui/src/provider/index.ts

packages/ui/src/client.ts                     (new — 'use client' entry)
packages/ui/src/index.ts                      (modified — pure RSC-safe barrel)
packages/ui/__tests__/rsc-safety.test.ts      (grep-based boundary test)

packages/ui/jest.config.cjs                   (modified — add jsdom environment for *.tsx tests)
packages/ui/package.json                      (modified — exports map + react peer/dev deps)
```

---

## Task 1 — Install React + testing-library, update Jest for DOM tests

**Files:**
- Modify: `packages/ui/package.json` (add deps)
- Modify: `packages/ui/jest.config.cjs` (jsdom env for `.tsx` tests)

- [ ] **Step 1: Install React 19 + testing libs in the ui workspace.**

```bash
yarn workspace unbogify-ui add react@^19 react-dom@^19
yarn workspace unbogify-ui add -D @types/react @types/react-dom @testing-library/react@^16 @testing-library/jest-dom@^6 jest-environment-jsdom@^29
```

Rationale: `react` + `react-dom` as runtime deps (later demoted to peerDependencies in Plan 07's publish prep). `@testing-library/react` v16 targets React 19. `jest-environment-jsdom` required for DOM-rendering tests.

- [ ] **Step 2: Mark react/react-dom as peer + runtime** in `packages/ui/package.json`. Add `peerDependencies` block and keep them in `dependencies` for workspace resolution:

```json
{
    "dependencies": {
        "@unbogify/tokens": "workspace:*",
        "react": "^19",
        "react-dom": "^19"
    },
    "peerDependencies": {
        "react": "^19",
        "react-dom": "^19"
    },
    "peerDependenciesMeta": {
        "react-dom": { "optional": true }
    }
}
```

- [ ] **Step 3: Update `packages/ui/jest.config.cjs`** to select jsdom for `.tsx` tests, keeping node for `.ts` tests.

```js
const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: 'unbogify-ui',
    projects: [
        {
            ...base,
            displayName: 'unbogify-ui:node',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
        {
            ...base,
            displayName: 'unbogify-ui:jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
            setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
    ],
};
```

- [ ] **Step 4: Create `packages/ui/jest.setup.ts`.** Registers `@testing-library/jest-dom` matchers.

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Verify Jest still runs.**

```bash
yarn workspace unbogify-ui test
```

Expected: 2 passed (the smoke test from Plan 01).

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/package.json packages/ui/jest.config.cjs packages/ui/jest.setup.ts yarn.lock
git commit -m "chore(ui): add react 19 + testing-library, split jest into node + jsdom projects"
```

---

## Task 2 — `cn()` class-name helper

**Files:**
- Create: `packages/ui/src/utils/cn.ts`
- Create: `packages/ui/src/utils/__tests__/cn.test.ts`

- [ ] **Step 1: Write the failing test first** (TDD).

`packages/ui/src/utils/__tests__/cn.test.ts`:

```ts
import { cn } from '../cn';

describe('cn', () => {
    it('concatenates truthy strings with single spaces', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('drops falsy values', () => {
        expect(cn('a', undefined, null, false, '', 0, 'b')).toBe('a b');
    });

    it('expands object syntax, keeping only truthy keys', () => {
        expect(cn('base', { active: true, disabled: false, loading: 1 })).toBe('base active loading');
    });

    it('flattens nested arrays', () => {
        expect(cn('a', ['b', ['c', 'd']], 'e')).toBe('a b c d e');
    });

    it('returns empty string when no inputs produce classes', () => {
        expect(cn()).toBe('');
        expect(cn(undefined, null, false, '')).toBe('');
    });

    it('preserves class ordering (last wins at call-site if consumer wants override)', () => {
        expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-red-500 text-blue-500');
    });
});
```

- [ ] **Step 2: Run to confirm failure.**

```bash
yarn workspace unbogify-ui test cn.test
```

Expected: FAIL — `cn` not exported.

- [ ] **Step 3: Implement `packages/ui/src/utils/cn.ts`.**

```ts
// cn — class-name merger. clsx-compatible shape.
//
// Intentionally does NOT deduplicate Tailwind conflicts (e.g. "text-sm text-lg").
// That's `tailwind-merge`'s job; we defer adding it until a component actually
// needs it, to keep the core tree-shakable and the runtime zero-dep.

export type ClassInput =
    | string
    | number
    | boolean
    | null
    | undefined
    | ClassInput[]
    | Record<string, boolean | number | null | undefined>;

export function cn(...inputs: ClassInput[]): string {
    const out: string[] = [];
    for (const input of inputs) append(out, input);
    return out.join(' ');
}

function append(out: string[], input: ClassInput): void {
    if (!input) return;
    if (typeof input === 'string') {
        if (input.length > 0) out.push(input);
        return;
    }
    if (typeof input === 'number') return; // numbers are never class names
    if (Array.isArray(input)) {
        for (const inner of input) append(out, inner);
        return;
    }
    if (typeof input === 'object') {
        for (const key of Object.keys(input)) {
            if (input[key]) out.push(key);
        }
    }
}
```

- [ ] **Step 4: Run the test — should pass.**

```bash
yarn workspace unbogify-ui test cn.test
```

Expected: 6 passed.

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/utils/
git commit -m "feat(ui): add cn() class-name helper with clsx-compatible shape"
```

---

## Task 3 — `composeRefs` helper (needed by Slot and forwardRef-ing components)

**Files:**
- Create: `packages/ui/src/slot/compose-refs.ts`

- [ ] **Step 1: Write `packages/ui/src/slot/compose-refs.ts`.**

```ts
// composeRefs — merges multiple React refs (callback or object) into a single callback.
// Derived from Radix UI's approach; reimplemented here so we don't take a Radix dependency.

import type { MutableRefObject, Ref, RefCallback } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

export function composeRefs<T>(...refs: Array<PossibleRef<T>>): RefCallback<T> {
    return (node: T | null) => {
        for (const ref of refs) {
            if (ref == null) continue;
            if (typeof ref === 'function') {
                ref(node);
            } else {
                // React's MutableRefObject typing — we assign .current directly.
                (ref as MutableRefObject<T | null>).current = node;
            }
        }
    };
}
```

- [ ] **Step 2: Commit.**

```bash
git add packages/ui/src/slot/compose-refs.ts
git commit -m "feat(ui): add composeRefs helper for merging refs"
```

---

## Task 4 — `<Slot>` primitive (underpins `asChild`)

**Files:**
- Create: `packages/ui/src/slot/slot.tsx`
- Create: `packages/ui/src/slot/index.ts`
- Create: `packages/ui/src/slot/__tests__/slot.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/ui/src/slot/__tests__/slot.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef, forwardRef } from 'react';
import { Slot } from '../slot';

describe('<Slot>', () => {
    it('renders the single child, passing Slot props down', () => {
        render(
            <Slot data-testid="slot" className="outer">
                <button type="button" className="inner">
                    click
                </button>
            </Slot>,
        );
        const btn = screen.getByTestId('slot');
        expect(btn.tagName).toBe('BUTTON');
        expect(btn).toHaveClass('inner');
        expect(btn).toHaveClass('outer');
    });

    it('merges className in "outer inner" order so child wins on conflicts', () => {
        render(
            <Slot className="outer">
                <span className="inner" data-testid="s" />
            </Slot>,
        );
        expect(screen.getByTestId('s').className).toBe('outer inner');
    });

    it('forwards refs to the child DOM node', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Slot ref={ref}>
                <button type="button">x</button>
            </Slot>,
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('merges refs when child already has one', () => {
        const outer = createRef<HTMLButtonElement>();
        const inner = createRef<HTMLButtonElement>();
        render(
            <Slot ref={outer}>
                <button type="button" ref={inner}>
                    x
                </button>
            </Slot>,
        );
        expect(outer.current).toBeInstanceOf(HTMLButtonElement);
        expect(inner.current).toBe(outer.current);
    });

    it('composes event handlers — both outer and inner onClick fire, outer first', () => {
        const outer = jest.fn();
        const inner = jest.fn();
        render(
            <Slot onClick={outer}>
                <button type="button" onClick={inner} data-testid="s">
                    x
                </button>
            </Slot>,
        );
        fireEvent.click(screen.getByTestId('s'));
        expect(outer).toHaveBeenCalledTimes(1);
        expect(inner).toHaveBeenCalledTimes(1);
    });

    it('passes style objects with outer as base, inner overriding', () => {
        render(
            <Slot style={{ color: 'red', fontSize: 14 }}>
                <span style={{ color: 'blue' }} data-testid="s" />
            </Slot>,
        );
        const el = screen.getByTestId('s');
        expect(el).toHaveStyle({ color: 'blue', fontSize: '14px' });
    });

    it('accepts polymorphic children — e.g. a custom component that forwards props', () => {
        const MyLink = forwardRef<HTMLAnchorElement, { className?: string; children?: React.ReactNode; href?: string }>(
            ({ className, href, children }, ref) => (
                <a ref={ref} className={className} href={href} data-testid="link">
                    {children}
                </a>
            ),
        );
        MyLink.displayName = 'MyLink';

        render(
            <Slot className="styled">
                <MyLink href="/x">go</MyLink>
            </Slot>,
        );
        const link = screen.getByTestId('link');
        expect(link).toHaveClass('styled');
        expect(link).toHaveAttribute('href', '/x');
    });
});
```

- [ ] **Step 2: Run — should fail.**

```bash
yarn workspace unbogify-ui test slot.test
```

Expected: FAIL — `Slot` not found.

- [ ] **Step 3: Implement `packages/ui/src/slot/slot.tsx`.**

```tsx
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, ReactElement, Ref } from 'react';
import { composeRefs } from './compose-refs';

type AnyProps = Record<string, unknown>;

export type SlotProps = {
    children?: React.ReactNode;
} & AnyProps;

export const Slot = forwardRef<unknown, SlotProps>(function Slot(props, forwardedRef) {
    const { children, ...slotProps } = props;

    if (!isValidElement(children)) {
        return null;
    }

    // Assert that children is a single React element with props — we've narrowed above.
    const child = Children.only(children) as ReactElement<AnyProps> & { ref?: Ref<unknown> };
    const merged = mergeProps(slotProps, child.props);

    // Merge refs: Slot's forwarded ref + the child's own ref (if any).
    const childRef = (child as unknown as { ref?: Ref<unknown> }).ref;
    if (forwardedRef || childRef) {
        (merged as AnyProps).ref = composeRefs(forwardedRef, childRef);
    }

    return cloneElement(child, merged);
});
Slot.displayName = 'Slot';

function mergeProps(outer: AnyProps, inner: AnyProps): AnyProps {
    // Inner (child) wins for everything except: className (concatenated), style (merged), and
    // event handlers (composed — outer runs first, then inner).
    const merged: AnyProps = { ...outer };

    for (const key of Object.keys(inner)) {
        const outerValue = outer[key];
        const innerValue = inner[key];

        if (key === 'className' || key === 'class') {
            merged[key] = joinClass(outerValue, innerValue);
            continue;
        }

        if (key === 'style') {
            merged[key] = { ...(outerValue as CSSProperties | undefined), ...(innerValue as CSSProperties | undefined) };
            continue;
        }

        if (isEventHandler(key, outerValue, innerValue)) {
            merged[key] = composeHandlers(outerValue as Fn, innerValue as Fn);
            continue;
        }

        merged[key] = innerValue;
    }

    return merged;
}

function joinClass(outer: unknown, inner: unknown): string | undefined {
    const a = typeof outer === 'string' ? outer : '';
    const b = typeof inner === 'string' ? inner : '';
    const joined = [a, b].filter(Boolean).join(' ');
    return joined.length > 0 ? joined : undefined;
}

type Fn = (...args: unknown[]) => unknown;

function isEventHandler(key: string, outer: unknown, inner: unknown): boolean {
    if (!key.startsWith('on') || key.length < 3) return false;
    if (key[2] !== key[2]?.toUpperCase()) return false;
    return typeof outer === 'function' && typeof inner === 'function';
}

function composeHandlers(outer: Fn, inner: Fn): Fn {
    return (...args: unknown[]) => {
        outer(...args);
        inner(...args);
    };
}
```

- [ ] **Step 4: Write `packages/ui/src/slot/index.ts` barrel.**

```ts
export { Slot, type SlotProps } from './slot';
export { composeRefs } from './compose-refs';
```

- [ ] **Step 5: Run the test — should pass.**

```bash
yarn workspace unbogify-ui test slot.test
```

Expected: 7 passed.

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/slot/
git commit -m "feat(ui): add Slot primitive for asChild composition pattern"
```

---

## Task 5 — i18n types and default dictionary

**Files:**
- Create: `packages/ui/src/i18n/types.ts`
- Create: `packages/ui/src/i18n/default-dictionary.ts`

- [ ] **Step 1: Write `packages/ui/src/i18n/types.ts`.** This is the public contract — every string override target.

```ts
// i18n types — API shape intentionally mirrors i18next so consumers who already use
// i18next can pass their `t` function directly to <UnbogifyProvider i18n={t}>.

/** Options accepted by the library's internal t() calls. Subset of i18next's TOptions. */
export type I18nOptions = {
    /** Used for pluralization (e.g. `items_one` vs `items_other`). */
    count?: number;
    /** Default text to render if the key is missing from the active dictionary. */
    defaultValue?: string;
    /** Any other key is an interpolation value — consumed by {{var}} replacement. */
    [key: string]: unknown;
};

/** Shape-compatible with i18next's TFunction, narrowed for library usage. */
export type TranslateFn = (key: string | string[], options?: I18nOptions) => string;

/**
 * Consumer-facing i18n input. One of:
 *   - undefined: use library defaults
 *   - TranslateFn: call it (this is the i18next drop-in path)
 *   - Dictionary: flat key → value map; value may contain `{{vars}}` and/or `_one|_other` plural suffixes
 */
export type I18nInput = TranslateFn | Dictionary | undefined;

export type Dictionary = Readonly<Record<string, string>>;

/**
 * Keys shipped by the library — augmentable by consumers via module augmentation:
 *
 * ```ts
 * declare module 'unbogify-ui' {
 *     interface I18nKeys {
 *         'myApp.customLabel': string;
 *     }
 * }
 * ```
 *
 * Plan 05 extends this interface as each component registers its keys.
 */
export interface I18nKeys {
    // seeded by default-dictionary.ts — every key is a member
}
```

- [ ] **Step 2: Write `packages/ui/src/i18n/default-dictionary.ts`.** Seed with a small set of strings the library itself uses internally. Plan 05 extends this as components arrive.

```ts
import type { Dictionary } from './types';

/**
 * Default English strings used by library components.
 *
 * Key naming convention:
 *   <component>.<purpose>[_plural-form]
 *
 * Plural suffixes follow i18next: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`.
 * Interpolation uses `{{name}}` — double braces, no spaces, by convention.
 */
export const defaultDictionary: Dictionary = {
    // generic / shared
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.loading': 'Loading',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',

    // button
    'button.loadingLabel': 'Loading',

    // input
    'input.clear': 'Clear',
    'input.passwordShow': 'Show password',
    'input.passwordHide': 'Hide password',

    // checkbox / switch
    'checkbox.checked': 'Checked',
    'checkbox.unchecked': 'Unchecked',
    'switch.on': 'On',
    'switch.off': 'Off',
};
```

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/src/i18n/types.ts packages/ui/src/i18n/default-dictionary.ts
git commit -m "feat(ui): seed i18n types and default English dictionary"
```

---

## Task 6 — i18n `resolve()` — dictionary-or-function → TranslateFn

**Files:**
- Create: `packages/ui/src/i18n/resolve.ts`
- Create: `packages/ui/src/i18n/__tests__/resolve.test.ts`

- [ ] **Step 1: Write the test first.**

`packages/ui/src/i18n/__tests__/resolve.test.ts`:

```ts
import { resolveI18n } from '../resolve';
import type { Dictionary } from '../types';

describe('resolveI18n', () => {
    const defaults: Dictionary = {
        'greet': 'Hello',
        'greet.named': 'Hello, {{name}}',
        'items_one': '{{count}} item',
        'items_other': '{{count}} items',
    };

    it('returns a function that reads from the default dictionary when input is undefined', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('greet')).toBe('Hello');
    });

    it('interpolates {{vars}} from options', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('greet.named', { name: 'Alice' })).toBe('Hello, Alice');
    });

    it('picks plural suffix based on count', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('items', { count: 0 })).toBe('0 items');
        expect(t('items', { count: 1 })).toBe('1 item');
        expect(t('items', { count: 5 })).toBe('5 items');
    });

    it('falls back to the key when a dictionary entry is missing and no defaultValue is given', () => {
        const t = resolveI18n({}, defaults);
        expect(t('unknown.key')).toBe('unknown.key');
    });

    it('uses options.defaultValue when key is missing', () => {
        const t = resolveI18n({}, defaults);
        expect(t('unknown.key', { defaultValue: 'fallback' })).toBe('fallback');
    });

    it('overrides defaults via a flat dictionary input', () => {
        const t = resolveI18n({ greet: 'Hi' } as Dictionary, defaults);
        expect(t('greet')).toBe('Hi');
        // unmapped keys still fall back to defaults:
        expect(t('greet.named', { name: 'Bob' })).toBe('Hello, Bob');
    });

    it('calls through to a consumer-provided TranslateFn verbatim (i18next drop-in)', () => {
        const consumerT = jest.fn((key: string | string[], opts?: Record<string, unknown>) => `CONSUMER(${String(key)})`);
        const t = resolveI18n(consumerT, defaults);
        expect(t('greet')).toBe('CONSUMER(greet)');
        expect(consumerT).toHaveBeenCalledWith('greet', undefined);
    });

    it('accepts an array of keys — returns the first resolved one', () => {
        const t = resolveI18n({}, defaults);
        expect(t(['missing.a', 'missing.b', 'greet'])).toBe('Hello');
    });
});
```

- [ ] **Step 2: Run — should fail.** `resolveI18n` not exported.

- [ ] **Step 3: Implement `packages/ui/src/i18n/resolve.ts`.**

```ts
import type { Dictionary, I18nInput, I18nOptions, TranslateFn } from './types';

/**
 * Normalizes the consumer's i18n input (undefined | dictionary | function) into a
 * uniform TranslateFn. Internal code only calls the returned function.
 *
 * Precedence for a given key lookup:
 *   1. consumer function (if provided) — called verbatim, no further fallback
 *   2. consumer dictionary (if provided)
 *   3. library defaults
 *   4. options.defaultValue
 *   5. the key itself (so missing strings are visible in dev, not silent)
 */
export function resolveI18n(input: I18nInput, defaults: Dictionary): TranslateFn {
    if (typeof input === 'function') {
        return input;
    }

    const dict = input ?? {};

    return (keyOrKeys, options) => {
        const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
        for (const rawKey of keys) {
            const key = pluralize(rawKey, options?.count);
            const template = dict[key] ?? defaults[key];
            if (template !== undefined) {
                return interpolate(template, options);
            }
        }
        // exhausted the key list
        const lastKey = keys[keys.length - 1];
        if (options?.defaultValue !== undefined) {
            return interpolate(options.defaultValue, options);
        }
        return lastKey ?? '';
    };
}

function pluralize(key: string, count: number | undefined): string {
    if (count === undefined) return key;
    // Minimal English pluralization — extend with ICU rules later if needed.
    if (count === 1) return `${key}_one`;
    return `${key}_other`;
}

function interpolate(template: string, options: I18nOptions | undefined): string {
    if (!options) return template;
    return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? '' : String(value);
    });
}
```

- [ ] **Step 4: Run the tests — should pass (8 cases).**

```bash
yarn workspace unbogify-ui test resolve.test
```

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/i18n/resolve.ts packages/ui/src/i18n/__tests__/resolve.test.ts
git commit -m "feat(ui): add i18n resolver for dict/function/default inputs with interpolation and plurals"
```

---

## Task 7 — i18n context + `useTranslation` hook

**Files:**
- Create: `packages/ui/src/i18n/context.tsx`
- Create: `packages/ui/src/i18n/use-translation.ts`
- Create: `packages/ui/src/i18n/__tests__/context.test.tsx`

- [ ] **Step 1: Write the test.**

`packages/ui/src/i18n/__tests__/context.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../context';
import { useTranslation } from '../use-translation';

function Greeter({ nameKey }: { nameKey?: string }) {
    const { t } = useTranslation();
    return <span data-testid="g">{t(nameKey ?? 'greet')}</span>;
}

describe('<I18nProvider> + useTranslation()', () => {
    it('returns defaults when no provider wraps the tree', () => {
        render(<Greeter nameKey="common.cancel" />);
        expect(screen.getByTestId('g')).toHaveTextContent('Cancel');
    });

    it('uses provider dictionary when given', () => {
        render(
            <I18nProvider i18n={{ 'common.cancel': 'Abbrechen' }}>
                <Greeter nameKey="common.cancel" />
            </I18nProvider>,
        );
        expect(screen.getByTestId('g')).toHaveTextContent('Abbrechen');
    });

    it('uses provider function (i18next drop-in) when given', () => {
        const t = jest.fn((key: string | string[]) => `T(${String(key)})`);
        render(
            <I18nProvider i18n={t}>
                <Greeter nameKey="common.cancel" />
            </I18nProvider>,
        );
        expect(screen.getByTestId('g')).toHaveTextContent('T(common.cancel)');
    });
});
```

- [ ] **Step 2: Implement `packages/ui/src/i18n/context.tsx`.**

```tsx
'use client';

import { createContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { defaultDictionary } from './default-dictionary';
import { resolveI18n } from './resolve';
import type { I18nInput, TranslateFn } from './types';

export type I18nContextValue = {
    t: TranslateFn;
};

// Default context value uses the built-in English dictionary; consumers without
// a provider still get a working t().
const defaultValue: I18nContextValue = {
    t: resolveI18n(undefined, defaultDictionary),
};

export const I18nContext = createContext<I18nContextValue>(defaultValue);
I18nContext.displayName = 'I18nContext';

export type I18nProviderProps = {
    i18n?: I18nInput;
    children?: ReactNode;
};

export function I18nProvider({ i18n, children }: I18nProviderProps) {
    const value = useMemo<I18nContextValue>(() => ({ t: resolveI18n(i18n, defaultDictionary) }), [i18n]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
```

- [ ] **Step 3: Implement `packages/ui/src/i18n/use-translation.ts`.**

```ts
'use client';

import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './context';

export function useTranslation(): I18nContextValue {
    return useContext(I18nContext);
}
```

- [ ] **Step 4: Run the test — should pass (3 cases).**

```bash
yarn workspace unbogify-ui test context.test
```

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/i18n/context.tsx packages/ui/src/i18n/use-translation.ts packages/ui/src/i18n/__tests__/context.test.tsx
git commit -m "feat(ui): add I18nProvider and useTranslation hook"
```

---

## Task 8 — i18n public barrel

**Files:**
- Create: `packages/ui/src/i18n/index.ts`

- [ ] **Step 1: Write `packages/ui/src/i18n/index.ts`.** Splits exports so RSC-safe pieces (types + resolve + defaults) stay importable from server components; the provider and hook are re-exported from `src/client.ts`.

```ts
// RSC-safe i18n exports.
// Provider + hook live in './context' and './use-translation' — these are re-exported
// from packages/ui/src/client.ts (which has 'use client'), NOT from here.

export { defaultDictionary } from './default-dictionary';
export { resolveI18n } from './resolve';
export type { Dictionary, I18nInput, I18nKeys, I18nOptions, TranslateFn } from './types';
```

- [ ] **Step 2: Commit.**

```bash
git add packages/ui/src/i18n/index.ts
git commit -m "feat(ui): add i18n public barrel (rsc-safe subset)"
```

---

## Task 9 — Theme context and `useTheme` hook

**Files:**
- Create: `packages/ui/src/theme/context.tsx`
- Create: `packages/ui/src/theme/use-theme.ts`
- Create: `packages/ui/src/theme/__tests__/context.test.tsx`
- Modify: `packages/ui/src/theme/index.ts`

- [ ] **Step 1: Write the test.**

`packages/ui/src/theme/__tests__/context.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { theme as defaultTheme, type Theme } from '@unbogify/tokens';
import { ThemeProvider } from '../context';
import { useTheme } from '../use-theme';

function PrimaryColorDisplay() {
    const t = useTheme();
    return <span data-testid="c">{t.color.primary['500']}</span>;
}

describe('<ThemeProvider> + useTheme()', () => {
    it('returns the default light theme when no provider wraps the tree', () => {
        render(<PrimaryColorDisplay />);
        expect(screen.getByTestId('c')).toHaveTextContent(defaultTheme.color.primary['500']);
    });

    it('returns the provided theme when a provider is present', () => {
        const custom: Theme = {
            ...defaultTheme,
            color: {
                ...defaultTheme.color,
                primary: { ...defaultTheme.color.primary, '500': '#ff00ff' },
            },
        };
        render(
            <ThemeProvider theme={custom}>
                <PrimaryColorDisplay />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('c')).toHaveTextContent('#ff00ff');
    });
});
```

- [ ] **Step 2: Implement `packages/ui/src/theme/context.tsx`.**

```tsx
'use client';

import { createContext } from 'react';
import type { ReactNode } from 'react';
import { theme as defaultTheme, type Theme } from '@unbogify/tokens';

export const ThemeContext = createContext<Theme>(defaultTheme);
ThemeContext.displayName = 'ThemeContext';

export type ThemeProviderProps = {
    theme?: Theme;
    children?: ReactNode;
};

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
```

- [ ] **Step 3: Implement `packages/ui/src/theme/use-theme.ts`.**

```ts
'use client';

import { useContext } from 'react';
import { ThemeContext } from './context';

export function useTheme() {
    return useContext(ThemeContext);
}
```

- [ ] **Step 4: Leave `packages/ui/src/theme/index.ts` RSC-safe** — it already re-exports type + constants from `@unbogify/tokens` (Plan 02). Do not add provider/hook exports here — those go in `client.ts`.

- [ ] **Step 5: Run the test.**

```bash
yarn workspace unbogify-ui test theme/__tests__/context
```

Expected: 2 passed.

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/theme/context.tsx packages/ui/src/theme/use-theme.ts packages/ui/src/theme/__tests__/
git commit -m "feat(ui): add ThemeProvider and useTheme hook"
```

---

## Task 10 — `<Icon>` wrapper component (RSC-safe)

**Files:**
- Create: `packages/ui/src/icons/icon.tsx`
- Create: `packages/ui/src/icons/__tests__/icon.test.tsx`

- [ ] **Step 1: Write the test.**

`packages/ui/src/icons/__tests__/icon.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { Icon } from '../icon';

const Glyph = forwardRef<SVGSVGElement, { size?: number; color?: string }>(function Glyph({ size, color }, ref) {
    return <svg ref={ref} data-testid="g" width={size} height={size} color={color} />;
});

describe('<Icon>', () => {
    it('renders the `as` component with the given numeric size', () => {
        render(<Icon as={Glyph} size={24} />);
        const svg = screen.getByTestId('g');
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
    });

    it('maps keyword size to pixels', () => {
        render(<Icon as={Glyph} size="md" />);
        const svg = screen.getByTestId('g');
        expect(svg).toHaveAttribute('width', '20'); // md = 20
    });

    it('passes through color as a prop to the icon component', () => {
        render(<Icon as={Glyph} size={16} color="#ff0000" />);
        expect(screen.getByTestId('g')).toHaveAttribute('color', '#ff0000');
    });

    it('defaults to size md when no size prop is given', () => {
        render(<Icon as={Glyph} />);
        expect(screen.getByTestId('g')).toHaveAttribute('width', '20');
    });
});
```

- [ ] **Step 2: Implement `packages/ui/src/icons/icon.tsx`.**

```tsx
import type { ComponentType } from 'react';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type IconComponentProps = {
    size?: number;
    color?: string;
};

export type IconProps = {
    as: ComponentType<IconComponentProps>;
    size?: IconSize;
    color?: string;
};

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

/**
 * Thin wrapper around an icon component. Consumer imports the icon they want
 * from any library (e.g. lucide-react-native) and passes it as `as`. No registry,
 * no runtime lookup — tree-shaking is automatic.
 *
 * RSC-safe: pure render, no hooks, no refs.
 */
export function Icon({ as: IconComponent, size = 'md', color }: IconProps) {
    const numericSize = typeof size === 'number' ? size : SIZE_MAP[size];
    return <IconComponent size={numericSize} color={color} />;
}
```

- [ ] **Step 3: Run the test — should pass (4 cases).**

```bash
yarn workspace unbogify-ui test icon.test
```

- [ ] **Step 4: Commit.**

```bash
git add packages/ui/src/icons/icon.tsx packages/ui/src/icons/__tests__/icon.test.tsx
git commit -m "feat(ui): add RSC-safe Icon wrapper with keyword + numeric size"
```

---

## Task 11 — Semantic-icon registry (default + provider override)

**Files:**
- Create: `packages/ui/src/icons/default-semantic-icons.ts`
- Create: `packages/ui/src/icons/semantic-context.tsx`
- Create: `packages/ui/src/icons/use-semantic-icon.ts`
- Create: `packages/ui/src/icons/__tests__/semantic.test.tsx`

- [ ] **Step 1: Write `packages/ui/src/icons/default-semantic-icons.ts`.** Tiny placeholder SVG components serve as defaults — Lucide is declared optional; if a consumer doesn't install Lucide, internal components still render legible shapes. Consumers can override via the provider.

```tsx
// default-semantic-icons — minimal built-in SVG placeholders for internal
// library glyphs. Consumers can swap each one via the provider:
//
//   <UnbogifyProvider icons={{ checkmark: MyCheck, close: MyX }}>
//
// These defaults exist so the library renders usable UI out of the box even when
// lucide-react(-native) is not installed. They are NOT intended to compete with
// Lucide on style — override them to match your design system.

import type { ComponentType } from 'react';
import type { IconComponentProps } from './icon';

type SemanticIcon = ComponentType<IconComponentProps>;

const make = (path: string): SemanticIcon =>
    function PlaceholderIcon({ size = 20, color = 'currentColor' }) {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={path} />
            </svg>
        );
    };

export type SemanticIcons = {
    checkmark: SemanticIcon;
    close: SemanticIcon;
    eye: SemanticIcon;
    eyeOff: SemanticIcon;
    chevronDown: SemanticIcon;
    chevronUp: SemanticIcon;
    alertTriangle: SemanticIcon;
    info: SemanticIcon;
    check: SemanticIcon;
    x: SemanticIcon;
};

export const defaultSemanticIcons: SemanticIcons = {
    checkmark: make('M20 6 9 17l-5-5'),
    close: make('M18 6 6 18 M6 6l12 12'),
    eye: make('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
    eyeOff: make('M17.94 17.94A10 10 0 0 1 2 12s3.5-7 10-7c2 0 3.8.6 5.4 1.5 M1 1l22 22'),
    chevronDown: make('m6 9 6 6 6-6'),
    chevronUp: make('m18 15-6-6-6 6'),
    alertTriangle: make('M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
    info: make('M12 8h.01 M11 12h1v4h1 M12 22C6.48 22 2 17.52 2 12 2 6.48 6.48 2 12 2c5.52 0 10 4.48 10 10 0 5.52-4.48 10-10 10z'),
    check: make('M20 6 9 17l-5-5'),
    x: make('M18 6 6 18 M6 6l12 12'),
};
```

- [ ] **Step 2: Write `packages/ui/src/icons/semantic-context.tsx`.**

```tsx
'use client';

import { createContext } from 'react';
import type { ReactNode } from 'react';
import { defaultSemanticIcons, type SemanticIcons } from './default-semantic-icons';

export const SemanticIconsContext = createContext<SemanticIcons>(defaultSemanticIcons);
SemanticIconsContext.displayName = 'SemanticIconsContext';

export type SemanticIconsProviderProps = {
    icons?: Partial<SemanticIcons>;
    children?: ReactNode;
};

export function SemanticIconsProvider({ icons, children }: SemanticIconsProviderProps) {
    const merged: SemanticIcons = icons ? { ...defaultSemanticIcons, ...icons } : defaultSemanticIcons;
    return <SemanticIconsContext.Provider value={merged}>{children}</SemanticIconsContext.Provider>;
}
```

- [ ] **Step 3: Write `packages/ui/src/icons/use-semantic-icon.ts`.**

```ts
'use client';

import { useContext } from 'react';
import { SemanticIconsContext } from './semantic-context';
import type { SemanticIcons } from './default-semantic-icons';

export function useSemanticIcon<K extends keyof SemanticIcons>(name: K): SemanticIcons[K] {
    const icons = useContext(SemanticIconsContext);
    return icons[name];
}
```

- [ ] **Step 4: Write the test `packages/ui/src/icons/__tests__/semantic.test.tsx`.**

```tsx
import { render, screen } from '@testing-library/react';
import { useSemanticIcon } from '../use-semantic-icon';
import { SemanticIconsProvider } from '../semantic-context';

function CheckmarkRenderer() {
    const Mark = useSemanticIcon('checkmark');
    return <Mark size={16} />;
}

describe('semantic icons', () => {
    it('renders the default checkmark SVG when no provider', () => {
        const { container } = render(<CheckmarkRenderer />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders an overridden icon when provider supplies one', () => {
        function CustomMark({ size }: { size?: number }) {
            return <span data-testid="custom">mark-{size}</span>;
        }
        render(
            <SemanticIconsProvider icons={{ checkmark: CustomMark }}>
                <CheckmarkRenderer />
            </SemanticIconsProvider>,
        );
        expect(screen.getByTestId('custom')).toHaveTextContent('mark-16');
    });
});
```

- [ ] **Step 5: Run the tests — should pass (2 cases).**

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/icons/default-semantic-icons.ts packages/ui/src/icons/semantic-context.tsx packages/ui/src/icons/use-semantic-icon.ts packages/ui/src/icons/__tests__/semantic.test.tsx
git commit -m "feat(ui): add semantic-icons registry with provider override"
```

---

## Task 12 — Icons public barrel

**Files:**
- Create: `packages/ui/src/icons/index.ts`

- [ ] **Step 1: Write `packages/ui/src/icons/index.ts`.**

```ts
// RSC-safe icons exports. Provider + hook live under `./semantic-context` and
// `./use-semantic-icon`; both are re-exported from packages/ui/src/client.ts.

export { Icon, type IconProps, type IconSize, type IconComponentProps } from './icon';
export { defaultSemanticIcons, type SemanticIcons } from './default-semantic-icons';
```

- [ ] **Step 2: Commit.**

```bash
git add packages/ui/src/icons/index.ts
git commit -m "feat(ui): add icons public barrel"
```

---

## Task 13 — `UnbogifyProvider` composition (theme + i18n + semantic icons)

**Files:**
- Create: `packages/ui/src/provider/unbogify-provider.tsx`
- Create: `packages/ui/src/provider/index.ts`

- [ ] **Step 1: Write `packages/ui/src/provider/unbogify-provider.tsx`.** Composes all three client providers into one so consumers only wrap the app once.

```tsx
'use client';

import type { ReactNode } from 'react';
import type { Theme } from '@unbogify/tokens';
import { I18nProvider } from '../i18n/context';
import type { I18nInput } from '../i18n/types';
import { SemanticIconsProvider } from '../icons/semantic-context';
import type { SemanticIcons } from '../icons/default-semantic-icons';
import { ThemeProvider } from '../theme/context';

export type UnbogifyProviderProps = {
    theme?: Theme;
    i18n?: I18nInput;
    icons?: Partial<SemanticIcons>;
    children?: ReactNode;
};

/**
 * Single root provider composing theme, i18n, and semantic-icons contexts.
 * Place near the root of your app. Only needed to override defaults — the
 * library works out of the box without any provider.
 */
export function UnbogifyProvider({ theme, i18n, icons, children }: UnbogifyProviderProps) {
    return (
        <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
                <SemanticIconsProvider icons={icons}>{children}</SemanticIconsProvider>
            </I18nProvider>
        </ThemeProvider>
    );
}
```

- [ ] **Step 2: Write `packages/ui/src/provider/index.ts`.**

```ts
export { UnbogifyProvider, type UnbogifyProviderProps } from './unbogify-provider';
```

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/src/provider/
git commit -m "feat(ui): add UnbogifyProvider composing theme/i18n/icons"
```

---

## Task 14 — Default entry (`src/index.ts`) — RSC-safe barrel

**Files:**
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Rewrite `packages/ui/src/index.ts` as a pure RSC-safe barrel.** Do NOT add `'use client'`. Do NOT re-export the provider or hooks.

```ts
// Public entry for `unbogify-ui`. RSC-safe exports only.
//
// Stateful / client-only surface (UnbogifyProvider, useTheme, useTranslation,
// SemanticIconsProvider, useSemanticIcon) lives in `unbogify-ui/client`.
// Consumers who use any hook or provider MUST import from `unbogify-ui/client`
// and add `'use client'` to the importing file.

// utilities
export { cn, type ClassInput } from './utils/cn';

// slot / composition
export { Slot, type SlotProps, composeRefs } from './slot';

// theme (RSC-safe subset: types + constants)
export { theme, themeDark, type Theme } from './theme';

// i18n (RSC-safe subset: types + defaults + resolver)
export {
    defaultDictionary,
    resolveI18n,
    type Dictionary,
    type I18nInput,
    type I18nKeys,
    type I18nOptions,
    type TranslateFn,
} from './i18n';

// icons (RSC-safe subset: wrapper component + type)
export { Icon, type IconProps, type IconSize, type IconComponentProps, type SemanticIcons, defaultSemanticIcons } from './icons';
```

- [ ] **Step 2: Commit.**

```bash
git add packages/ui/src/index.ts
git commit -m "feat(ui): rewrite default entry as RSC-safe barrel"
```

---

## Task 15 — Client entry (`src/client.ts`) — `'use client'` exports

**Files:**
- Create: `packages/ui/src/client.ts`

- [ ] **Step 1: Write `packages/ui/src/client.ts`.**

```ts
'use client';

// Client-only surface. This file is the ONLY one in the public API with
// 'use client' at the top. Everything it re-exports is safe to call from a
// client component; importing from here in a server component will cause the
// expected RSC boundary warning from Next.js.

// Re-export everything from the default entry for convenience — consumers can
// import from a single subpath when they're already in client code.
export * from './index';

// Providers + hooks (client-only)
export { UnbogifyProvider, type UnbogifyProviderProps } from './provider';
export { ThemeProvider, type ThemeProviderProps } from './theme/context';
export { useTheme } from './theme/use-theme';
export { I18nProvider, type I18nProviderProps } from './i18n/context';
export { useTranslation } from './i18n/use-translation';
export { SemanticIconsProvider, type SemanticIconsProviderProps } from './icons/semantic-context';
export { useSemanticIcon } from './icons/use-semantic-icon';
```

- [ ] **Step 2: Commit.**

```bash
git add packages/ui/src/client.ts
git commit -m "feat(ui): add client entry with use-client exports"
```

---

## Task 16 — Update `packages/ui/package.json` exports map

**Files:**
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Update the `exports` field.**

```json
{
    "exports": {
        ".": "./src/index.ts",
        "./client": "./src/client.ts",
        "./theme": "./src/theme/index.ts",
        "./i18n": "./src/i18n/index.ts",
        "./icons": "./src/icons/index.ts",
        "./slot": "./src/slot/index.ts",
        "./utils/cn": "./src/utils/cn.ts"
    }
}
```

Note: these point to source `.ts` — Plan 07 introduces the compiled build and flips `main`/`exports` to the dist tree.

- [ ] **Step 2: Verify typecheck.**

```bash
yarn typecheck
```

Expected: green.

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/package.json
git commit -m "chore(ui): add exports map for client / theme / i18n / icons / slot / utils subpaths"
```

---

## Task 17 — RSC-safety boundary test

**Files:**
- Create: `packages/ui/__tests__/rsc-safety.test.ts`

- [ ] **Step 1: Write `packages/ui/__tests__/rsc-safety.test.ts`.**

```ts
// RSC safety boundary check.
//
// Rule: files in the RSC-safe tree must not contain 'use client' and must not
// import React hooks / refs / context. Only `client.ts` and files under paths
// explicitly marked as client-only (provider/, *context*.tsx, use-*.ts,
// *.test.*) are allowed to be stateful.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '../src');

// Files / directories allowed to be client-only. Everything else must be RSC-safe.
const CLIENT_ALLOWED = [
    'client.ts',
    'provider/',
    'theme/context.tsx',
    'theme/use-theme.ts',
    'i18n/context.tsx',
    'i18n/use-translation.ts',
    'icons/semantic-context.tsx',
    'icons/use-semantic-icon.ts',
];

function isClientAllowed(relPath: string): boolean {
    return CLIENT_ALLOWED.some((p) => relPath === p || relPath.startsWith(p));
}

function isTestFile(relPath: string): boolean {
    return relPath.includes('/__tests__/') || relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx');
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
    const CLIENT_MARKERS = [
        /^\s*['"]use client['"]/m,
        /\bfrom ['"]react['"]/, // any React import is suspect in RSC tree — we then check the specific import
    ];

    const DISALLOWED_IMPORTS = /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef|useLayoutEffect|useInsertionEffect|useId|createContext)\b/;

    it('no file in the default entry tree uses "use client" or client-only React APIs', () => {
        const violations: string[] = [];

        for (const { abs, rel } of walk(SRC, SRC)) {
            if (isClientAllowed(rel) || isTestFile(rel)) continue;

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
                    `If these are client by design, add them to CLIENT_ALLOWED in rsc-safety.test.ts.`,
            );
        }
    });

    it('all CLIENT_ALLOWED files actually contain "use client"', () => {
        const missing: string[] = [];
        for (const rel of CLIENT_ALLOWED) {
            if (rel.endsWith('/')) continue; // directory entries are checked per-file via walk
            const content = readFileSync(join(SRC, rel), 'utf8');
            if (!/^\s*['"]use client['"]/m.test(content)) {
                missing.push(rel);
            }
        }
        expect(missing).toEqual([]);
    });
});
```

- [ ] **Step 2: Run the test.**

```bash
yarn workspace unbogify-ui test rsc-safety
```

Expected: 2 passed. If any violation is reported, fix the source file or add the path to `CLIENT_ALLOWED` — do NOT ignore.

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/__tests__/rsc-safety.test.ts
git commit -m "test(ui): add rsc-safety boundary test for default entry tree"
```

---

## Task 18 — Final verification

- [ ] **Step 1: Run the whole green-build sequence.**

```bash
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
```

Expected: all exit 0.

- [ ] **Step 2: Confirm the public surface by printing exports.**

```bash
node --input-type=module -e "console.log(Object.keys(await import('./packages/ui/src/index.ts').catch(() => ({ notLoadable: true }))))"
```

Import may fail because `.ts` isn't loadable in node without a loader; `yarn typecheck` is the authoritative check. Skip this step if node errors.

- [ ] **Step 3: Smoke-test the consumer story.** Write a throwaway TS file and confirm tsc sees the exports.

Create `packages/ui/__scratch__/consumer.ts`:

```ts
// Throwaway smoke file — DELETE after verifying.
import { cn, Slot, Icon, theme, type Theme, resolveI18n, defaultDictionary } from '../src/index';
import {
    UnbogifyProvider,
    useTheme,
    useTranslation,
    useSemanticIcon,
    ThemeProvider,
    I18nProvider,
    SemanticIconsProvider,
} from '../src/client';

void cn;
void Slot;
void Icon;
void theme;
void resolveI18n;
void defaultDictionary;
void UnbogifyProvider;
void useTheme;
void useTranslation;
void useSemanticIcon;
void ThemeProvider;
void I18nProvider;
void SemanticIconsProvider;

export type _UsedTheme = Theme;
```

Run:
```bash
yarn workspace unbogify-ui typecheck
```

Expected: green. Then delete the scratch file:

```bash
rm -rf packages/ui/__scratch__
```

- [ ] **Step 4: Final commit if anything changed during verification** (shouldn't).

```bash
git status
git add -A && git commit -m "chore(ui): finalize library core" || true
```

---

## Done criteria for Plan 03

- [ ] `cn()`, `<Slot>`, `composeRefs`, `<Icon>`, `defaultSemanticIcons` exported from `unbogify-ui` (RSC-safe).
- [ ] `UnbogifyProvider`, `ThemeProvider`, `useTheme`, `I18nProvider`, `useTranslation`, `SemanticIconsProvider`, `useSemanticIcon` exported from `unbogify-ui/client`.
- [ ] `Theme`, `Dictionary`, `I18nInput`, `I18nKeys`, `I18nOptions`, `TranslateFn`, `SemanticIcons`, `IconProps` types re-exported from the default entry.
- [ ] i18n works in all 3 input modes (undefined → defaults, dict, fn → i18next drop-in). Interpolation `{{var}}`, plural `_one`/`_other`, fallback to key.
- [ ] Slot correctly composes className, style, refs, event handlers — verified by 7 tests.
- [ ] RSC-safety boundary test passes: default entry tree has no `'use client'` and no hook imports.
- [ ] `yarn biome check`, `yarn eslint`, `yarn typecheck`, `yarn test`, `yarn size` all green.
- [ ] Total additional gzipped bundle for the whole core (no components yet): within first-import budget (≤ 40 KB gzip from spec §1 Success Criteria #2). `yarn size` tells you.

When all boxes are ticked, Plan 03 is complete and Plan 04 (Playground Apps) can begin.

---

## Errata (post-execution notes)

1. **Jest key name**: the correct Jest option is `setupFilesAfterEnv`, not `setupFilesAfterEach`. Task 1 Step 3 had the wrong key — use `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`.
2. **`resolveI18n` consumer-fn path**: Task 6's implementation `return input;` directly returns the consumer function. That works semantically but the test asserts `toHaveBeenCalledWith('greet', undefined)` — which fails when a direct function reference is called with 1 arg (React or caller drops the second). Wrap as `return (key, opts) => input(key, opts)` to preserve the arg shape.
3. **`default-semantic-icons.tsx` not `.ts`**: the file contains JSX (`<svg>…`), so it must have the `.tsx` extension for ts-jest to transform it. Update the File Structure entry to `default-semantic-icons.tsx`.
4. **`exactOptionalPropertyTypes` strictness**: the shared tsconfig enables `exactOptionalPropertyTypes: true`. In `icon.tsx` and `unbogify-provider.tsx`, pass-through of optional props requires conditional spreading so `undefined` is never explicitly passed. Example: `<IconComponent size={numericSize} {...(color !== undefined ? { color } : {})} />`. No runtime difference.
5. **Size-limit budget**: Plan 02 errata bumped `.size-limit.cjs` to 2 KB. After Plan 03 the core is ~2.07 KB brotli — bump to 4 KB. Still way under the spec's 40 KB first-import budget.
6. **React 19 `child.ref` deprecation**: Slot reads `child.ref` to merge refs (Radix-style). React 19 moves `ref` from a special prop to a regular prop and emits a runtime deprecation warning when you access `.ref` on a React element. Tests still pass. TODO for a later plan: migrate Slot to read `child.props.ref` once React 19's final semantics are locked.
7. **ESLint react-native plugin flags** 4 inline-style warnings in `slot.test.tsx` — test code intentionally uses inline styles to exercise the merge logic. Consider a test-file-scoped disable rule in `eslint.config.mjs` in a future cleanup pass.
