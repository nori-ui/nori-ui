# Plan 05a — Layout Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four layout primitives — `Text`, `Box`, `HStack`, `VStack` — each with unit tests (Jest + RNTL), a CSF story wired into the shared registry, Playwright coverage (web + axe a11y), and a Maestro flow (native). All four are pure-render, RSC-safe, and consume NativeWind classNames for styling.

**Architecture:** Each component lives under `packages/core/src/components/<Name>/` with a `<Name>.tsx`, `index.ts`, `<Name>.stories.tsx`, and a `__tests__/<Name>.test.tsx`. Components are written against `react-native` primitives (`Text`, `View`) so web resolves via `react-native-web` in the playground. All four use the `cn()` helper from Plan 03 to compose consumer `className` with internal defaults.

**Tech Stack:** React 19, react-native primitives, NativeWind v4 classNames (compiled at consumer build time), Jest + RNTL for unit tests, Playwright for web e2e, Maestro for native e2e.

**Applies all prior errata.**

---

## File Structure

**Created in this plan:**
```
packages/core/src/components/Text/Text.tsx
packages/core/src/components/Text/index.ts
packages/core/src/components/Text/Text.stories.tsx
packages/core/src/components/Text/__tests__/Text.test.tsx

packages/core/src/components/Box/Box.tsx
packages/core/src/components/Box/index.ts
packages/core/src/components/Box/Box.stories.tsx
packages/core/src/components/Box/__tests__/Box.test.tsx

packages/core/src/components/HStack/HStack.tsx
packages/core/src/components/HStack/index.ts
packages/core/src/components/HStack/HStack.stories.tsx
packages/core/src/components/HStack/__tests__/HStack.test.tsx

packages/core/src/components/VStack/VStack.tsx
packages/core/src/components/VStack/index.ts
packages/core/src/components/VStack/VStack.stories.tsx
packages/core/src/components/VStack/__tests__/VStack.test.tsx

packages/core/src/components/index.ts

e2e/web/tests/layout.spec.ts
e2e/native/flows/layout.yaml
```

**Modified:**
- `packages/core/src/index.ts` — re-export components
- `packages/core/src/stories/story-registry.ts` — append 4 story entries
- `packages/core/jest.config.cjs` — add react-native preset for .tsx tests rendering RN primitives

---

## Task 1 — Jest config: add react-native preset + setup

**Files:**
- Modify: `packages/core/jest.config.cjs`
- Create: `packages/core/jest.rn-setup.ts`

Components use RN primitives (`Text`, `View`) that need a testing shim in jsdom. RNTL's `@testing-library/react-native` resolves through a jest preset. Simplest path: alias `react-native` → `react-native-web` at the Jest module level so jsdom renders HTML equivalents.

- [ ] **Step 1: Install RN-Web for test target.**

```bash
yarn workspace @nori-ui/core add -D react-native-web@^0.19 @testing-library/react-native@^12
```

- [ ] **Step 2: Update `packages/core/jest.config.cjs`.**

```js
const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: '@nori-ui/core',
    projects: [
        {
            ...base,
            displayName: 'nori-ui:node',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/src/**/__tests__/**/*.test.ts',
                '<rootDir>/__tests__/**/*.test.ts',
            ],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
        {
            ...base,
            displayName: 'nori-ui:jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
            setupFilesAfterEnv: [
                '<rootDir>/jest.setup.ts',
                '<rootDir>/jest.rn-setup.ts',
            ],
            moduleNameMapper: {
                '^react-native$': 'react-native-web',
                '^react-native/(.*)$': 'react-native-web/$1',
            },
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
    ],
};
```

- [ ] **Step 3: Create `packages/core/jest.rn-setup.ts`.**

```ts
// RN-Web rendering shims. Keeps the jsdom project stable for both plain
// DOM tests (Slot, Icon wrapper) and RN-primitive tests (Text, Box, HStack, VStack).
//
// The key insight: react-native-web outputs real DOM nodes for <View> and <Text>,
// which RTL queries via role/text selectors. No bridge, no simulator.

// Silence RN's "useNativeDriver" warnings in jsdom — they're harmless for layout tests.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (first.includes('useNativeDriver')) return;
    originalWarn(...args);
};
```

- [ ] **Step 4: Run existing tests to confirm nothing broke.**

```bash
yarn workspace @nori-ui/core test
```

Expected: still 36 passed.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/jest.config.cjs packages/core/jest.rn-setup.ts packages/core/package.json yarn.lock
git commit -m "test(ui): alias react-native → react-native-web in jsdom jest project"
```

---

## Task 2 — `Text` component

**Files:**
- Create: `packages/core/src/components/Text/Text.tsx`
- Create: `packages/core/src/components/Text/index.ts`
- Create: `packages/core/src/components/Text/__tests__/Text.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/core/src/components/Text/__tests__/Text.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Text } from '../Text';

describe('<Text>', () => {
    it('renders children as text content', () => {
        render(<Text>hello</Text>);
        expect(screen.getByText('hello')).toBeInTheDocument();
    });

    it('applies the default variant class (body-md) when no variant is given', () => {
        render(<Text testID="t">hello</Text>);
        const el = screen.getByTestId('t');
        expect(el.className).toMatch(/\bbody-md\b|text-base|text-\[16px\]/);
    });

    it('applies the requested variant class when variant is specified', () => {
        render(<Text variant="heading-1" testID="t">Hi</Text>);
        expect(screen.getByTestId('t').className).toMatch(/heading-1|text-4xl|text-\[36px\]/);
    });

    it('forwards consumer className so consumer classes win at build time', () => {
        render(<Text className="custom-color" testID="t">hello</Text>);
        expect(screen.getByTestId('t')).toHaveClass('custom-color');
    });

    it('uses accessibilityRole="header" for heading variants (a11y)', () => {
        render(<Text variant="heading-1" testID="t">H</Text>);
        // RN-Web maps role="heading" via aria-level
        const el = screen.getByTestId('t');
        expect(el.getAttribute('role')).toBe('heading');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/Text/Text.tsx`.**

```tsx
import { Text as RNText } from 'react-native';
import type { TextProps as RNTextProps } from 'react-native';
import { cn } from '../../utils/cn';

export type TextVariant =
    | 'body-xs'
    | 'body-sm'
    | 'body-md'
    | 'body-lg'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3';

export type TextProps = RNTextProps & {
    variant?: TextVariant;
    className?: string;
    testID?: string;
};

const VARIANT_CLASSES: Record<TextVariant, string> = {
    'body-xs': 'text-xs leading-normal',
    'body-sm': 'text-sm leading-normal',
    'body-md': 'text-md leading-normal',
    'body-lg': 'text-lg leading-relaxed',
    'heading-1': 'text-4xl leading-tight font-bold',
    'heading-2': 'text-3xl leading-tight font-semibold',
    'heading-3': 'text-2xl leading-tight font-semibold',
};

const HEADING_VARIANTS: Readonly<Set<TextVariant>> = new Set(['heading-1', 'heading-2', 'heading-3']);

/**
 * Typography primitive. Renders a react-native <Text>; on web via RN-Web
 * it becomes a <div role="..."> with the appropriate className.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Text({ variant = 'body-md', className, testID, children, ...rest }: TextProps) {
    const isHeading = HEADING_VARIANTS.has(variant);
    return (
        <RNText
            testID={testID}
            accessibilityRole={isHeading ? 'header' : rest.accessibilityRole}
            className={cn(VARIANT_CLASSES[variant], className)}
            {...rest}
        >
            {children}
        </RNText>
    );
}
```

- [ ] **Step 3: Create `packages/core/src/components/Text/index.ts`.**

```ts
export { Text, type TextProps, type TextVariant } from './Text';
```

- [ ] **Step 4: Run the test — should pass.**

```bash
yarn workspace @nori-ui/core test Text.test
```

Expected: 5 passed. If the className regex doesn't match, NativeWind may strip classes before they reach jsdom — the test asserts a substring match, not a rendered CSS effect, so the className attribute should carry the classes verbatim.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/Text/Text.tsx packages/core/src/components/Text/index.ts packages/core/src/components/Text/__tests__/
git commit -m "feat(ui): add Text primitive with 7 variants and heading a11y role"
```

---

## Task 3 — `Box` component

**Files:**
- Create: `packages/core/src/components/Box/Box.tsx`
- Create: `packages/core/src/components/Box/index.ts`
- Create: `packages/core/src/components/Box/__tests__/Box.test.tsx`

- [ ] **Step 1: Write test.**

`packages/core/src/components/Box/__tests__/Box.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Box } from '../Box';

describe('<Box>', () => {
    it('renders children inside a View-backed element', () => {
        render(<Box testID="b">content</Box>);
        const el = screen.getByTestId('b');
        expect(el).toBeInTheDocument();
        expect(el).toHaveTextContent('content');
    });

    it('forwards className', () => {
        render(<Box className="p-4 bg-white" testID="b" />);
        expect(screen.getByTestId('b').className).toContain('p-4');
        expect(screen.getByTestId('b').className).toContain('bg-white');
    });

    it('accepts and forwards accessibility props', () => {
        render(
            <Box testID="b" accessibilityLabel="card" accessibilityRole="summary">
                c
            </Box>,
        );
        const el = screen.getByTestId('b');
        expect(el.getAttribute('aria-label')).toBe('card');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/Box/Box.tsx`.**

```tsx
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

export type BoxProps = ViewProps & {
    className?: string;
    testID?: string;
};

/**
 * Generic layout primitive. Wraps react-native's <View> with className support.
 * RSC-safe.
 */
export function Box({ className, children, ...rest }: BoxProps) {
    return (
        <View className={cn(className)} {...rest}>
            {children}
        </View>
    );
}
```

- [ ] **Step 3: Create `packages/core/src/components/Box/index.ts`.**

```ts
export { Box, type BoxProps } from './Box';
```

- [ ] **Step 4: Run.**

```bash
yarn workspace @nori-ui/core test Box.test
```

Expected: 3 passed.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/Box/
git commit -m "feat(ui): add Box layout primitive"
```

---

## Task 4 — `HStack` component

**Files:**
- Create: `packages/core/src/components/HStack/HStack.tsx`
- Create: `packages/core/src/components/HStack/index.ts`
- Create: `packages/core/src/components/HStack/__tests__/HStack.test.tsx`

- [ ] **Step 1: Write test.**

`packages/core/src/components/HStack/__tests__/HStack.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { HStack } from '../HStack';

describe('<HStack>', () => {
    it('applies flex-row by default', () => {
        render(<HStack testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('flex-row');
    });

    it('maps gap prop to a spacing class', () => {
        render(<HStack gap={4} testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('gap-4');
    });

    it('defaults gap to 0 (no gap class)', () => {
        render(<HStack testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).not.toMatch(/\bgap-\d/);
    });

    it('supports vertical alignment via align prop', () => {
        render(<HStack align="center" testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('items-center');
    });

    it('supports horizontal distribution via justify prop', () => {
        render(<HStack justify="between" testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('justify-between');
    });

    it('forwards consumer className after internal defaults', () => {
        render(<HStack className="bg-red-500" testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('bg-red-500');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/HStack/HStack.tsx`.**

```tsx
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type HStackProps = ViewProps & {
    gap?: StackGap;
    align?: StackAlign;
    justify?: StackJustify;
    className?: string;
    testID?: string;
};

const ALIGN_CLASS: Record<StackAlign, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
};

const JUSTIFY_CLASS: Record<StackJustify, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
};

/**
 * Horizontal flex layout primitive. RSC-safe.
 */
export function HStack({ gap, align, justify, className, children, ...rest }: HStackProps) {
    return (
        <View
            className={cn(
                'flex-row',
                gap !== undefined && gap !== 0 ? `gap-${gap}` : undefined,
                align !== undefined ? ALIGN_CLASS[align] : undefined,
                justify !== undefined ? JUSTIFY_CLASS[justify] : undefined,
                className,
            )}
            {...rest}
        >
            {children}
        </View>
    );
}
```

- [ ] **Step 3: Barrel + run + commit.**

`packages/core/src/components/HStack/index.ts`:

```ts
export { HStack, type HStackProps, type StackAlign, type StackGap, type StackJustify } from './HStack';
```

Then:

```bash
yarn workspace @nori-ui/core test HStack.test
# 6 passed
git add packages/core/src/components/HStack/
git commit -m "feat(ui): add HStack layout primitive with gap/align/justify"
```

---

## Task 5 — `VStack` component

**Files:**
- Create: `packages/core/src/components/VStack/VStack.tsx`
- Create: `packages/core/src/components/VStack/index.ts`
- Create: `packages/core/src/components/VStack/__tests__/VStack.test.tsx`

- [ ] **Step 1: Write test.**

`packages/core/src/components/VStack/__tests__/VStack.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { VStack } from '../VStack';

describe('<VStack>', () => {
    it('applies flex-col by default', () => {
        render(<VStack testID="s">x</VStack>);
        expect(screen.getByTestId('s').className).toContain('flex-col');
    });

    it('maps gap prop to a spacing class', () => {
        render(<VStack gap={6} testID="s">x</VStack>);
        expect(screen.getByTestId('s').className).toContain('gap-6');
    });

    it('supports align and justify props', () => {
        render(<VStack align="stretch" justify="center" testID="s">x</VStack>);
        const el = screen.getByTestId('s');
        expect(el.className).toContain('items-stretch');
        expect(el.className).toContain('justify-center');
    });

    it('forwards consumer className', () => {
        render(<VStack className="p-4" testID="s">x</VStack>);
        expect(screen.getByTestId('s').className).toContain('p-4');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/VStack/VStack.tsx`.** Reuses the same type vocabulary as HStack.

```tsx
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { cn } from '../../utils/cn';
import type { StackAlign, StackGap, StackJustify } from '../HStack/HStack';

export type VStackProps = ViewProps & {
    gap?: StackGap;
    align?: StackAlign;
    justify?: StackJustify;
    className?: string;
    testID?: string;
};

const ALIGN_CLASS: Record<StackAlign, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
};

const JUSTIFY_CLASS: Record<StackJustify, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
};

export function VStack({ gap, align, justify, className, children, ...rest }: VStackProps) {
    return (
        <View
            className={cn(
                'flex-col',
                gap !== undefined && gap !== 0 ? `gap-${gap}` : undefined,
                align !== undefined ? ALIGN_CLASS[align] : undefined,
                justify !== undefined ? JUSTIFY_CLASS[justify] : undefined,
                className,
            )}
            {...rest}
        >
            {children}
        </View>
    );
}
```

- [ ] **Step 3: Barrel + run + commit.**

`packages/core/src/components/VStack/index.ts`:

```ts
export { VStack, type VStackProps } from './VStack';
```

Then:

```bash
yarn workspace @nori-ui/core test VStack.test
# 4 passed
git add packages/core/src/components/VStack/
git commit -m "feat(ui): add VStack layout primitive"
```

---

## Task 6 — Component barrel + public exports

**Files:**
- Create: `packages/core/src/components/index.ts`
- Modify: `packages/core/src/index.ts` (re-export components)

- [ ] **Step 1: `packages/core/src/components/index.ts`.**

```ts
export * from './Text';
export * from './Box';
export * from './HStack';
export * from './VStack';
```

- [ ] **Step 2: Update `packages/core/src/index.ts`** by adding the components re-export. Insert this line in a logical position (near the other subsystem barrels):

```ts
// components (RSC-safe pure primitives)
export * from './components';
```

Full file should end up with, among other exports:

```ts
export * from './components';
export { cn, type ClassInput } from './utils/cn';
// ... rest unchanged
```

- [ ] **Step 3: Typecheck.**

```bash
yarn typecheck
```

- [ ] **Step 4: Commit.**

```bash
git add packages/core/src/components/index.ts packages/core/src/index.ts
git commit -m "feat(ui): re-export layout primitives from public entry"
```

---

## Task 7 — Stories + registry entries

**Files:**
- Create: `packages/core/src/components/Text/Text.stories.tsx`
- Create: `packages/core/src/components/Box/Box.stories.tsx`
- Create: `packages/core/src/components/HStack/HStack.stories.tsx`
- Create: `packages/core/src/components/VStack/VStack.stories.tsx`
- Modify: `packages/core/src/stories/story-registry.ts`

- [ ] **Step 1: `packages/core/src/components/Text/Text.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
    title: 'Primitives/Text',
    component: Text,
    argTypes: {
        variant: {
            control: 'select',
            options: ['body-xs', 'body-sm', 'body-md', 'body-lg', 'heading-1', 'heading-2', 'heading-3'],
        },
    },
    args: { children: 'The quick brown fox jumps over the lazy dog.' },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const BodyMd: Story = { args: { variant: 'body-md' } };
export const BodySm: Story = { args: { variant: 'body-sm' } };
export const Heading1: Story = { args: { variant: 'heading-1', children: 'Heading 1' } };
```

- [ ] **Step 2: `packages/core/src/components/Box/Box.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';

const meta: Meta<typeof Box> = {
    title: 'Primitives/Box',
    component: Box,
    args: { className: 'p-4 bg-primary-50 rounded-md', children: 'Box content' },
};
export default meta;

export const Default: StoryObj<typeof Box> = {};
```

- [ ] **Step 3: `packages/core/src/components/HStack/HStack.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from './HStack';
import { Box } from '../Box';

const meta: Meta<typeof HStack> = {
    title: 'Primitives/HStack',
    component: HStack,
    render: (args) => (
        <HStack {...args}>
            <Box className="p-2 bg-primary-100">A</Box>
            <Box className="p-2 bg-primary-200">B</Box>
            <Box className="p-2 bg-primary-300">C</Box>
        </HStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof HStack> = {};
export const WithGap: StoryObj<typeof HStack> = { args: { gap: 4 } };
export const Between: StoryObj<typeof HStack> = { args: { gap: 2, justify: 'between', className: 'w-full' } };
```

- [ ] **Step 4: `packages/core/src/components/VStack/VStack.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { VStack } from './VStack';
import { Box } from '../Box';

const meta: Meta<typeof VStack> = {
    title: 'Primitives/VStack',
    component: VStack,
    render: (args) => (
        <VStack {...args}>
            <Box className="p-2 bg-primary-100">A</Box>
            <Box className="p-2 bg-primary-200">B</Box>
            <Box className="p-2 bg-primary-300">C</Box>
        </VStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof VStack> = {};
export const WithGap: StoryObj<typeof VStack> = { args: { gap: 4 } };
```

- [ ] **Step 5: Update `packages/core/src/stories/story-registry.ts`** — append entries so `playground-native` can render them.

```ts
import type { ComponentType } from 'react';
import { View } from 'react-native';
import { Text } from '../components/Text';
import { Box } from '../components/Box';
import { HStack } from '../components/HStack';
import { VStack } from '../components/VStack';

export type StoryEntry = {
    id: string;
    title: string;
    render: ComponentType<Record<string, never>>;
};

export const stories: StoryEntry[] = [
    {
        id: 'text.body-md',
        title: 'Text · body-md',
        render: () => <Text testID="story-text-body-md">Hello world</Text>,
    },
    {
        id: 'text.heading-1',
        title: 'Text · heading-1',
        render: () => (
            <Text variant="heading-1" testID="story-text-heading-1">
                Heading
            </Text>
        ),
    },
    {
        id: 'box.default',
        title: 'Box · default',
        render: () => (
            <Box testID="story-box-default" className="p-4 bg-primary-50 rounded-md">
                <Text>Box content</Text>
            </Box>
        ),
    },
    {
        id: 'hstack.gap-4',
        title: 'HStack · gap 4',
        render: () => (
            <HStack testID="story-hstack-gap-4" gap={4}>
                <View testID="story-hstack-a" style={{ padding: 8, backgroundColor: '#dbeafe' }}>
                    <Text>A</Text>
                </View>
                <View testID="story-hstack-b" style={{ padding: 8, backgroundColor: '#bfdbfe' }}>
                    <Text>B</Text>
                </View>
            </HStack>
        ),
    },
    {
        id: 'vstack.gap-4',
        title: 'VStack · gap 4',
        render: () => (
            <VStack testID="story-vstack-gap-4" gap={4}>
                <View testID="story-vstack-a" style={{ padding: 8, backgroundColor: '#dbeafe' }}>
                    <Text>A</Text>
                </View>
                <View testID="story-vstack-b" style={{ padding: 8, backgroundColor: '#bfdbfe' }}>
                    <Text>B</Text>
                </View>
            </VStack>
        ),
    },
];
```

- [ ] **Step 6: Commit.**

```bash
git add packages/core/src/components/*/Text.stories.tsx packages/core/src/components/*/*.stories.tsx packages/core/src/stories/story-registry.ts
git commit -m "feat(ui): add stories for Text, Box, HStack, VStack + registry entries"
```

Note: the glob in `git add` should pick up all four stories files. If it misses any, use explicit paths.

---

## Task 8 — Playwright layout spec

**Files:**
- Create: `e2e/web/tests/layout.spec.ts`

- [ ] **Step 1: Update `apps/playground-web/src/App.tsx`** to render the story registry so Playwright can target specific stories by testID.

Replace the smoke content with a registry renderer:

```tsx
'use client';

import { NoriProvider } from '@nori-ui/core/client';
import { stories } from '@nori-ui/core/stories';

function StoriesPage() {
    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', display: 'grid', gap: 24 }}>
            <h1 data-testid="title">nori-ui playground (web)</h1>
            {stories.map(({ id, title, render: Render }) => (
                <section key={id} data-testid={`section-${id}`} style={{ borderTop: '1px solid #e4e4e7', paddingTop: 12 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px' }}>{title}</h2>
                    <Render />
                </section>
            ))}
        </main>
    );
}

export function App() {
    return (
        <NoriProvider>
            <StoriesPage />
        </NoriProvider>
    );
}
```

- [ ] **Step 2: Create `e2e/web/tests/layout.spec.ts`.**

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('layout primitives', () => {
    test('renders every layout story section', async ({ page }) => {
        await page.goto('/');
        for (const id of ['text.body-md', 'text.heading-1', 'box.default', 'hstack.gap-4', 'vstack.gap-4']) {
            await expect(page.getByTestId(`section-${id}`)).toBeVisible();
        }
    });

    test('Text heading-1 uses heading role for a11y', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByTestId('story-text-heading-1');
        await expect(heading).toHaveAttribute('role', 'heading');
    });

    test('passes axe-core audit across the full stories page', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
});
```

- [ ] **Step 3: Run Playwright.**

```bash
yarn test:e2e:web
```

Expected: prior smoke tests + 3 new layout tests = 5 passed (adjust if smoke test count differed).

- [ ] **Step 4: Commit.**

```bash
git add apps/playground-web/src/App.tsx e2e/web/tests/layout.spec.ts
git commit -m "test(e2e): add layout primitives playwright coverage + axe audit"
```

---

## Task 9 — Maestro flow for layout primitives

**Files:**
- Create: `e2e/native/flows/layout.yaml`
- Modify: `apps/playground-native/App.tsx` to render the same stories

- [ ] **Step 1: Update `apps/playground-native/App.tsx`** to render the registry.

```tsx
import { SafeAreaView, ScrollView, StatusBar, Text as RNText, View } from 'react-native';
import { NoriProvider } from '@nori-ui/core/client';
import { stories } from '@nori-ui/core/stories';

export function App() {
    return (
        <NoriProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar />
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <RNText testID="title" style={{ fontSize: 22, fontWeight: '600', marginBottom: 16 }}>
                        nori-ui playground (native)
                    </RNText>
                    {stories.map(({ id, title, render: Render }) => (
                        <View key={id} testID={`section-${id}`} style={{ paddingVertical: 12, gap: 8 }}>
                            <RNText style={{ fontSize: 13, color: '#71717a' }}>{title}</RNText>
                            <Render />
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </NoriProvider>
    );
}
```

- [ ] **Step 2: `e2e/native/flows/layout.yaml`.**

```yaml
appId: dev.noriui.playground
---
- launchApp
- assertVisible:
    id: 'title'
- scrollUntilVisible:
    element:
      id: 'section-text.body-md'
- assertVisible:
    id: 'section-text.heading-1'
- assertVisible:
    id: 'section-box.default'
- assertVisible:
    id: 'section-hstack.gap-4'
- scrollUntilVisible:
    element:
      id: 'section-vstack.gap-4'
```

- [ ] **Step 3: Commit.**

```bash
git add e2e/native/flows/layout.yaml apps/playground-native/App.tsx
git commit -m "test(e2e): add maestro flow for layout primitives"
```

---

## Task 10 — Size-limit entries + budget check

**Files:**
- Modify: `packages/core/.size-limit.cjs`

- [ ] **Step 1: Replace the placeholder entry with one per component** so size-limit regressions surface per-component.

```js
module.exports = [
    {
        name: 'core (cn + slot + theme + i18n + icons + provider)',
        path: 'src/client.ts',
        limit: '40 KB',
        ignore: ['react', 'react-dom', 'react-native', '@nori-ui/tokens'],
    },
    {
        name: 'Text',
        path: 'src/components/Text/index.ts',
        limit: '2 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'Box',
        path: 'src/components/Box/index.ts',
        limit: '1 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'HStack',
        path: 'src/components/HStack/index.ts',
        limit: '1.5 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'VStack',
        path: 'src/components/VStack/index.ts',
        limit: '1.5 KB',
        ignore: ['react', 'react-native'],
    },
];
```

- [ ] **Step 2: Run `yarn size`** and confirm all entries under budget.

- [ ] **Step 3: Commit.**

```bash
git add packages/core/.size-limit.cjs
git commit -m "chore(ui): add per-component size-limit entries for layout primitives"
```

---

## Task 11 — Final verification

- [ ] **Step 1: Full local green-build.**

```bash
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
yarn test:e2e:web
```

All exit 0.

- [ ] **Step 2: Verify the stories page** in Storybook locally.

```bash
yarn dev:storybook &
sleep 10
# Visit http://localhost:6006 — all four primitives should have stories under Primitives/
pkill -f storybook || true
```

---

## Done criteria for Plan 05a

- [ ] `Text`, `Box`, `HStack`, `VStack` implemented with unit tests (5 + 3 + 6 + 4 = 18 new tests).
- [ ] Each has a CSF story registered in the shared story-registry.
- [ ] Playwright layout spec passes (3 tests including an axe audit over the whole stories page).
- [ ] Maestro layout flow file exists (manual run).
- [ ] Each component has a size-limit entry under its budget.
- [ ] Public exports: `Text`, `Box`, `HStack`, `VStack` and their types reach consumers via `nori-ui` root import (RSC-safe).
- [ ] `yarn test` reports 36 + 18 = 54 tests passing.

When all boxes are ticked, Plan 05a is complete and Plan 05b (form controls + Spinner) can begin.

---

## Errata (post-execution notes)

1. **Jest RN mock, not moduleNameMapper.** The plan's `moduleNameMapper: ^react-native$ → react-native-web` breaks className assertions because RN-Web strips `className` and emits CSS-in-JS hashes (`css-text-146c3p1`). The working approach is a `jest.mock('react-native', …)` inside `packages/core/jest.rn-setup.ts` that renders `View`/`Text`/`ScrollView`/`SafeAreaView`/`Pressable`/`ActivityIndicator`/`TextInput` as plain DOM nodes forwarding `className`, mapping `testID → data-testid`, `accessibilityRole → role`, `accessibilityLabel → aria-label`, `accessibilityState → aria-*`. All component tests from 05b/05c/05d must rely on this mock, not on RN-Web.
2. **`react-native.d.ts` type augmentation.** `packages/core/src/react-native.d.ts` augments `react-native` with `className?: string` on `ViewProps`/`TextProps`/`PressableProps`/`ActivityIndicatorProps` (plus `contentContainerClassName` for `ScrollViewProps`, `placeholderClassName` for `TextInputProps`). Later plans use `className` directly; do NOT add `@ts-expect-error` comments.
3. **`playground-web/tsconfig.json` removes the `paths` alias** for `react-native` → `react-native-web` (RN-Web has no `.d.ts` there); instead adds `nativewind/types` to `types` so className is typed at compile time. The Vite runtime alias in `vite.config.ts` remains untouched.
4. **Commit-scope kebab-case:** same rule as Plan 04 — `test(e2e):` fails commitlint because digits break kebab-case. Use `test(playground-web):` / `test(playground-native):` / `test(ui):` as appropriate.
5. **Story registry file is `.tsx`** — it contains JSX in the render functions. Import path `nori-ui/stories` stays the same; the `exports` map in `packages/core/package.json` points at `.tsx`.
6. **`smoke.spec.ts` needs updating after registry-renderer swap.** Once `apps/playground-web/src/App.tsx` is rewritten to render the story registry, the Plan 04 smoke spec asserting `primary-swatch`/`primary-hex` testIDs will fail. Replace with assertions on `title` + first section visibility. Future plans that modify `App.tsx` must remember to sync smoke tests.
7. **ESLint `react-native/no-inline-styles` warnings** (23 of them) from inline-style story wrappers are expected and accepted — test code intentionally uses inline styles.
8. **NativeWind CSS compilation is at consumer build time.** In the Jest environment, `className` values reach the DOM but are not compiled to CSS. Tests assert on className *strings*, not computed styles. Playwright picks up the real CSS because Vite runs NativeWind's transform.
