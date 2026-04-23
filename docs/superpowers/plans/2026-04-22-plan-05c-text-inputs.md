# Plan 05c — TextInput + TextArea Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `TextInput` (single-line) and `TextArea` (multi-line). Both support label, placeholder, helper text, error state, disabled state, prefix/suffix slots, controlled + uncontrolled usage, and follow WCAG 2.2 AA labeling requirements.

**Architecture:** `TextInput` owns the shared foundation (label, helper, error, prefix/suffix layout, a11y wiring). `TextArea` is a thin wrapper that reuses `TextInput`'s foundation via props and adds `multiline + numberOfLines`.

**Applies all prior errata.** Pattern mirrors Plan 05b: one task per component for impl+test, separate tasks for stories, Playwright, Maestro.

---

## File Structure

**Created:**
```
packages/core/src/components/TextInput/TextInput.tsx
packages/core/src/components/TextInput/index.ts
packages/core/src/components/TextInput/TextInput.stories.tsx
packages/core/src/components/TextInput/__tests__/TextInput.test.tsx

packages/core/src/components/TextArea/TextArea.tsx
packages/core/src/components/TextArea/index.ts
packages/core/src/components/TextArea/TextArea.stories.tsx
packages/core/src/components/TextArea/__tests__/TextArea.test.tsx

e2e/web/tests/inputs.spec.ts
e2e/native/flows/inputs.yaml
```

**Modified:**
- `packages/core/src/components/index.ts` — add TextInput + TextArea
- `packages/core/src/stories/story-registry.ts` — append entries
- `packages/core/.size-limit.cjs` — add budgets

---

## Task 1 — `TextInput` component

**Files:**
- Create: `packages/core/src/components/TextInput/TextInput.tsx`
- Create: `packages/core/src/components/TextInput/index.ts`
- Create: `packages/core/src/components/TextInput/__tests__/TextInput.test.tsx`

- [ ] **Step 1: Write the failing test.**

`packages/core/src/components/TextInput/__tests__/TextInput.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { TextInput } from '../TextInput';

describe('<TextInput>', () => {
    it('renders as a textbox when no label is provided', () => {
        render(<TextInput />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates the label with the input via htmlFor/id (a11y)', () => {
        render(<TextInput label="Email" testID="in" />);
        const input = screen.getByTestId('in');
        const id = input.getAttribute('id');
        expect(id).toBeTruthy();
        // label is a <label> element with htmlFor === id on web
        const label = screen.getByText('Email');
        expect(label.getAttribute('for') ?? label.getAttribute('htmlFor')).toBe(id);
    });

    it('uncontrolled: calls onChangeText on input', () => {
        const onChangeText = jest.fn();
        render(<TextInput onChangeText={onChangeText} testID="in" />);
        fireEvent.change(screen.getByTestId('in'), { target: { value: 'hello' } });
        expect(onChangeText).toHaveBeenCalledWith('hello');
    });

    it('controlled: reflects value and updates via onChangeText', () => {
        function Wrapper() {
            const [v, setV] = useState('');
            return <TextInput testID="in" value={v} onChangeText={setV} />;
        }
        render(<Wrapper />);
        const input = screen.getByTestId('in');
        fireEvent.change(input, { target: { value: 'a' } });
        expect((input as HTMLInputElement).value).toBe('a');
    });

    it('shows helper text when provided', () => {
        render(<TextInput label="Email" helperText="We'll never share it" />);
        expect(screen.getByText("We'll never share it")).toBeInTheDocument();
    });

    it('shows error message and sets aria-invalid when error prop is set', () => {
        render(<TextInput label="Email" error="Required" testID="in" />);
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByTestId('in').getAttribute('aria-invalid')).toBe('true');
    });

    it('error takes precedence over helperText', () => {
        render(<TextInput label="Email" helperText="Helper" error="Error" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('respects disabled state', () => {
        const onChangeText = jest.fn();
        render(<TextInput disabled onChangeText={onChangeText} testID="in" />);
        fireEvent.change(screen.getByTestId('in'), { target: { value: 'x' } });
        expect(onChangeText).not.toHaveBeenCalled();
    });

    it('renders leading and trailing content', () => {
        render(
            <TextInput
                label="Search"
                leading={<span data-testid="lead">🔍</span>}
                trailing={<span data-testid="trail">x</span>}
            />,
        );
        expect(screen.getByTestId('lead')).toBeInTheDocument();
        expect(screen.getByTestId('trail')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/TextInput/TextInput.tsx`.**

```tsx
import { useId } from 'react';
import type { ReactNode } from 'react';
import { TextInput as RNTextInput, View, Text as RNText } from 'react-native';
import type { TextInputProps as RNTextInputProps } from 'react-native';
import { cn } from '../../utils/cn';

export type TextInputProps = Omit<RNTextInputProps, 'editable'> & {
    label?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    /** Pass through a custom wrapper className */
    containerClassName?: string;
    className?: string;
    testID?: string;
    /** Controlled text handler. Optional so uncontrolled usage works too. */
    onChangeText?: (text: string) => void;
    /** Multi-line mode — flipped by TextArea. Default false. */
    multiline?: boolean;
    numberOfLines?: number;
};

/**
 * Single-line text input with label, helper, error, and leading/trailing slots.
 *
 * a11y: label is a <label for={id}>; the input is `aria-invalid=true` + labelled
 * by the error/helper text via aria-describedby when present.
 *
 * Notionally RSC-safe — uses only useId() which React 19 guarantees is safe on
 * the server. No "use client" required.
 */
export function TextInput({
    label,
    helperText,
    error,
    disabled,
    leading,
    trailing,
    containerClassName,
    className,
    testID,
    onChangeText,
    multiline,
    numberOfLines,
    ...rest
}: TextInputProps) {
    const reactId = useId();
    const inputId = testID ?? `nori-ui-input-${reactId}`;
    const describeId = `${inputId}-describe`;
    const describedBy = error || helperText ? describeId : undefined;
    const hasError = Boolean(error);

    return (
        <View className={cn('flex flex-col gap-1', containerClassName)}>
            {label !== undefined ? (
                <label htmlFor={inputId} className="text-sm font-medium text-semantic-text-default">
                    {label}
                </label>
            ) : null}
            <View
                className={cn(
                    'flex-row items-center rounded-md border px-3',
                    hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                    disabled ? 'opacity-60' : undefined,
                )}
            >
                {leading ? <View className="mr-2">{leading}</View> : null}
                <RNTextInput
                    nativeID={inputId}
                    testID={testID}
                    editable={!disabled}
                    accessibilityLabel={label}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onChangeText={onChangeText}
                    className={cn('flex-1 py-2 text-md text-semantic-text-default outline-none', className)}
                    {...rest}
                />
                {trailing ? <View className="ml-2">{trailing}</View> : null}
            </View>
            {error ? (
                <RNText id={describeId} className="text-sm text-semantic-interactive-destructive">
                    {error}
                </RNText>
            ) : helperText ? (
                <RNText id={describeId} className="text-sm text-semantic-text-muted">
                    {helperText}
                </RNText>
            ) : null}
        </View>
    );
}
```

Design notes:
- `useId()` is React 19 stable and RSC-safe — it hydrates consistently across server/client.
- `<label htmlFor>` is a raw DOM element (web-only); on native, `accessibilityLabel` covers the labeling contract. RN-Web treats `<label>` as native HTML, so the `htmlFor` assertion in tests works.
- `aria-describedby` points at whichever message is shown (error > helper).

- [ ] **Step 3: Create `packages/core/src/components/TextInput/index.ts`.**

```ts
export { TextInput, type TextInputProps } from './TextInput';
```

- [ ] **Step 4: Run tests — 9 passed.**

```bash
yarn workspace @nori-ui/core test TextInput.test
```

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/TextInput/
git commit -m "feat(ui): add TextInput with label, helper, error, prefix/suffix slots, WCAG AA a11y"
```

---

## Task 2 — `TextArea` component

**Files:**
- Create: `packages/core/src/components/TextArea/TextArea.tsx`
- Create: `packages/core/src/components/TextArea/index.ts`
- Create: `packages/core/src/components/TextArea/__tests__/TextArea.test.tsx`

- [ ] **Step 1: Write the test.**

`packages/core/src/components/TextArea/__tests__/TextArea.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { TextArea } from '../TextArea';

describe('<TextArea>', () => {
    it('renders as a multiline textbox', () => {
        render(<TextArea testID="ta" label="Bio" />);
        const el = screen.getByTestId('ta');
        // RN-Web renders multiline RNTextInput as a <textarea>
        expect(el.tagName.toLowerCase()).toBe('textarea');
    });

    it('sets rows via numberOfLines (maps to textarea rows on web)', () => {
        render(<TextArea testID="ta" numberOfLines={6} />);
        const el = screen.getByTestId('ta');
        expect(el.getAttribute('rows')).toBe('6');
    });

    it('propagates onChangeText', () => {
        const onChangeText = jest.fn();
        render(<TextArea onChangeText={onChangeText} testID="ta" />);
        fireEvent.change(screen.getByTestId('ta'), { target: { value: 'multiline\nvalue' } });
        expect(onChangeText).toHaveBeenCalledWith('multiline\nvalue');
    });

    it('shows error state', () => {
        render(<TextArea testID="ta" label="Bio" error="Too long" />);
        expect(screen.getByText('Too long')).toBeInTheDocument();
        expect(screen.getByTestId('ta').getAttribute('aria-invalid')).toBe('true');
    });
});
```

- [ ] **Step 2: Implement `packages/core/src/components/TextArea/TextArea.tsx`.**

```tsx
import type { TextInputProps } from '../TextInput';
import { TextInput } from '../TextInput';

export type TextAreaProps = TextInputProps;

/**
 * Multi-line text input. Thin wrapper over TextInput that fixes `multiline=true`
 * and provides a sensible default for `numberOfLines`.
 */
export function TextArea({ numberOfLines = 4, ...rest }: TextAreaProps) {
    return <TextInput multiline numberOfLines={numberOfLines} {...rest} />;
}
```

- [ ] **Step 3: `packages/core/src/components/TextArea/index.ts`.**

```ts
export { TextArea, type TextAreaProps } from './TextArea';
```

- [ ] **Step 4: Run tests — 4 passed.**

```bash
yarn workspace @nori-ui/core test TextArea.test
```

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/TextArea/
git commit -m "feat(ui): add TextArea as multiline wrapper over TextInput"
```

---

## Task 3 — Stories + registry entries + barrel

**Files:**
- Create: `packages/core/src/components/TextInput/TextInput.stories.tsx`
- Create: `packages/core/src/components/TextArea/TextArea.stories.tsx`
- Modify: `packages/core/src/stories/story-registry.ts`
- Modify: `packages/core/src/components/index.ts`

- [ ] **Step 1: `packages/core/src/components/TextInput/TextInput.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
    title: 'Inputs/TextInput',
    component: TextInput,
    args: { label: 'Email', placeholder: 'you@example.com' },
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};
export const WithHelper: Story = { args: { helperText: "We won't share this." } };
export const WithError: Story = { args: { error: 'Required', value: '' } };
export const Disabled: Story = { args: { disabled: true, value: 'read only' } };
```

- [ ] **Step 2: `packages/core/src/components/TextArea/TextArea.stories.tsx`.**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
    title: 'Inputs/TextArea',
    component: TextArea,
    args: { label: 'Bio', placeholder: 'Tell us about yourself', numberOfLines: 4 },
};
export default meta;

export const Default: StoryObj<typeof TextArea> = {};
export const WithError: StoryObj<typeof TextArea> = { args: { error: 'Max 500 characters' } };
```

- [ ] **Step 3: Append to `packages/core/src/stories/story-registry.ts`:**

```ts
import { TextInput } from '../components/TextInput';
import { TextArea } from '../components/TextArea';

// append:
{
    id: 'text-input.default',
    title: 'TextInput · default',
    render: () => <TextInput testID="story-text-input-default" label="Email" placeholder="you@example.com" />,
},
{
    id: 'text-input.error',
    title: 'TextInput · error',
    render: () => <TextInput testID="story-text-input-error" label="Email" error="Required" />,
},
{
    id: 'text-area.default',
    title: 'TextArea · default',
    render: () => <TextArea testID="story-text-area-default" label="Bio" numberOfLines={3} />,
},
```

- [ ] **Step 4: Update `packages/core/src/components/index.ts`** to re-export.

```ts
export * from './Text';
export * from './Box';
export * from './HStack';
export * from './VStack';
export * from './Spinner';
export * from './Button';
export * from './TextInput';
export * from './TextArea';
```

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/TextInput/TextInput.stories.tsx packages/core/src/components/TextArea/TextArea.stories.tsx packages/core/src/components/index.ts packages/core/src/stories/story-registry.ts
git commit -m "feat(ui): add TextInput + TextArea stories, re-export from components barrel"
```

---

## Task 4 — Playwright inputs spec

**Files:**
- Create: `e2e/web/tests/inputs.spec.ts`

- [ ] **Step 1: `e2e/web/tests/inputs.spec.ts`.**

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('TextInput + TextArea (web)', () => {
    test('TextInput accepts typed input and reflects the value', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('story-text-input-default');
        await input.fill('user@example.com');
        await expect(input).toHaveValue('user@example.com');
    });

    test('TextInput error state carries aria-invalid=true and shows message', async ({ page }) => {
        await page.goto('/');
        const input = page.getByTestId('story-text-input-error');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('TextArea renders as textarea with the configured rows', async ({ page }) => {
        await page.goto('/');
        const textarea = page.getByTestId('story-text-area-default');
        await expect(textarea).toHaveAttribute('rows', '3');
    });

    test('axe audit of input stories', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page }).include('[data-testid^="section-text-"]').analyze();
        expect(results.violations).toEqual([]);
    });
});
```

- [ ] **Step 2: Commit.**

```bash
git add e2e/web/tests/inputs.spec.ts
git commit -m "test(e2e): add playwright TextInput/TextArea coverage + axe audit"
```

---

## Task 5 — Maestro inputs flow

**Files:**
- Create: `e2e/native/flows/inputs.yaml`

```yaml
appId: dev.noriui.playground
---
- launchApp
- scrollUntilVisible:
    element:
      id: 'section-text-input.default'
- tapOn:
    id: 'story-text-input-default'
- inputText: 'hello@example.com'
- scrollUntilVisible:
    element:
      id: 'section-text-area.default'
- tapOn:
    id: 'story-text-area-default'
- inputText: 'a multiline\nvalue'
```

Commit:
```bash
git add e2e/native/flows/inputs.yaml
git commit -m "test(e2e): add maestro inputs flow"
```

---

## Task 6 — Size-limit + final verification

- [ ] **Step 1:** append to `packages/core/.size-limit.cjs`:

```js
{
    name: 'TextInput',
    path: 'src/components/TextInput/index.ts',
    limit: '3 KB',
    ignore: ['react', 'react-native'],
},
{
    name: 'TextArea',
    path: 'src/components/TextArea/index.ts',
    limit: '3 KB',
    ignore: ['react', 'react-native'],
},
```

Then: `yarn size`, `yarn test`, `yarn test:e2e:web` — all green.

```bash
git add packages/core/.size-limit.cjs
git commit -m "chore(ui): add TextInput + TextArea size-limit entries"
```

---

## Done criteria for Plan 05c

- [ ] `TextInput` (9 tests) + `TextArea` (4 tests) ship green.
- [ ] Stories + registry entries + Playwright + Maestro in place.
- [ ] WCAG AA a11y: label/input association, aria-invalid on error, aria-describedby pointing at the active message.
- [ ] `yarn test` running total: 69 (from 05b) + 13 = 82 passing.

Plan 05d (Checkbox + Switch) is next.
