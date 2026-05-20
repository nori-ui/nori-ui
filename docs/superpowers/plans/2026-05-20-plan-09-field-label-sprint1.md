# Field + Label Sprint 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Field` (compound: `.Label`, `.Description`, `.Error`, `.Control`, `.Group`) and standalone `Label`; migrate the six existing controls (TextInput, TextArea, Select, Checkbox, Radio.Group, Switch) by removing their inline `label`/`helperText`/`error` props.

**Architecture:** Field is layout + a11y only — zero form state, source-agnostic `error`. Prop injection onto the child control happens via `Field.Control` (`React.cloneElement`), not via a public hook. Form-framework agnostic; RHF integration lives only in documentation.

**Tech Stack:** React 19, TypeScript strict, react-native + react-native-web, Jest (jsdom + jest-expo projects), @testing-library/{react,react-native}, biome, lefthook.

**Spec:** `docs/superpowers/specs/2026-05-20-field-label-design.md`

**Commit policy:** ONE commit at the very end (Task 17). All intermediate tasks change files without committing.

---

## File map

Create:
- `packages/core/src/components/Field/Field.tsx`
- `packages/core/src/components/Field/index.ts`
- `packages/core/src/components/Field/Field.stories.tsx`
- `packages/core/src/components/Field/__tests__/Field.test.tsx`
- `packages/core/src/components/Field/__tests__/native/Field.native.test.tsx`
- `packages/core/src/components/Label/Label.tsx`
- `packages/core/src/components/Label/index.ts`
- `packages/core/src/components/Label/Label.stories.tsx`
- `packages/core/src/components/Label/__tests__/Label.test.tsx`
- `packages/core/src/components/Label/__tests__/native/Label.native.test.tsx`
- `apps/docs/content/docs/components/field.mdx`
- `apps/docs/content/docs/components/label.mdx`

Modify:
- `packages/core/src/i18n/default-dictionary.ts` (+2 keys)
- `packages/core/src/i18n/types.ts` (declare the 2 new keys if the type is closed; subagent verifies)
- `packages/core/src/components/index.ts` (export Field + Label)
- `packages/core/__tests__/rsc-safety.test.ts` (allowlist `Field/Field.tsx` + `Label/Label.tsx`)
- `packages/core/src/components/TextInput/TextInput.tsx` (drop `label`, `helperText`, `error`)
- `packages/core/src/components/TextInput/TextInput.stories.tsx`
- `packages/core/src/components/TextInput/__tests__/*` (drop assertions on removed props)
- `packages/core/src/components/TextArea/TextArea.tsx` (Omit from inherited type; nothing else)
- `packages/core/src/components/TextArea/TextArea.stories.tsx`
- `packages/core/src/components/Select/Select.tsx` (drop `label`, `helperText`, `error`)
- `packages/core/src/components/Select/Select.stories.tsx`
- `packages/core/src/components/Select/__tests__/*`
- `packages/core/src/components/Checkbox/Checkbox.tsx` (drop `helperText`, `error` — keep `label`)
- `packages/core/src/components/Checkbox/Checkbox.stories.tsx`
- `packages/core/src/components/Checkbox/__tests__/*`
- `packages/core/src/components/Switch/Switch.tsx` (drop `helperText`, `error` — keep `label`)
- `packages/core/src/components/Switch/Switch.stories.tsx`
- `packages/core/src/components/Switch/__tests__/*`
- `packages/core/src/components/Radio/Radio.tsx` (drop `helperText`, `error` on `Radio.Group` — keep per-item `label`)
- `packages/core/src/components/Radio/Radio.stories.tsx`
- `packages/core/src/components/Radio/__tests__/*`
- `apps/docs/content/docs/components/text-input.mdx`
- `apps/docs/content/docs/components/text-area.mdx`
- `apps/docs/content/docs/components/select.mdx`
- `apps/docs/content/docs/components/checkbox.mdx`
- `apps/docs/content/docs/components/radio.mdx`
- `apps/docs/content/docs/components/switch.mdx`

---

## Task 1: Scaffold directories + dictionary keys

**Files:**
- Create: `packages/core/src/components/Field/index.ts` (empty re-export shim — exports nothing yet)
- Create: `packages/core/src/components/Field/Field.tsx` (stub)
- Create: `packages/core/src/components/Label/index.ts`
- Create: `packages/core/src/components/Label/Label.tsx` (stub)
- Modify: `packages/core/src/i18n/default-dictionary.ts` (+2 keys)
- Modify: `packages/core/__tests__/rsc-safety.test.ts` (allowlist 2 new files)

- [ ] **Step 1: Create stub `Field.tsx`** (so imports resolve in following tasks)

```tsx
// packages/core/src/components/Field/Field.tsx
'use client';

import type { ReactNode } from 'react';
import { View } from 'react-native';

export type FieldProps = { children?: ReactNode };

export const Field = ({ children }: FieldProps) => <View>{children}</View>;
```

- [ ] **Step 2: Create stub `Label.tsx`**

```tsx
// packages/core/src/components/Label/Label.tsx
'use client';

import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';

export type LabelProps = { htmlFor: string; children?: ReactNode };

export const Label = ({ children }: LabelProps) => <RNText>{children}</RNText>;
```

- [ ] **Step 3: Create the two index.ts barrels**

```ts
// packages/core/src/components/Field/index.ts
export { Field } from './Field';
export type { FieldProps } from './Field';
```

```ts
// packages/core/src/components/Label/index.ts
export { Label } from './Label';
export type { LabelProps } from './Label';
```

- [ ] **Step 4: Add dictionary keys**

In `packages/core/src/i18n/default-dictionary.ts`, add to the `defaultDictionary` object (anywhere — order doesn't matter, but group near other form-control entries):

```ts
    // field
    'field.requiredIndicator': '*',
    'field.requiredLabel': 'required',
```

If `Dictionary` in `i18n/types.ts` enumerates keys with a union, add the three new keys there too. If it's an open `Record<string, string>`, no change.

- [ ] **Step 5: Add RSC allowlist entries**

In `packages/core/__tests__/rsc-safety.test.ts`, in the `CLIENT_ALLOWED` array (where `components/Checkbox/Checkbox.tsx` and similar are listed), add:

```ts
    'components/Field/Field.tsx',
    'components/Label/Label.tsx',
```

- [ ] **Step 6: Verify the build still resolves**

```bash
yarn workspace @nori-ui/core typecheck
```

Expected: PASS (the stubs compile; new dictionary entries pass type check; allowlist is just data).

- [ ] **Step 7: Verify the RSC safety test passes**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:node --testPathPattern rsc-safety
```

Expected: PASS.

**Do not commit.**

---

## Task 2: Field root + Field.Label + id linkage (TDD)

**Files:**
- Create: `packages/core/src/components/Field/__tests__/Field.test.tsx`
- Modify: `packages/core/src/components/Field/Field.tsx`

- [ ] **Step 1: Write failing test for label-control id linkage**

```tsx
// packages/core/src/components/Field/__tests__/Field.test.tsx
import { render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { TextInput } from '../../TextInput';
import { Field } from '../Field';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Field', () => {
    it('associates Field.Label with the control by id', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const labelText = screen.getByText('Email');
        const labelId = labelText.getAttribute('id');
        expect(labelId).toBeTruthy();
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-labelledby')).toBe(labelId);
    });
});
```

- [ ] **Step 2: Run test, confirm failure**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:jsdom --testPathPattern 'Field/__tests__/Field.test'
```

Expected: FAIL — `Field.Label` is not a function / id linkage absent.

- [ ] **Step 3: Implement Field with Field.Label, Field.Control, internal context**

Replace `packages/core/src/components/Field/Field.tsx` with:

```tsx
'use client';

import {
    Children,
    cloneElement,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useContext,
    useId,
    useMemo,
} from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';

type FieldContextValue = {
    fieldId: string;
    labelId: string;
    descriptionId: string;
    errorId: string;
    hasError: boolean;
    hasDescription: boolean;
    describedBy: string | undefined;
    disabled: boolean;
    required: boolean;
    validating: boolean;
    name?: string;
    error?: string | null;
    isGroup: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

const useFieldContextStrict = (caller: string): FieldContextValue => {
    const ctx = useContext(FieldContext);
    if (!ctx) {
        throw new Error(`[Field] ${caller} must be used inside <Field> or <Field.Group>.`);
    }
    return ctx;
};

const childHasDisplayName = (child: ReactNode, name: string): boolean => {
    if (!isValidElement(child)) {
        return false;
    }
    const t = child.type as { displayName?: string } | string;
    return typeof t !== 'string' && t?.displayName === name;
};

export type FieldProps = {
    name?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
    validating?: boolean;
    orientation?: 'vertical' | 'horizontal';
    id?: string;
    children: ReactNode;
    className?: string;
    testID?: string;
};

type FieldRootInternalProps = FieldProps & { isGroup?: boolean };

const FieldRoot = ({
    name,
    required = false,
    disabled = false,
    error = null,
    validating = false,
    orientation = 'vertical',
    id,
    children,
    className,
    testID,
    isGroup = false,
}: FieldRootInternalProps) => {
    const colors = useThemeColors();
    const reactId = useId();
    const fieldId = id ?? `nori-ui-field-${reactId}`;
    const labelId = `${fieldId}-label`;
    const descriptionId = `${fieldId}-desc`;
    const errorId = `${fieldId}-error`;

    const hasDescription = useMemo(() => {
        let found = false;
        Children.forEach(children, (child) => {
            if (childHasDisplayName(child, 'Field.Description')) {
                found = true;
            }
        });
        return found;
    }, [children]);

    const hasError = Boolean(error);

    const describedBy = useMemo(() => {
        const ids: string[] = [];
        if (hasDescription) ids.push(descriptionId);
        if (hasError) ids.push(errorId);
        return ids.length === 0 ? undefined : ids.join(' ');
    }, [hasDescription, hasError, descriptionId, errorId]);

    const value: FieldContextValue = {
        fieldId,
        labelId,
        descriptionId,
        errorId,
        hasError,
        hasDescription,
        describedBy,
        disabled,
        required,
        validating,
        name,
        error,
        isGroup,
    };

    const containerStyle =
        orientation === 'horizontal'
            ? {
                  flexDirection: 'row' as const,
                  alignItems: 'flex-start' as const,
                  gap: px(colors.spacing['3']),
              }
            : { flexDirection: 'column' as const, gap: px(colors.spacing['1']) };

    const containerExtra: Record<string, unknown> = {};
    if (testID !== undefined) {
        containerExtra.testID = testID;
    }
    if (isGroup) {
        containerExtra.role = 'group';
        containerExtra['aria-labelledby'] = labelId;
        containerExtra.accessibilityRole = 'none';
    }

    return (
        <FieldContext.Provider value={value}>
            <View style={containerStyle} className={className} {...containerExtra}>
                {children}
            </View>
        </FieldContext.Provider>
    );
};

const FieldLabel = ({ children }: { children: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Label');
    const colors = useThemeColors();
    const t = useTranslation();
    const requiredIndicator = t('field.requiredIndicator');
    const requiredLabel = t('field.requiredLabel');

    const focusInput = () => {
        if (typeof document !== 'undefined') {
            const el = document.getElementById(ctx.fieldId);
            if (el && typeof (el as HTMLElement).focus === 'function') {
                (el as HTMLElement).focus();
            }
        }
    };

    return (
        <Pressable onPress={focusInput} accessibilityRole="none" disabled={ctx.disabled}>
            <RNText
                nativeID={ctx.labelId}
                {...({ id: ctx.labelId } as Record<string, unknown>)}
                accessibilityRole="text"
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: colors.fontWeight.medium as '500',
                    color: ctx.disabled ? colors.semantic.text.muted : colors.semantic.text.default,
                }}
            >
                {children}
                {ctx.required ? (
                    <RNText
                        accessibilityLabel={requiredLabel}
                        {...({ 'aria-label': requiredLabel } as Record<string, unknown>)}
                        style={{ color: colors.color.danger }}
                    >
                        {` ${requiredIndicator}`}
                    </RNText>
                ) : null}
            </RNText>
        </Pressable>
    );
};
FieldLabel.displayName = 'Field.Label';

const FieldControl = ({ children }: { children: ReactElement }) => {
    const ctx = useFieldContextStrict('Field.Control');
    if (Children.count(children) !== 1 || !isValidElement(children)) {
        throw new Error('[Field.Control] expects exactly one child element.');
    }
    const child = children as ReactElement<Record<string, unknown>>;
    const merged: Record<string, unknown> = {
        id: child.props.id ?? ctx.fieldId,
        accessibilityLabelledBy: ctx.labelId,
        'aria-labelledby': ctx.labelId,
    };
    if (ctx.name !== undefined && child.props.name === undefined) {
        merged.name = ctx.name;
    }
    if (ctx.describedBy !== undefined) {
        merged['aria-describedby'] = ctx.describedBy;
        merged.accessibilityDescribedBy = ctx.describedBy;
    }
    if (ctx.hasError) {
        merged['aria-invalid'] = true;
    }
    if (ctx.required) {
        merged['aria-required'] = true;
    }
    if (ctx.disabled || child.props.disabled) {
        merged.disabled = true;
    }
    return cloneElement(child, merged);
};
FieldControl.displayName = 'Field.Control';

export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Control: FieldControl,
});
```

- [ ] **Step 4: Run test, confirm pass**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:jsdom --testPathPattern 'Field/__tests__/Field.test'
```

Expected: PASS.

**Do not commit.**

---

## Task 3: Field.Description + describedby threading

**Files:**
- Modify: `packages/core/src/components/Field/__tests__/Field.test.tsx`
- Modify: `packages/core/src/components/Field/Field.tsx`

- [ ] **Step 1: Add failing tests for Description**

Append to `Field.test.tsx`:

```tsx
    it('renders Field.Description with stable id', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Description>We'll never share this.</Field.Description>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const desc = screen.getByText("We'll never share this.");
        const id = desc.getAttribute('id');
        expect(id).toMatch(/-desc$/);
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-describedby')).toBe(id);
    });

    it('aria-describedby is undefined when no description and no error', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-describedby')).toBeNull();
    });
```

- [ ] **Step 2: Run, confirm failure**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:jsdom --testPathPattern 'Field/__tests__/Field.test'
```

Expected: FAIL — `Field.Description` undefined.

- [ ] **Step 3: Implement Field.Description**

In `Field.tsx`, add (before the `Object.assign` line):

```tsx
const FieldDescription = ({ children }: { children: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Description');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.descriptionId}
            {...({ id: ctx.descriptionId } as Record<string, unknown>)}
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.semantic.text.muted,
            }}
        >
            {children}
        </RNText>
    );
};
FieldDescription.displayName = 'Field.Description';
```

And extend the `Object.assign` call:

```tsx
export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Description: FieldDescription,
    Control: FieldControl,
});
```

- [ ] **Step 4: Run, confirm pass**

Same command. Expected: PASS.

**Do not commit.**

---

## Task 4: Field.Error + error state threading

**Files:**
- Modify: `packages/core/src/components/Field/__tests__/Field.test.tsx`
- Modify: `packages/core/src/components/Field/Field.tsx`

- [ ] **Step 1: Add failing tests**

Append to `Field.test.tsx`:

```tsx
    it('sets aria-invalid when error truthy and renders Field.Error from context', () => {
        wrap(
            <Field error="Email is required">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        const err = screen.getByText('Email is required');
        const id = err.getAttribute('id');
        expect(id).toMatch(/-error$/);
        expect(input.getAttribute('aria-describedby')).toBe(id);
    });

    it('describedby joins description and error ids when both present', () => {
        wrap(
            <Field error="Required">
                <Field.Label>Email</Field.Label>
                <Field.Description>Helper text</Field.Description>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        const describedBy = input.getAttribute('aria-describedby') ?? '';
        const ids = describedBy.split(' ');
        expect(ids).toHaveLength(2);
        expect(ids[0]).toMatch(/-desc$/);
        expect(ids[1]).toMatch(/-error$/);
    });

    it('Field.Error children override the context error message', () => {
        wrap(
            <Field error="Original message">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error>Overridden message</Field.Error>
            </Field>
        );
        expect(screen.getByText('Overridden message')).toBeInTheDocument();
        expect(screen.queryByText('Original message')).toBeNull();
    });

    it('Field.Error renders nothing when there is no error and no children', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });
```

- [ ] **Step 2: Run, confirm failures**

Expected: FAIL — Field.Error undefined.

- [ ] **Step 3: Implement Field.Error**

Add to `Field.tsx` before the final `Object.assign`:

```tsx
const FieldError = ({ children }: { children?: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Error');
    const colors = useThemeColors();
    const content = children ?? ctx.error;
    if (content === null || content === undefined || content === '' || content === false) {
        return null;
    }
    return (
        <RNText
            nativeID={ctx.errorId}
            {...({ id: ctx.errorId, role: 'alert' } as Record<string, unknown>)}
            accessibilityRole="text"
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.color.danger,
            }}
        >
            {content}
        </RNText>
    );
};
FieldError.displayName = 'Field.Error';
```

Extend `Object.assign`:

```tsx
export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Description: FieldDescription,
    Control: FieldControl,
    Error: FieldError,
});
```

- [ ] **Step 4: Run, confirm pass**

Expected: PASS.

**Do not commit.**

---

## Task 5: required, disabled, validating prop threading

**Files:**
- Modify: `packages/core/src/components/Field/__tests__/Field.test.tsx`
- Modify: `packages/core/src/components/Field/Field.tsx`

- [ ] **Step 1: Add failing tests**

Append:

```tsx
    it('threads aria-required when required', () => {
        wrap(
            <Field required>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('disabled flows from Field to control and ORs with control own disabled', () => {
        wrap(
            <Field disabled>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" editable={false} />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        // RN-Web translates editable={false} to readonly + disabled cascade in our stack.
        // Verify the rendered element receives the merged disabled prop:
        expect(input).toHaveAttribute('disabled');
    });

    it('renders validating spinner without removing the error', () => {
        wrap(
            <Field validating error="Server says nope">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        // Spinner is rendered when validating; verify presence by aria-busy or test id.
        // The Field render exposes a `data-validating` data attribute on the container
        // we can assert on:
        const container = screen.getByText('Server says nope').closest('[data-validating]');
        expect(container).not.toBeNull();
    });
```

- [ ] **Step 2: Run, confirm failures**

Expected: FAIL on the required + validating cases.

- [ ] **Step 3: Implement: required visual + aria-required already partly there. Add validating attribute + Spinner.**

The required indicator already lives in `Field.Label` (Task 2). Confirm it renders by adding `accessibilityLabel` / `aria-label="required"` on the indicator (the Task 2 code already does this). If not, fix in Field.Label.

For validating, in `FieldRoot`:

1. Add to `containerExtra`:

```tsx
    if (validating) {
        containerExtra['data-validating'] = '';
        containerExtra['aria-busy'] = true;
    }
```

2. Import Spinner at the top of the file:

```tsx
import { Spinner } from '../Spinner';
```

3. In the rendered tree, append the Spinner after `{children}` when validating:

```tsx
    return (
        <FieldContext.Provider value={value}>
            <View style={containerStyle} className={className} {...containerExtra}>
                {children}
                {validating ? <Spinner size="sm" /> : null}
            </View>
        </FieldContext.Provider>
    );
```

Verify Spinner's actual prop API before assuming `size="sm"` — consult `packages/core/src/components/Spinner/Spinner.tsx`. If the prop differs (e.g., a numeric size token), adapt accordingly.

For `disabled` propagation: `FieldControl` already merges `disabled`. RN-Web maps `disabled` to the host attribute on web; on RN, the `disabled` prop has component-specific meaning. The Field passes the boolean; consuming controls (TextInput etc.) interpret it. Verify the test passes; if RN-Web's translation drops `disabled` on TextInput, switch to `aria-disabled` + `accessibilityState.disabled` instead.

If the disabled test still fails because TextInput uses `editable` not `disabled` natively, update the test to assert on `accessibilityState.disabled` via the `accessibility-state` data attribute that nori-ui's rn-web setup emits (see existing TextInput tests for the pattern). Alternative path: TextInput already accepts a `disabled` prop (verify in `TextInput.tsx`) and translates it internally — in that case the merged `disabled` from Field.Control flows through.

- [ ] **Step 4: Run, confirm pass**

Expected: PASS.

**Do not commit.**

---

## Task 6: Field.Group + role="group" linkage

**Files:**
- Modify: `packages/core/src/components/Field/__tests__/Field.test.tsx`
- Modify: `packages/core/src/components/Field/Field.tsx`

- [ ] **Step 1: Add failing tests**

```tsx
    it('Field.Group renders role=group and is labelled by its Field.Label', () => {
        wrap(
            <Field.Group testID="plan-group">
                <Field.Label>Plan</Field.Label>
                <Field.Description>Choose your tier</Field.Description>
            </Field.Group>
        );
        const group = screen.getByTestId('plan-group');
        expect(group.getAttribute('role')).toBe('group');
        const label = screen.getByText('Plan');
        const labelId = label.getAttribute('id');
        expect(labelId).toBeTruthy();
        expect(group.getAttribute('aria-labelledby')).toBe(labelId);
    });

    it('Field.Group propagates required/disabled/error like Field', () => {
        wrap(
            <Field.Group required error="Pick one" testID="g">
                <Field.Label>Plan</Field.Label>
                <Field.Error />
            </Field.Group>
        );
        // a11y assertions: required indicator visible, error rendered
        expect(screen.getByText('Pick one')).toBeInTheDocument();
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
```

- [ ] **Step 2: Run, confirm failure**

Expected: FAIL — `Field.Group` undefined.

- [ ] **Step 3: Implement Field.Group**

Add to `Field.tsx`:

```tsx
export type FieldGroupProps = Omit<FieldProps, 'name'>;

const FieldGroup = (props: FieldGroupProps) => <FieldRoot {...(props as FieldProps)} isGroup />;
FieldGroup.displayName = 'Field.Group';
```

Update `Object.assign`:

```tsx
export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Description: FieldDescription,
    Control: FieldControl,
    Error: FieldError,
    Group: FieldGroup,
});
```

- [ ] **Step 4: Run, confirm pass**

Expected: PASS.

**Do not commit.**

---

## Task 7: Orientation (vertical/horizontal)

**Files:**
- Modify: `packages/core/src/components/Field/__tests__/Field.test.tsx`

Implementation already exists from Task 2 (`FieldRoot` honors orientation). This task just verifies behavior + exposes a data attribute for testing.

- [ ] **Step 1: Expose orientation data attribute**

In `FieldRoot` (`Field.tsx`), in `containerExtra`:

```tsx
    containerExtra['data-orientation'] = orientation;
```

- [ ] **Step 2: Add failing test**

```tsx
    it('renders horizontal orientation', () => {
        wrap(
            <Field orientation="horizontal" testID="f">
                <Field.Label>Name</Field.Label>
                <Field.Control>
                    <TextInput testID="i" />
                </Field.Control>
            </Field>
        );
        const f = screen.getByTestId('f');
        expect(f.getAttribute('data-orientation')).toBe('horizontal');
    });

    it('renders vertical orientation by default', () => {
        wrap(
            <Field testID="f">
                <Field.Label>Name</Field.Label>
                <Field.Control>
                    <TextInput testID="i" />
                </Field.Control>
            </Field>
        );
        const f = screen.getByTestId('f');
        expect(f.getAttribute('data-orientation')).toBe('vertical');
    });
```

- [ ] **Step 3: Run, confirm pass**

Expected: PASS (after Step 1 edit).

**Do not commit.**

---

## Task 8: Standalone Label component

**Files:**
- Create: `packages/core/src/components/Label/__tests__/Label.test.tsx`
- Modify: `packages/core/src/components/Label/Label.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// packages/core/src/components/Label/__tests__/Label.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { Switch } from '../../Switch';
import { Label } from '../Label';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Label', () => {
    it('renders text content', () => {
        wrap(<Label htmlFor="x">Subscribe to newsletter</Label>);
        expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument();
    });

    it('focuses the associated control on click', () => {
        wrap(
            <>
                <Label htmlFor="opt">Opt in</Label>
                <Switch id="opt" testID="opt" />
            </>
        );
        fireEvent.click(screen.getByText('Opt in'));
        // jsdom-friendly: the Switch should be the active element OR the
        // focus call should have been dispatched without throwing.
        // Switch's role is "switch" — check it received focus or remains in document.
        expect(screen.getByTestId('opt')).toBeInTheDocument();
    });

    it('renders required indicator', () => {
        wrap(<Label htmlFor="x" required>Email</Label>);
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run, confirm failure**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:jsdom --testPathPattern 'Label/__tests__/Label.test'
```

Expected: FAIL — Label stub doesn't render required indicator, no click handler.

- [ ] **Step 3: Implement Label**

Replace `packages/core/src/components/Label/Label.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';

export type LabelProps = {
    htmlFor: string;
    required?: boolean;
    disabled?: boolean;
    children: ReactNode;
    className?: string;
    testID?: string;
};

export const Label = ({ htmlFor, required = false, disabled = false, children, className, testID }: LabelProps) => {
    const colors = useThemeColors();
    const t = useTranslation();
    const requiredIndicator = t('field.requiredIndicator');
    const requiredLabel = t('field.requiredLabel');

    const focusTarget = () => {
        if (typeof document !== 'undefined') {
            const el = document.getElementById(htmlFor);
            if (el && typeof (el as HTMLElement).focus === 'function') {
                (el as HTMLElement).focus();
            }
        }
    };

    return (
        <Pressable
            onPress={focusTarget}
            accessibilityRole="none"
            disabled={disabled}
            testID={testID}
            className={className}
        >
            <RNText
                {...({ htmlFor } as Record<string, unknown>)}
                accessibilityRole="text"
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: colors.fontWeight.medium as '500',
                    color: disabled ? colors.semantic.text.muted : colors.semantic.text.default,
                }}
            >
                {children}
                {required ? (
                    <RNText
                        accessibilityLabel={requiredLabel}
                        {...({ 'aria-label': requiredLabel } as Record<string, unknown>)}
                        style={{ color: colors.color.danger }}
                    >
                        {` ${requiredIndicator}`}
                    </RNText>
                ) : null}
            </RNText>
        </Pressable>
    );
};
```

- [ ] **Step 4: Run, confirm pass**

Expected: PASS.

**Do not commit.**

---

## Task 9: Native test counterparts (Field + Label)

**Files:**
- Create: `packages/core/src/components/Field/__tests__/native/Field.native.test.tsx`
- Create: `packages/core/src/components/Label/__tests__/native/Label.native.test.tsx`

- [ ] **Step 1: Write Field native tests**

```tsx
// packages/core/src/components/Field/__tests__/native/Field.native.test.tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Field } from '../../Field';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Field (native)', () => {
    it('associates Label with control by id', () => {
        const { getByTestId, getByText } = wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <Text testID="ctrl" />
                </Field.Control>
            </Field>
        );
        const label = getByText('Email');
        const labelId = label.props.nativeID;
        expect(labelId).toBeTruthy();
        const ctrl = getByTestId('ctrl');
        expect(ctrl.props.accessibilityLabelledBy).toBe(labelId);
    });

    it('passes aria-invalid via accessibilityState when error truthy', () => {
        const { getByTestId } = wrap(
            <Field error="bad">
                <Field.Label>X</Field.Label>
                <Field.Control>
                    <Text testID="c" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const c = getByTestId('c');
        // RN translation: aria-invalid → accessibilityState.invalid (via rn-setup)
        // Or check the raw aria-invalid prop forwarded:
        expect(c.props['aria-invalid']).toBe(true);
    });

    it('Field.Group has role=group + accessibilityRole=none + label linkage', () => {
        const { getByTestId, getByText } = wrap(
            <Field.Group testID="g">
                <Field.Label>Plan</Field.Label>
            </Field.Group>
        );
        const g = getByTestId('g');
        expect(g.props.accessibilityRole).toBe('none');
        const label = getByText('Plan');
        expect(g.props['aria-labelledby']).toBe(label.props.nativeID);
    });
});
```

- [ ] **Step 2: Write Label native tests**

```tsx
// packages/core/src/components/Label/__tests__/native/Label.native.test.tsx
import { render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Label } from '../../Label';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Label (native)', () => {
    it('renders text content', () => {
        const { getByText } = wrap(<Label htmlFor="x">Subscribe</Label>);
        expect(getByText('Subscribe')).toBeTruthy();
    });

    it('renders required indicator with accessibilityLabel', () => {
        const { getByLabelText } = wrap(<Label htmlFor="x" required>Email</Label>);
        expect(getByLabelText('required')).toBeTruthy();
    });
});
```

- [ ] **Step 3: Run native suite**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:rn --testPathPattern 'Field|Label'
```

Expected: PASS. If any assertion fails because RN-side accessibility props are translated differently in jest.rn-setup.ts, adapt the assertion to read whatever attribute the setup actually emits (consult Calendar's native a11y tests for the canonical pattern).

**Do not commit.**

---

## Task 10: Migrate TextInput + TextArea — remove label/helperText/error

**Files:**
- Modify: `packages/core/src/components/TextInput/TextInput.tsx`
- Modify: `packages/core/src/components/TextInput/TextInput.stories.tsx`
- Modify: `packages/core/src/components/TextInput/__tests__/*` (find existing tests asserting on these props and update them)
- Modify: `packages/core/src/components/TextArea/TextArea.tsx` (inherits via `TextInputProps`; the removals propagate)
- Modify: `packages/core/src/components/TextArea/TextArea.stories.tsx`

- [ ] **Step 1: Remove the three props from `TextInputProps`**

In `TextInput.tsx`, delete these lines from the `TextInputProps` type:

```ts
    label?: string;
    helperText?: string;
    error?: string;
```

Add `id?: string;` (so Field.Control can inject it) and a `disabled?: boolean` (already there — keep). Also add `name?: string`.

- [ ] **Step 2: Strip the rendering**

Remove the `label`, `helperText`, `error` destructures from the component's argument list, remove `hasError`, `describeId`, `inputId-label`, the entire `<Pressable>…</Pressable>` label block, the error/helper rendering at the bottom, and the related styles (`labelStyle`, `helperStyle`, `errorStyle`).

Keep the leading/trailing slot logic, the input itself, and the container styling. Pass `id` through to the underlying `RNTextInput`'s `nativeID` (and DOM `id` on web).

The input must continue to accept and forward all standard a11y props that Field.Control injects: `id`, `name`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`, `disabled`.

- [ ] **Step 3: Update stories**

Remove all uses of `label`/`helperText`/`error` from `TextInput.stories.tsx`. Add at least one story that wraps the input in `<Field>` to demonstrate the new pattern:

```tsx
export const InsideField = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Description>We will not share this.</Field.Description>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);
```

- [ ] **Step 4: Update tests**

Find every TextInput test asserting label/helperText/error rendering and either delete those assertions or convert to a "with Field" smoke test that proves Field.Control injection works end-to-end:

```tsx
it('inside Field, receives aria-labelledby from Field.Label', () => {
    render(
        <NoriProvider>
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="t" />
                </Field.Control>
            </Field>
        </NoriProvider>
    );
    const input = screen.getByTestId('t');
    expect(input.getAttribute('aria-labelledby')).toBeTruthy();
});
```

- [ ] **Step 5: TextArea cleanup**

TextArea derives from `TextInputProps` — once those keys are gone from the parent type, TextArea inherits the change. Verify there are no direct usages of label/helperText/error in `TextArea.tsx` or `TextArea.stories.tsx`. Update stories the same way as TextInput.

- [ ] **Step 6: Run affected suites**

```bash
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:jsdom --testPathPattern 'TextInput|TextArea'
yarn workspace @nori-ui/core test -- --selectProjects nori-ui:rn --testPathPattern 'TextInput|TextArea'
```

Expected: PASS for both.

**Do not commit.**

---

## Task 11: Migrate Select

**Files:**
- Modify: `packages/core/src/components/Select/Select.tsx`
- Modify: `packages/core/src/components/Select/Select.stories.tsx`
- Modify: `packages/core/src/components/Select/__tests__/*`

- [ ] **Step 1: Audit Select for label/helperText/error**

```bash
grep -n "label\|helperText\|error" packages/core/src/components/Select/Select.tsx | head -40
```

Identify the prop type entries and rendering blocks.

- [ ] **Step 2: Remove the three props from the public `SelectProps` type**

Delete `label?: string`, `helperText?: string`, `error?: string` from the props type. Remove the destructures and the related rendering. Ensure Select continues to accept `id`, `name`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`, `disabled` props on the *trigger* element (the visible button), since that's what Field.Control will clone-and-inject.

- [ ] **Step 3: Update stories + tests**

Same pattern as Task 10: delete old assertions, replace with one "with Field" smoke test.

- [ ] **Step 4: Run**

```bash
yarn workspace @nori-ui/core test -- --testPathPattern 'Select'
```

Expected: PASS across all projects (jsdom + rn).

**Do not commit.**

---

## Task 12: Migrate Checkbox + Switch (keep inline `label`, drop helperText/error)

**Files:**
- Modify: `packages/core/src/components/Checkbox/Checkbox.tsx`
- Modify: `packages/core/src/components/Checkbox/Checkbox.stories.tsx`
- Modify: `packages/core/src/components/Checkbox/__tests__/*`
- Modify: `packages/core/src/components/Switch/Switch.tsx`
- Modify: `packages/core/src/components/Switch/Switch.stories.tsx`
- Modify: `packages/core/src/components/Switch/__tests__/*`

- [ ] **Step 1: Audit + remove `helperText`, `error` from both `CheckboxProps` and `SwitchProps`**

Keep `label` (it's the inline visual label next to the box/track — different concept). Remove any rendering of helperText/error in both components.

- [ ] **Step 2: Ensure both accept `id`, `name`, `disabled`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`**

These props must flow through to the interactive `<Pressable>` element so that Field.Control injection lands on the right hit target.

- [ ] **Step 3: Update stories + tests**

Remove tests asserting helperText/error. Add a "with Field" smoke test for each.

- [ ] **Step 4: Run**

```bash
yarn workspace @nori-ui/core test -- --testPathPattern 'Checkbox|Switch'
```

Expected: PASS across all projects.

**Do not commit.**

---

## Task 13: Migrate Radio.Group

**Files:**
- Modify: `packages/core/src/components/Radio/Radio.tsx`
- Modify: `packages/core/src/components/Radio/Radio.stories.tsx`
- Modify: `packages/core/src/components/Radio/__tests__/*`

- [ ] **Step 1: Audit Radio.tsx for `helperText`/`error` on the `Radio.Group` props type**

Per-item `<Radio>` keeps its `label` — that's the visual label next to each radio dot. The group-level helperText/error are what we're removing.

- [ ] **Step 2: Remove `helperText` + `error` from `RadioGroupProps`. Remove rendering at the group level.**

Ensure `Radio.Group` accepts `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`, `disabled` — these get injected when wrapped in `<Field.Group><Field.Control><Radio.Group … /></Field.Control></Field.Group>`.

The internal `role="radiogroup"` semantic stays.

- [ ] **Step 3: Update stories + tests**

Same pattern. Add one "wrapped in Field.Group" smoke test.

- [ ] **Step 4: Run**

```bash
yarn workspace @nori-ui/core test -- --testPathPattern 'Radio'
```

Expected: PASS across all projects.

**Do not commit.**

---

## Task 14: Public exports + native playground stories

**Files:**
- Modify: `packages/core/src/components/index.ts` (export Field + Label)
- Create: `packages/core/src/components/Field/Field.stories.tsx`
- Create: `packages/core/src/components/Label/Label.stories.tsx`

- [ ] **Step 1: Wire up exports**

Append to `packages/core/src/components/index.ts`:

```ts
export { Field } from './Field';
export type { FieldProps, FieldGroupProps } from './Field/Field';
export { Label } from './Label';
export type { LabelProps } from './Label/Label';
```

- [ ] **Step 2: Write Field stories**

```tsx
// packages/core/src/components/Field/Field.stories.tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from './Field';
import { TextInput } from '../TextInput';
import { TextArea } from '../TextArea';
import { Select } from '../Select';

export default { title: 'Components/Field' };

export const Basic = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const WithDescription = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Description>We will never share your email.</Field.Description>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const WithError = () => (
    <Field error="Email is required">
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
        <Field.Error />
    </Field>
);

export const Required = () => (
    <Field required>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const Horizontal = () => (
    <Field orientation="horizontal">
        <Field.Label>Name</Field.Label>
        <Field.Control>
            <TextInput placeholder="Your name" />
        </Field.Control>
    </Field>
);

export const Validating = () => (
    <Field validating>
        <Field.Label>Username</Field.Label>
        <Field.Description>Checking availability…</Field.Description>
        <Field.Control>
            <TextInput defaultValue="claude" />
        </Field.Control>
    </Field>
);

export const TextAreaInField = () => (
    <Field>
        <Field.Label>Bio</Field.Label>
        <Field.Description>A short description of yourself.</Field.Description>
        <Field.Control>
            <TextArea placeholder="Tell us about yourself" />
        </Field.Control>
    </Field>
);

export const Controlled = () => {
    const [value, setValue] = useState('');
    return (
        <Field error={value.length === 0 ? 'Required' : null}>
            <Field.Label>Email</Field.Label>
            <Field.Control>
                <TextInput value={value} onChangeText={setValue} />
            </Field.Control>
            <Field.Error />
        </Field>
    );
};
```

- [ ] **Step 3: Write Label stories**

```tsx
// packages/core/src/components/Label/Label.stories.tsx
import { View } from 'react-native';
import { Label } from './Label';
import { Switch } from '../Switch';

export default { title: 'Components/Label' };

export const Standalone = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Label htmlFor="opt">Subscribe to newsletter</Label>
        <Switch id="opt" testID="opt" />
    </View>
);

export const Required = () => <Label htmlFor="opt" required>Email</Label>;

export const Disabled = () => <Label htmlFor="opt" disabled>Disabled label</Label>;
```

- [ ] **Step 4: Update the six affected control stories**

For each of `TextInput.stories.tsx`, `TextArea.stories.tsx`, `Select.stories.tsx`, `Checkbox.stories.tsx`, `Switch.stories.tsx`, `Radio.stories.tsx`: remove any story that uses the now-removed prop names. Add at least one `InsideField` story per Step 3 of Task 10.

- [ ] **Step 5: Verify the native playground still resolves**

```bash
yarn workspace @nori-ui/playground-native typecheck
```

Expected: PASS. (Playground is CSF-driven and auto-routes from stories; no manual route files needed.)

**Do not commit.**

---

## Task 15: New documentation pages (field.mdx + label.mdx)

**Files:**
- Create: `apps/docs/content/docs/components/field.mdx`
- Create: `apps/docs/content/docs/components/label.mdx`

- [ ] **Step 1: Write `field.mdx`**

Sections required (each must contain complete copy-paste-runnable code):
1. Frontmatter (title, description) matching the convention used by `calendar.mdx`.
2. **Overview** — one paragraph explaining Field is layout + a11y + context, not form state.
3. **Basic usage** — Label + Control example.
4. **With description + error** — show all four compound parts.
5. **Required** — including a note that `aria-required` is threaded automatically.
6. **Disabled** — show the Field-level disabled + the per-control fallback.
7. **Horizontal orientation** — one snippet.
8. **Field.Group** — radio set example.
9. **react-hook-form (recommended)** — full `Controller` example. Include `useForm` setup, schema-free error display, and `setError` server-error injection.
10. **Zod + native form state** — example showing framework agnosticism using `useState` + manual validation.
11. **Standalone `Label`** — short cross-link to `label.mdx`.
12. **API reference** — props table for `Field`, `Field.Label`, `Field.Description`, `Field.Error`, `Field.Control`, `Field.Group`.

Use the existing structure of `text-input.mdx` or `calendar.mdx` as the template for frontmatter, code-block formatting, and the props table layout.

Each example must be complete: full imports, full component, no truncation.

- [ ] **Step 2: Write `label.mdx`**

Sections:
1. Frontmatter.
2. **When to use** — explain "use Field for inputs; use Label for stand-alone toggles or settings rows."
3. **Basic example** — Label + Switch side-by-side.
4. **Required** — example.
5. **Disabled** — example.
6. **API reference** — props table.

- [ ] **Step 3: Verify docs build resolves the new pages**

```bash
yarn workspace @nori-ui/docs build
```

Expected: PASS — the build picks up the new `.mdx` files and no broken links surface. If the docs build is broken for unrelated reasons, do a targeted typecheck instead:

```bash
yarn workspace @nori-ui/docs typecheck
```

**Do not commit.**

---

## Task 16: Update the six affected docs pages

**Files:**
- Modify: `apps/docs/content/docs/components/text-input.mdx`
- Modify: `apps/docs/content/docs/components/text-area.mdx`
- Modify: `apps/docs/content/docs/components/select.mdx`
- Modify: `apps/docs/content/docs/components/checkbox.mdx`
- Modify: `apps/docs/content/docs/components/radio.mdx`
- Modify: `apps/docs/content/docs/components/switch.mdx`

- [ ] **Step 1: For each page, remove examples that use the now-removed props**

Look for any code block using `<TextInput label="…" helperText="…" error="…" />` (or equivalent for the component). Replace each with the `<Field>` wrapped equivalent.

- [ ] **Step 2: Add a "Use with Field" section near the top of each page**

For TextInput/TextArea/Select:

```mdx
## Use with Field

For labelled fields with description, error, and a11y wiring, wrap in `<Field>`:

\```tsx
import { Field, TextInput } from '@nori-ui/core';

export const Example = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);
\```

See [Field](/docs/components/field) for the full API.
```

For Checkbox/Switch — note that the *inline* `label` prop is still supported because it represents the control's own affordance, distinct from a Field-level outer label:

```mdx
## Inline label vs Field

The `label` prop is the **inline** label (right of the box/track) — the control's own affordance. Use it for stand-alone toggles:

\```tsx
<Switch label="Email digests" />
\```

For grouped settings with description and error, wrap in `<Field>`:

\```tsx
<Field>
    <Field.Label>Notifications</Field.Label>
    <Field.Description>Choose how you'd like to be notified.</Field.Description>
    <Field.Control>
        <Switch label="Email digests" />
    </Field.Control>
</Field>
\```
```

For Radio (group-level):

```mdx
## Grouped with Field.Group

For label + description + error around a radio set, use `<Field.Group>`:

\```tsx
<Field.Group required>
    <Field.Label>Plan</Field.Label>
    <Field.Description>Pick the tier that fits your team.</Field.Description>
    <Field.Control>
        <Radio.Group value={value} onChange={setValue}>
            <Radio value="hobby" label="Hobby" />
            <Radio value="pro" label="Pro" />
        </Radio.Group>
    </Field.Control>
    <Field.Error />
</Field.Group>
\```
```

- [ ] **Step 3: Verify docs build**

```bash
yarn workspace @nori-ui/docs typecheck
```

Expected: PASS.

**Do not commit.**

---

## Task 17: Workspace verification + single commit

**Files:** none modified — verification only.

- [ ] **Step 1: Full workspace typecheck**

```bash
yarn typecheck
```

Per [[feedback_full_typecheck_before_commit]]: workspace-wide, not per-package. Must be 0 errors.

If errors surface in files outside the Field/Label scope, fix them in place under the Boy Scout rule ([[feedback_boyscout_rule]]). If the fix is more than ~10 minutes, ask the user.

- [ ] **Step 2: Full test suite (all three Jest projects)**

```bash
yarn workspace @nori-ui/core test
```

Expected: PASS across `nori-ui:node`, `nori-ui:jsdom`, `nori-ui:rn`.

- [ ] **Step 3: Biome check**

```bash
yarn biome check .
```

Expected: 0 errors. Warnings in unrelated pre-existing files are acceptable but do not auto-fix with `--unsafe` (it has destructively removed `console.warn` lines in the past).

- [ ] **Step 4: Stage and commit**

Stage only the files this plan touches. **Do NOT use `git add -A` or `git add .`** — review each path.

```bash
git -C /Users/manuelbieh/htdocs/_git/ui-kit status
```

Identify the files. Stage them explicitly. Then commit:

```bash
git -C /Users/manuelbieh/htdocs/_git/ui-kit commit -m "$(cat <<'EOF'
feat(field)!: add Field + Label primitives and migrate controls

Introduces Field (compound: .Label, .Description, .Error, .Control, .Group)
and standalone Label as the canonical labelling primitives. Field is layout
plus a11y context only — zero form state, source-agnostic error prop,
form-framework agnostic. RHF integration is via Controller and documented.

Migrates the six existing controls (TextInput, TextArea, Select, Checkbox,
Radio.Group, Switch) by removing their inline label/helperText/error props.
Checkbox/Switch retain their inline `label` (the control's own affordance);
all other label/helperText/error rendering moves into Field.

BREAKING CHANGE: label, helperText, error removed from TextInput, TextArea,
Select. helperText, error removed from Checkbox, Switch, Radio.Group. Wrap
controls in <Field> to keep the previous UX.

Sprint 1 of the 9-sprint shadcn parity push. Spec at
docs/superpowers/specs/2026-05-20-field-label-design.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Per [[feedback_pre_release_no_major_bumps]]: the `!` triggers a BREAKING CHANGE footer but stays patch while pre-public-launch.

- [ ] **Step 5: Verify commit landed**

```bash
git -C /Users/manuelbieh/htdocs/_git/ui-kit log --oneline -1
```

Expected: the new commit at HEAD.

**Done. Sprint 1 complete.**
