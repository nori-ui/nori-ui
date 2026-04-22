# Plan 05d — Checkbox + Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `Checkbox` (with indeterminate state) and `Switch`. Both support controlled + uncontrolled usage, `asChild`, proper ARIA roles, and a label slot.

**Architecture:** Each lives under `packages/ui/src/components/<Name>/`. Both use `Pressable` internally (or `Slot` when `asChild`). Internal semantic glyphs for Checkbox's ✓ come from the semantic icon registry via `useSemanticIcon('checkmark')`.

**Applies all prior errata.**

---

## File Structure

**Created:**
```
packages/ui/src/components/Checkbox/Checkbox.tsx
packages/ui/src/components/Checkbox/index.ts
packages/ui/src/components/Checkbox/Checkbox.stories.tsx
packages/ui/src/components/Checkbox/__tests__/Checkbox.test.tsx

packages/ui/src/components/Switch/Switch.tsx
packages/ui/src/components/Switch/index.ts
packages/ui/src/components/Switch/Switch.stories.tsx
packages/ui/src/components/Switch/__tests__/Switch.test.tsx

e2e/web/tests/toggles.spec.ts
e2e/native/flows/toggles.yaml
```

**Modified:**
- `packages/ui/src/components/index.ts`
- `packages/ui/src/stories/story-registry.ts`
- `packages/ui/.size-limit.cjs`

---

## Task 1 — `Checkbox` component

**Files:**
- Create: `packages/ui/src/components/Checkbox/Checkbox.tsx`
- Create: `packages/ui/src/components/Checkbox/index.ts`
- Create: `packages/ui/src/components/Checkbox/__tests__/Checkbox.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/ui/src/components/Checkbox/__tests__/Checkbox.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Checkbox } from '../Checkbox';

describe('<Checkbox>', () => {
    it('renders with role="checkbox" and aria-checked="false" by default', () => {
        render(<Checkbox testID="c" />);
        const el = screen.getByTestId('c');
        expect(el.getAttribute('role')).toBe('checkbox');
        expect(el.getAttribute('aria-checked')).toBe('false');
    });

    it('reflects checked prop via aria-checked', () => {
        render(<Checkbox testID="c" checked />);
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('true');
    });

    it('reflects indeterminate via aria-checked="mixed"', () => {
        render(<Checkbox testID="c" indeterminate />);
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('mixed');
    });

    it('uncontrolled: toggles on click and calls onChange with the new value', () => {
        const onChange = jest.fn();
        render(<Checkbox testID="c" onChange={onChange} />);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).toHaveBeenCalledWith(true);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('controlled: only changes when onChange re-renders with new checked', () => {
        function Wrapper() {
            const [v, setV] = useState(false);
            return <Checkbox testID="c" checked={v} onChange={setV} />;
        }
        render(<Wrapper />);
        const el = screen.getByTestId('c');
        expect(el.getAttribute('aria-checked')).toBe('false');
        fireEvent.click(el);
        expect(el.getAttribute('aria-checked')).toBe('true');
    });

    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn();
        render(<Checkbox testID="c" onChange={onChange} disabled />);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders the visible label when provided and labels the checkbox', () => {
        render(<Checkbox testID="c" label="Accept terms" />);
        expect(screen.getByText('Accept terms')).toBeInTheDocument();
        expect(screen.getByTestId('c').getAttribute('aria-label')).toBe('Accept terms');
    });

    it('asChild: renders the single child as the interactive element, merging styling', () => {
        render(
            <Checkbox asChild>
                <div data-testid="c" role="checkbox" aria-checked="false" />
            </Checkbox>,
        );
        expect(screen.getByTestId('c').getAttribute('role')).toBe('checkbox');
    });
});
```

- [ ] **Step 2: Implement `packages/ui/src/components/Checkbox/Checkbox.tsx`.**

```tsx
'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Slot } from '../../slot';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import { cn } from '../../utils/cn';

export type CheckboxProps = {
    checked?: boolean;
    defaultChecked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (next: boolean) => void;
    label?: string;
    className?: string;
    testID?: string;
    asChild?: boolean;
    children?: ReactNode;
};

export function Checkbox({
    checked,
    defaultChecked = false,
    indeterminate,
    disabled,
    onChange,
    label,
    className,
    testID,
    asChild,
    children,
}: CheckboxProps) {
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? checked : inner;

    const ariaChecked: 'true' | 'false' | 'mixed' = indeterminate ? 'mixed' : value ? 'true' : 'false';

    const toggle = useCallback(() => {
        if (disabled) return;
        const next = !value;
        if (!isControlled) setInner(next);
        onChange?.(next);
    }, [disabled, value, isControlled, onChange]);

    const Check = useSemanticIcon('checkmark');

    const commonProps = {
        role: 'checkbox' as const,
        'aria-checked': ariaChecked,
        'aria-disabled': disabled || undefined,
        accessibilityRole: 'checkbox' as const,
        accessibilityState: { checked: value, disabled: Boolean(disabled) },
        accessibilityLabel: label,
        testID,
    };

    if (asChild) {
        return (
            <Slot onClick={toggle} {...commonProps} className={className}>
                {children}
            </Slot>
        );
    }

    return (
        <View className={cn('flex-row items-center gap-2', disabled ? 'opacity-60' : undefined, className)}>
            <Pressable onPress={toggle} {...commonProps} className="w-5 h-5 rounded-sm border border-semantic-border-strong items-center justify-center">
                {(value || indeterminate) && !disabled ? <Check size={14} color="currentColor" /> : null}
            </Pressable>
            {label ? <View>{/* visible label rendered beside the box */}{children ?? label}</View> : null}
        </View>
    );
}
```

- [ ] **Step 3: Barrel + run + commit.**

```ts
// packages/ui/src/components/Checkbox/index.ts
export { Checkbox, type CheckboxProps } from './Checkbox';
```

```bash
yarn workspace unbogify-ui test Checkbox.test
# 8 passed
git add packages/ui/src/components/Checkbox/
git commit -m "feat(ui): add Checkbox with indeterminate, asChild, semantic-icon checkmark"
```

---

## Task 2 — `Switch` component

**Files:**
- Create: `packages/ui/src/components/Switch/Switch.tsx`
- Create: `packages/ui/src/components/Switch/index.ts`
- Create: `packages/ui/src/components/Switch/__tests__/Switch.test.tsx`

- [ ] **Step 1: Write the test.**

`packages/ui/src/components/Switch/__tests__/Switch.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Switch } from '../Switch';

describe('<Switch>', () => {
    it('renders with role="switch" and aria-checked="false" by default', () => {
        render(<Switch testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('role')).toBe('switch');
        expect(el.getAttribute('aria-checked')).toBe('false');
    });

    it('reflects checked prop', () => {
        render(<Switch testID="s" checked />);
        expect(screen.getByTestId('s').getAttribute('aria-checked')).toBe('true');
    });

    it('uncontrolled: toggles and calls onChange', () => {
        const onChange = jest.fn();
        render(<Switch testID="s" onChange={onChange} />);
        fireEvent.click(screen.getByTestId('s'));
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('controlled: obeys parent state', () => {
        function Wrapper() {
            const [v, setV] = useState(false);
            return <Switch testID="s" checked={v} onChange={setV} />;
        }
        render(<Wrapper />);
        const el = screen.getByTestId('s');
        fireEvent.click(el);
        expect(el.getAttribute('aria-checked')).toBe('true');
    });

    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn();
        render(<Switch testID="s" onChange={onChange} disabled />);
        fireEvent.click(screen.getByTestId('s'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders visible label and uses it as accessibilityLabel', () => {
        render(<Switch testID="s" label="Dark mode" />);
        expect(screen.getByText('Dark mode')).toBeInTheDocument();
        expect(screen.getByTestId('s').getAttribute('aria-label')).toBe('Dark mode');
    });

    it('asChild: renders the child with combined styling + role', () => {
        render(
            <Switch asChild>
                <div data-testid="s" role="switch" aria-checked="false" />
            </Switch>,
        );
        expect(screen.getByTestId('s').getAttribute('role')).toBe('switch');
    });
});
```

- [ ] **Step 2: Implement `packages/ui/src/components/Switch/Switch.tsx`.**

```tsx
'use client';

import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, View, Text as RNText } from 'react-native';
import { Slot } from '../../slot';
import { cn } from '../../utils/cn';

export type SwitchProps = {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (next: boolean) => void;
    label?: string;
    className?: string;
    testID?: string;
    asChild?: boolean;
    children?: ReactNode;
};

export function Switch({
    checked,
    defaultChecked = false,
    disabled,
    onChange,
    label,
    className,
    testID,
    asChild,
    children,
}: SwitchProps) {
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? checked : inner;

    const toggle = useCallback(() => {
        if (disabled) return;
        const next = !value;
        if (!isControlled) setInner(next);
        onChange?.(next);
    }, [disabled, value, isControlled, onChange]);

    const commonProps = {
        role: 'switch' as const,
        'aria-checked': (value ? 'true' : 'false') as 'true' | 'false',
        'aria-disabled': disabled || undefined,
        accessibilityRole: 'switch' as const,
        accessibilityState: { checked: Boolean(value), disabled: Boolean(disabled) },
        accessibilityLabel: label,
        testID,
    };

    if (asChild) {
        return (
            <Slot onClick={toggle} {...commonProps} className={className}>
                {children}
            </Slot>
        );
    }

    const trackClasses = cn(
        'w-10 h-6 rounded-full justify-center px-0.5 transition-colors',
        value ? 'bg-semantic-interactive-primary' : 'bg-neutral-300',
        disabled ? 'opacity-60' : undefined,
    );
    const thumbClasses = cn(
        'w-5 h-5 rounded-full bg-white shadow-sm',
        value ? 'self-end' : 'self-start',
    );

    return (
        <View className={cn('flex-row items-center gap-2', className)}>
            <Pressable onPress={toggle} {...commonProps} className={trackClasses}>
                <View className={thumbClasses} />
            </Pressable>
            {label ? <RNText className="text-md text-semantic-text-default">{label}</RNText> : null}
            {children}
        </View>
    );
}
```

- [ ] **Step 3: Barrel + run + commit.**

```ts
// packages/ui/src/components/Switch/index.ts
export { Switch, type SwitchProps } from './Switch';
```

```bash
yarn workspace unbogify-ui test Switch.test
# 7 passed
git add packages/ui/src/components/Switch/
git commit -m "feat(ui): add Switch with role=switch, controlled+uncontrolled, asChild"
```

---

## Task 3 — Stories + registry + barrel

**Files:**
- Create: `packages/ui/src/components/Checkbox/Checkbox.stories.tsx`
- Create: `packages/ui/src/components/Switch/Switch.stories.tsx`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/stories/story-registry.ts`

- [ ] **Step 1: `packages/ui/src/components/Checkbox/Checkbox.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
    title: 'Controls/Checkbox',
    component: Checkbox,
    args: { label: 'Accept terms' },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };
```

- [ ] **Step 2: `packages/ui/src/components/Switch/Switch.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
    title: 'Controls/Switch',
    component: Switch,
    args: { label: 'Dark mode' },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Disabled: Story = { args: { disabled: true } };
```

- [ ] **Step 3: Update components barrel.**

```ts
// packages/ui/src/components/index.ts — add:
export * from './Checkbox';
export * from './Switch';
```

- [ ] **Step 4: Append registry entries** in `packages/ui/src/stories/story-registry.ts`:

```ts
import { Checkbox } from '../components/Checkbox';
import { Switch } from '../components/Switch';

// append:
{
    id: 'checkbox.default',
    title: 'Checkbox · default',
    render: () => <Checkbox testID="story-checkbox-default" label="Accept" />,
},
{
    id: 'checkbox.checked',
    title: 'Checkbox · checked',
    render: () => <Checkbox testID="story-checkbox-checked" label="Accept" defaultChecked />,
},
{
    id: 'switch.default',
    title: 'Switch · default',
    render: () => <Switch testID="story-switch-default" label="Dark mode" />,
},
{
    id: 'switch.on',
    title: 'Switch · on',
    render: () => <Switch testID="story-switch-on" label="Dark mode" defaultChecked />,
},
```

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/components/ packages/ui/src/stories/story-registry.ts
git commit -m "feat(ui): add Checkbox + Switch stories and registry entries"
```

---

## Task 4 — Playwright toggles coverage

**Files:**
- Create: `e2e/web/tests/toggles.spec.ts`

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Checkbox + Switch (web)', () => {
    test('Checkbox toggles aria-checked on click', async ({ page }) => {
        await page.goto('/');
        const cb = page.getByTestId('story-checkbox-default');
        await expect(cb).toHaveAttribute('aria-checked', 'false');
        await cb.click();
        await expect(cb).toHaveAttribute('aria-checked', 'true');
    });

    test('Switch has role=switch', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('story-switch-default')).toHaveAttribute('role', 'switch');
    });

    test('axe audit of toggle stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .include('[data-testid^="section-checkbox."], [data-testid^="section-switch."]')
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
```

Commit:
```bash
git add e2e/web/tests/toggles.spec.ts
git commit -m "test(e2e): add playwright Checkbox/Switch coverage + axe audit"
```

---

## Task 5 — Maestro toggles flow

**Files:**
- Create: `e2e/native/flows/toggles.yaml`

```yaml
appId: dev.unbogify.playground
---
- launchApp
- scrollUntilVisible:
    element:
      id: 'section-checkbox.default'
- tapOn:
    id: 'story-checkbox-default'
- scrollUntilVisible:
    element:
      id: 'section-switch.default'
- tapOn:
    id: 'story-switch-default'
```

```bash
git add e2e/native/flows/toggles.yaml
git commit -m "test(e2e): add maestro toggles flow"
```

---

## Task 6 — Size budgets + final verification

Append to `packages/ui/.size-limit.cjs`:

```js
{
    name: 'Checkbox',
    path: 'src/components/Checkbox/index.ts',
    limit: '3 KB',
    ignore: ['react', 'react-native'],
},
{
    name: 'Switch',
    path: 'src/components/Switch/index.ts',
    limit: '3 KB',
    ignore: ['react', 'react-native'],
},
```

Run the full pipeline:

```bash
yarn biome check .
yarn eslint .
yarn typecheck
yarn test
yarn size
yarn test:e2e:web
```

All green.

```bash
git add packages/ui/.size-limit.cjs
git commit -m "chore(ui): add Checkbox + Switch size-limit entries"
```

---

## Done criteria for Plan 05d

- [ ] `Checkbox` (8 tests) and `Switch` (7 tests) green.
- [ ] Stories registered, Playwright + axe pass, Maestro flow committed.
- [ ] `yarn test` total: 82 + 15 = 97 passing.
- [ ] All 11 v0.1 components (Text, Box, HStack, VStack, Spinner, Button, TextInput, TextArea, Checkbox, Switch, + Icon from Plan 03) ship.
- [ ] Combined first-import `yarn size` under the 40 KB spec budget.

When all boxes are ticked, Plan 05 is complete. Plan 06 (Docs + MCP) can begin.

---

## Errata (post-execution notes)

1. **Jest RN mock — `aria-checked="mixed"` support.** `accessibilityState.checked` now accepts `'mixed'` as well as booleans. Explicit `aria-*` props passed via rest must take precedence over `accessibilityState.*` mappings — order matters in the mock. Required so Checkbox's indeterminate test passes.
2. **RSC-safety allowlist.** `components/Checkbox/Checkbox.tsx` and `components/Switch/Switch.tsx` must be added to `CLIENT_ALLOWED` in `packages/ui/__tests__/rsc-safety.test.ts` — they declare `'use client'` because they use `useState`/`useCallback`.
3. **asChild test stubs need `tabIndex={0}`** to satisfy a11y lint and focusability, plus a `biome-ignore lint/a11y/useSemanticElements` comment — `role="checkbox"` on a `<div>` is flagged (fair: production usage should target native elements, but the test stub is intentional).
4. **NativeWind doesn't compile for playground-web (Vite target)** — component className layout classes (`w-5 h-5`, `bg-neutral-300`, `rounded-full`) don't produce real CSS there. Fix: add inline `style={{ …fallback dimensions and colors }}` alongside the `className` so the visual renders on the playground-web build. This is a playground-rendering issue, not a library issue; production consumers with NativeWind's Babel plugin active get the className-only path.

**v0.1 component milestone reached** with this plan's execution: Text, Box, HStack, VStack, Icon, Spinner, Button, TextInput, TextArea, Checkbox, Switch — all 11 shipped.
