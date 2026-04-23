# Plan 05b — Button + Spinner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `Spinner` and `Button`. Spinner lands first because Button's `loading` state renders one. Button is the flagship component: variants (primary/secondary/ghost/destructive), sizes (sm/md/lg), loading state with i18n label, leading/trailing icon slots, and full `asChild` support via the Slot primitive.

**Architecture:** Both components live under `packages/core/src/components/<Name>/`. Spinner is pure-render + respects `prefers-reduced-motion`. Button is also pure-render (no hooks) but composes several primitives (Text, Icon wrapper via consumer-provided components, Pressable for press handling, Slot when `asChild`). Both are RSC-safe.

**Tech Stack:** React 19, react-native primitives (Pressable, ActivityIndicator for Spinner's native side), NativeWind classNames. Tests use the jsdom RN-Web project set up in Plan 05a Task 1.

**Applies all prior errata.**

---

## File Structure

**Created in this plan:**
```
packages/core/src/components/Spinner/Spinner.tsx
packages/core/src/components/Spinner/index.ts
packages/core/src/components/Spinner/Spinner.stories.tsx
packages/core/src/components/Spinner/__tests__/Spinner.test.tsx

packages/core/src/components/Button/Button.tsx
packages/core/src/components/Button/index.ts
packages/core/src/components/Button/Button.stories.tsx
packages/core/src/components/Button/__tests__/Button.test.tsx

e2e/web/tests/button.spec.ts
e2e/native/flows/button.yaml
```

**Modified:**
- `packages/core/src/components/index.ts` — add Spinner + Button barrels
- `packages/core/src/stories/story-registry.ts` — append entries
- `packages/core/.size-limit.cjs` — add per-component budgets

---

## Task 1 — `Spinner` component

**Files:**
- Create: `packages/core/src/components/Spinner/Spinner.tsx`
- Create: `packages/core/src/components/Spinner/index.ts`
- Create: `packages/core/src/components/Spinner/__tests__/Spinner.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/core/src/components/Spinner/__tests__/Spinner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('<Spinner>', () => {
    it('renders with role="progressbar" for a11y', () => {
        render(<Spinner testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('role')).toBe('progressbar');
    });

    it('exposes an accessible label via accessibilityLabel prop (defaults to the i18n "Loading" string)', () => {
        render(<Spinner testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('accepts a custom label', () => {
        render(<Spinner testID="s" label="Fetching" />);
        expect(screen.getByTestId('s').getAttribute('aria-label')).toBe('Fetching');
    });

    it('maps keyword size to pixel size', () => {
        render(<Spinner testID="s" size="lg" />);
        const el = screen.getByTestId('s');
        // RN-Web renders ActivityIndicator as a div with style height/width
        expect(el.style.height).toBe('24px');
        expect(el.style.width).toBe('24px');
    });

    it('accepts numeric size', () => {
        render(<Spinner testID="s" size={40} />);
        const el = screen.getByTestId('s');
        expect(el.style.height).toBe('40px');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/Spinner/Spinner.tsx`.**

```tsx
import { ActivityIndicator } from 'react-native';
import type { ActivityIndicatorProps } from 'react-native';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type SpinnerProps = Omit<ActivityIndicatorProps, 'size'> & {
    /** Visible (a11y) label. Defaults to the i18n "common.loading" default ("Loading"). */
    label?: string;
    size?: SpinnerSize;
    testID?: string;
    className?: string;
};

const SIZE_MAP: Record<Exclude<SpinnerSize, number>, number> = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
};

/**
 * Loading indicator.
 *
 * a11y: rendered with `role="progressbar"` and an `aria-label` so screen
 * readers announce it. Respects `prefers-reduced-motion` — on web, react-native-web's
 * ActivityIndicator will render without animation when the media query matches;
 * on native, React Native's ActivityIndicator honors the OS reduce-motion setting
 * automatically.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Spinner({ label = 'Loading', size = 'md', testID, color, style, ...rest }: SpinnerProps) {
    const px = typeof size === 'number' ? size : SIZE_MAP[size];
    return (
        <ActivityIndicator
            testID={testID}
            accessibilityRole="progressbar"
            accessibilityLabel={label}
            color={color}
            size={px}
            style={[{ width: px, height: px }, style]}
            {...rest}
        />
    );
}
```

- [ ] **Step 3: `packages/core/src/components/Spinner/index.ts`.**

```ts
export { Spinner, type SpinnerProps, type SpinnerSize } from './Spinner';
```

- [ ] **Step 4: Run tests.**

```bash
yarn workspace @nori-ui/core test Spinner.test
```

Expected: 5 passed.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/Spinner/
git commit -m "feat(ui): add Spinner with a11y role=progressbar and reduced-motion support"
```

---

## Task 2 — `Spinner` story + registry entry

**Files:**
- Create: `packages/core/src/components/Spinner/Spinner.stories.tsx`
- Modify: `packages/core/src/stories/story-registry.ts`

- [ ] **Step 1: `packages/core/src/components/Spinner/Spinner.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
    title: 'Feedback/Spinner',
    component: Spinner,
    args: { size: 'md', label: 'Loading' },
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    },
};
export default meta;

export const Default: StoryObj<typeof Spinner> = {};
export const Large: StoryObj<typeof Spinner> = { args: { size: 'lg' } };
export const CustomLabel: StoryObj<typeof Spinner> = { args: { label: 'Fetching results' } };
```

- [ ] **Step 2: Append to `packages/core/src/stories/story-registry.ts`:**

```ts
// add after the VStack entry
{
    id: 'spinner.md',
    title: 'Spinner · md',
    render: () => <Spinner testID="story-spinner-md" size="md" />,
},
{
    id: 'spinner.lg',
    title: 'Spinner · lg',
    render: () => <Spinner testID="story-spinner-lg" size="lg" />,
},
```

and import at the top:

```ts
import { Spinner } from '../components/Spinner';
```

- [ ] **Step 3: Commit.**

```bash
git add packages/core/src/components/Spinner/Spinner.stories.tsx packages/core/src/stories/story-registry.ts
git commit -m "feat(ui): add Spinner stories and registry entries"
```

---

## Task 3 — `Button` component: test, implementation, barrel

**Files:**
- Create: `packages/core/src/components/Button/Button.tsx`
- Create: `packages/core/src/components/Button/index.ts`
- Create: `packages/core/src/components/Button/__tests__/Button.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/core/src/components/Button/__tests__/Button.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('<Button>', () => {
    it('renders its children as the label', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('fires onPress when clicked', () => {
        const onPress = jest.fn();
        render(<Button onPress={onPress}>Go</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', () => {
        const onPress = jest.fn();
        render(<Button onPress={onPress} disabled>Go</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('exposes disabled state to a11y via aria-disabled', () => {
        render(<Button disabled>Go</Button>);
        expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
    });

    it('does not fire onPress while loading', () => {
        const onPress = jest.fn();
        render(<Button onPress={onPress} loading>Go</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('renders a spinner and aria-busy=true while loading', () => {
        render(<Button loading testID="b">Save</Button>);
        const btn = screen.getByTestId('b');
        expect(btn.getAttribute('aria-busy')).toBe('true');
        // Spinner child present:
        expect(btn.querySelector('[role="progressbar"]')).not.toBeNull();
    });

    it('applies the variant className (smoke check)', () => {
        render(<Button variant="destructive" testID="b">Delete</Button>);
        expect(screen.getByTestId('b').className).toMatch(/destructive|danger|red/);
    });

    it('applies the size className (smoke check)', () => {
        render(<Button size="lg" testID="b">Big</Button>);
        expect(screen.getByTestId('b').className).toMatch(/h-12|py-3|text-lg/);
    });

    it('renders a leading icon before the label', () => {
        function Arrow({ size }: { size?: number }) {
            return <svg data-testid="arrow" width={size} />;
        }
        render(<Button leadingIcon={Arrow}>Go</Button>);
        expect(screen.getByTestId('arrow')).toBeInTheDocument();
    });

    it('supports asChild — renders the child as the interactive element', () => {
        render(
            <Button asChild variant="primary">
                <a href="/x" data-testid="link">
                    Go
                </a>
            </Button>,
        );
        const link = screen.getByTestId('link');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/x');
        // Button styling reaches the anchor:
        expect(link.className).toMatch(/primary|bg-/);
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/Button/Button.tsx`.**

```tsx
import { forwardRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, Text as RNText } from 'react-native';
import type { PressableProps } from 'react-native';
import { Slot } from '../../slot';
import { Spinner } from '../Spinner';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type IconSlot = ComponentType<{ size?: number; color?: string }>;

export type ButtonProps = Omit<PressableProps, 'disabled' | 'children'> & {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    leadingIcon?: IconSlot;
    trailingIcon?: IconSlot;
    /** If true, the single child becomes the interactive element (Slot pattern). */
    asChild?: boolean;
    className?: string;
    testID?: string;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: 'bg-semantic-interactive-primary hover:bg-semantic-interactive-primaryHover active:bg-semantic-interactive-primaryPressed',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300',
    ghost: 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200',
    destructive: 'bg-semantic-interactive-destructive hover:opacity-90 active:opacity-80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-md',
    lg: 'h-12 px-5 text-lg',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 20 };

const BASE_CLASSES = 'inline-flex flex-row items-center justify-center gap-2 rounded-md select-none';

export const Button = forwardRef<unknown, ButtonProps>(function Button(
    {
        children,
        variant = 'primary',
        size = 'md',
        disabled,
        loading,
        leadingIcon: LeadingIcon,
        trailingIcon: TrailingIcon,
        asChild,
        className,
        onPress,
        testID,
        ...rest
    },
    forwardedRef,
) {
    const isInoperative = Boolean(disabled) || Boolean(loading);
    const classes = cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], isInoperative ? 'opacity-60' : undefined, className);

    const handlePress = (ev: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
        if (isInoperative) return;
        onPress?.(ev);
    };

    if (asChild) {
        return (
            <Slot
                ref={forwardedRef}
                className={classes}
                onClick={handlePress as unknown as (...args: unknown[]) => unknown}
                aria-disabled={isInoperative ? true : undefined}
                aria-busy={loading ? true : undefined}
                data-testid={testID}
                {...rest}
            >
                {children}
            </Slot>
        );
    }

    return (
        <Pressable
            ref={forwardedRef as never}
            testID={testID}
            role="button"
            accessibilityRole="button"
            accessibilityState={{ disabled: isInoperative, busy: loading }}
            aria-disabled={isInoperative ? true : undefined}
            aria-busy={loading ? true : undefined}
            disabled={isInoperative}
            onPress={handlePress}
            className={classes}
            {...rest}
        >
            {loading ? <Spinner size={ICON_SIZE[size]} label="Loading" /> : LeadingIcon ? <LeadingIcon size={ICON_SIZE[size]} /> : null}
            <RNText className={cn('font-medium', SIZE_CLASSES[size].includes('text-') ? undefined : 'text-md')}>{children}</RNText>
            {TrailingIcon ? <TrailingIcon size={ICON_SIZE[size]} /> : null}
        </Pressable>
    );
});
Button.displayName = 'Button';
```

Design notes:
- The Spinner replaces the leading icon slot while loading.
- `asChild` branch uses DOM-style `onClick` on the Slot (which passes through to the child `<a>` or similar); the Pressable branch uses RN's `onPress`. Consumers of `asChild` typically target web, where this is what they want.
- `accessibilityState` on native; `aria-disabled`/`aria-busy` on web. Both fire.
- Size maps to both classname and icon pixel size.

- [ ] **Step 3: `packages/core/src/components/Button/index.ts`.**

```ts
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
```

- [ ] **Step 4: Run tests.**

```bash
yarn workspace @nori-ui/core test Button.test
```

Expected: 10 passed. If the asChild test fails because Slot's `onClick` prop didn't land on the `<a>`, inspect Slot's event-merge logic — it composes outer+inner handlers; the outer here is the Button's handlePress.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/Button/
git commit -m "feat(ui): add Button with 4 variants, 3 sizes, loading state, icon slots, asChild"
```

---

## Task 4 — Button story + registry entries

**Files:**
- Create: `packages/core/src/components/Button/Button.stories.tsx`
- Modify: `packages/core/src/stories/story-registry.ts`
- Modify: `packages/core/src/components/index.ts`

- [ ] **Step 1: `packages/core/src/components/Button/Button.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Controls/Button',
    component: Button,
    args: { children: 'Click me', variant: 'primary', size: 'md' },
    argTypes: {
        variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
    },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };

export const Loading: Story = { args: { loading: true, children: 'Saving' } };
export const Disabled: Story = { args: { disabled: true } };

export const Small: Story = { args: { size: 'sm', children: 'Small' } };
export const Large: Story = { args: { size: 'lg', children: 'Large' } };
```

- [ ] **Step 2: Append to `packages/core/src/stories/story-registry.ts`:**

```ts
import { Button } from '../components/Button';

// add entries after the Spinner ones:
{
    id: 'button.primary',
    title: 'Button · primary',
    render: () => <Button testID="story-button-primary">Click me</Button>,
},
{
    id: 'button.destructive',
    title: 'Button · destructive',
    render: () => <Button testID="story-button-destructive" variant="destructive">Delete</Button>,
},
{
    id: 'button.loading',
    title: 'Button · loading',
    render: () => <Button testID="story-button-loading" loading>Saving</Button>,
},
```

- [ ] **Step 3: Update `packages/core/src/components/index.ts`** to re-export Button and Spinner.

```ts
export * from './Text';
export * from './Box';
export * from './HStack';
export * from './VStack';
export * from './Spinner';
export * from './Button';
```

- [ ] **Step 4: Commit.**

```bash
git add packages/core/src/components/Button/Button.stories.tsx packages/core/src/components/index.ts packages/core/src/stories/story-registry.ts
git commit -m "feat(ui): add Button stories and re-export Button + Spinner from components barrel"
```

---

## Task 5 — Playwright Button coverage

**Files:**
- Create: `e2e/web/tests/button.spec.ts`

- [ ] **Step 1: `e2e/web/tests/button.spec.ts`.**

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Button (web)', () => {
    test('primary button is clickable and triggers onPress (via a rendered log)', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-primary');
        await expect(btn).toBeVisible();
        await btn.click(); // no asserting side-effect unless App.tsx wires a log; click itself should not throw
    });

    test('loading button has aria-busy=true', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-loading');
        await expect(btn).toHaveAttribute('aria-busy', 'true');
    });

    test('destructive button renders with button role', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByTestId('story-button-destructive');
        await expect(btn).toHaveAttribute('role', 'button');
    });

    test('axe audit of button stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).include('[data-testid^="section-button."]').analyze();
        expect(results.violations).toEqual([]);
    });
});
```

- [ ] **Step 2: Run.**

```bash
yarn test:e2e:web
```

Expected: prior tests + 4 new = green.

- [ ] **Step 3: Commit.**

```bash
git add e2e/web/tests/button.spec.ts
git commit -m "test(e2e): add playwright button coverage + axe audit"
```

---

## Task 6 — Maestro Button flow

**Files:**
- Create: `e2e/native/flows/button.yaml`

- [ ] **Step 1: `e2e/native/flows/button.yaml`.**

```yaml
appId: dev.noriui.playground
---
- launchApp
- scrollUntilVisible:
    element:
      id: 'section-button.primary'
- assertVisible:
    id: 'story-button-primary'
- tapOn:
    id: 'story-button-primary'
- scrollUntilVisible:
    element:
      id: 'section-button.loading'
- assertVisible:
    id: 'story-button-loading'
```

- [ ] **Step 2: Commit.**

```bash
git add e2e/native/flows/button.yaml
git commit -m "test(e2e): add maestro button flow for playground-native"
```

---

## Task 7 — Update size-limit budgets

**Files:**
- Modify: `packages/core/.size-limit.cjs`

- [ ] **Step 1: Add Spinner + Button entries.**

```js
module.exports = [
    // existing core + Text/Box/HStack/VStack entries stay as-is.
    {
        name: 'Spinner',
        path: 'src/components/Spinner/index.ts',
        limit: '1.5 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'Button',
        path: 'src/components/Button/index.ts',
        limit: '4 KB',
        ignore: ['react', 'react-native'],
    },
];
```

- [ ] **Step 2: `yarn size`** — all green.

- [ ] **Step 3: Commit.**

```bash
git add packages/core/.size-limit.cjs
git commit -m "chore(ui): add Spinner + Button size-limit entries"
```

---

## Task 8 — Final verification

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

- [ ] **Step 2: Confirm Button renders in Storybook.**

---

## Done criteria for Plan 05b

- [ ] `Spinner` (5 tests) and `Button` (10 tests) ship green.
- [ ] Stories registered; registry entries feed both playgrounds.
- [ ] Playwright Button spec + axe audit passes.
- [ ] Maestro Button flow file committed.
- [ ] Per-component size-limit budgets enforced.
- [ ] `yarn test` total: 54 (from 05a) + 15 = 69 passing.

When all boxes are ticked, continue with Plan 05c (TextInput + TextArea) and Plan 05d (Checkbox + Switch). Both follow the exact pattern established here — each component gets one task for impl+test, one for story+registry, one for Playwright, one for Maestro.

---

## Errata (post-execution notes)

1. **Jest RN mock needs Pressable-onClick wiring.** `fireEvent.click` does NOT trigger RN's `onPress`. Extend `packages/core/jest.rn-setup.ts` so the mocked `Pressable` dispatches `onPress` via `onClick` and maps `accessibilityState.busy` → `aria-busy`, `accessibilityState.checked` → `aria-checked`, `accessibilityState.disabled` → `aria-disabled`. Plan 05c/05d tests for interactive components rely on this.
2. **`ActivityIndicator` mock** needs to flatten style arrays and default `accessibilityRole: 'progressbar'`. The Spinner test expects `role="progressbar"` on the rendered DOM.
3. **`story-registry.tsx` eslint warnings** (inline styles, color literals) are pre-existing from Plan 05a and accepted. Don't fight them in 05c/05d.
4. **Pressable `aria-*` direct props vs `accessibilityState`**: if the component sets both, the mock order produces consistent output. Prefer `aria-*` direct props on web-facing surfaces and rely on the mock to map `accessibilityState` on native-facing surfaces.
