# Field + Label — Sprint 1 design

**Status:** Approved 2026-05-20
**Scope:** Two new components (`Field`, `Label`) and a breaking migration that removes the existing `label` / `helperText` / `error` props from form controls. First of nine sprints filling the shadcn parity gap.

## Goals

1. **react-hook-form compatible** via `<Controller>` — the only cross-platform RHF path.
2. **Form-framework agnostic** at the library level. RHF is recommended in docs; not a peer dependency.
3. **Fully customizable.** Compound API; consumers compose what they need.
4. **Controlled and uncontrolled inputs** continue to work — that's a control-level concern, Field doesn't touch it.

## Non-goals

- Validation logic. Field renders `error: string | null`; the source is irrelevant (RHF, Zod, server, hand-rolled).
- Built-in form state. Field is layout + a11y, not a form library.
- Built-in `placeholder`. That's a control concern (TextInput, Select, DatePicker each have their own).
- `useFieldContext()` hook. Considered and rejected — Slot-based prop injection is cleaner.

## Architecture

```
packages/core/src/components/Field/
  Field.tsx              # root + compound: .Label .Description .Error .Control .Group
  index.ts
  Field.stories.tsx
  __tests__/Field.test.tsx
  __tests__/native/Field.native.test.tsx

packages/core/src/components/Label/
  Label.tsx              # standalone (no envelope)
  index.ts
  Label.stories.tsx
  __tests__/Label.test.tsx
  __tests__/native/Label.native.test.tsx
```

Reuses the existing `Slot` helper at `packages/core/src/slot/` (already used by Checkbox `asChild`).

## API surface

### Field

```ts
type FieldProps = {
  /** Forwarded to the control via Field.Control. Lets RHF Controller pass field.name through. */
  name?: string;

  /** Renders the visual required indicator (`*`) and threads aria-required onto the control. */
  required?: boolean;

  /** Disables the field visually (dimmed label) and threads disabled onto the control. */
  disabled?: boolean;

  /**
   * Truthy = invalid. Source-agnostic: RHF, Zod, server, manual.
   * Drives aria-invalid, aria-describedby, and the rendered Field.Error.
   */
  error?: string | null;

  /** Async validation state; distinct from `error`. */
  validating?: boolean;

  /** Layout direction. Default 'vertical'. */
  orientation?: 'vertical' | 'horizontal';

  /** Override the auto-generated control id. */
  id?: string;

  children: ReactNode;
};
```

Compound parts:

| Part | Purpose |
|---|---|
| `Field.Label` | Visible label. On web renders `<Text>` with `nativeID` + `aria-labelledby` linkage. |
| `Field.Description` | Muted helper text. Threaded into `aria-describedby` when present. |
| `Field.Error` | Self-closing renders Field's `error` prop; `<Field.Error>x</Field.Error>` overrides. Threaded into `aria-describedby`. |
| `Field.Control` | Slot wrapper. Clones its single child and injects `id`, `name`, `aria-describedby`, `aria-invalid`, `aria-required`, `disabled`. Child can be any input component. **Throws (dev mode)** if it has zero or more than one child element. |
| `Field.Group` | Fieldset/legend semantics for radio sets, multi-checkbox, multi-switch. Same props as Field minus `name`. |

### Label (standalone)

```ts
type LabelProps = {
  /** id of the associated control. */
  htmlFor: string;
  /** Marks the associated control as required (visual `*` + announcement). */
  required?: boolean;
  /** Dims visually. Purely a visual hint; doesn't disable the control. */
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  testID?: string;
};
```

For use cases where Field is overkill — e.g., a single `<Switch>` in a settings row.

## Field.Control mechanics

`Field.Control` accepts exactly one child. It uses the existing `Slot` to clone that child and merge the following props (control's explicit prop wins where it makes sense; aria props always merged):

```ts
{
  id: ctx.fieldId,
  name: child.props.name ?? ctx.name,
  'aria-describedby': ctx.describedBy,           // computed: description+error ids
  'aria-invalid': ctx.hasError ? true : undefined,
  'aria-required': ctx.required ? true : undefined,
  disabled: Boolean(child.props.disabled || ctx.disabled),
  // RN equivalents threaded via existing rn-setup translation
}
```

`describedBy` rule: join `descriptionId` and `errorId` with a space, but only include each id when that compound part is present in the tree (description only when `<Field.Description>` is rendered, error only when ctx.hasError).

## Breaking changes (single migration commit, sprint #1)

Six controls lose props. Rationale: the spec replaces "all-in-one" controls with composition. Inline labels stay on Checkbox/Radio/Switch because they're the control's own affordance, distinct from a Field-level label.

| Control | Props removed | Props kept |
|---|---|---|
| `TextInput` | `label`, `helperText`, `error` | (rest unchanged) |
| `TextArea` | `label`, `helperText`, `error` (inherits from TextInput) | (rest unchanged) |
| `Select` | `label`, `helperText`, `error` | (rest unchanged) |
| `Checkbox` | `helperText`, `error` | `label` (inline) |
| `Radio.Group` | `helperText`, `error` on the group container | per-item `label` on `<Radio>` |
| `Switch` | `helperText`, `error` | `label` (inline) |

This is allowed under [[feedback_pre_release_no_major_bumps]] (patch version; manual major only when user asks). The bump remains patch; no consumers exist yet that this would break.

## Accessibility

Web:
- `Field.Label` → `<Text nativeID={labelId}>`; control gets `aria-labelledby={labelId}`.
  (Real `<label htmlFor>` is avoided to preserve native compat — same reason TextInput uses Pressable for click-to-focus today.)
- `aria-describedby` joins description + error ids when each is rendered.
- `aria-invalid={true}` when error truthy.
- `aria-required={true}` when required.
- `Field.Group` → `role="group"` + `aria-labelledby={legendId}`.

Native:
- Same identifiers via `nativeID`; control gets `accessibilityLabelledBy={labelId}`.
- `accessibilityState={{ disabled, required, invalid }}` mirrored from aria flags.
- `Field.Group` → `accessibilityRole="none"` + `accessibilityLabel` from the legend text.
- All translations leverage the existing `jest.rn-setup.ts` aria-to-RN bridge.

## Required indicator

- Visual: configurable `*` after the label text. Default red.
- Localizable via the existing dictionary system:
  - `field.requiredIndicator` (default `"*"`) — visual mark
  - `field.requiredLabel` (default `"required"`) — SR announcement
- a11y: SR users hear "required" via `aria-required` + the visual indicator's `aria-label`.

## Validating state

- `<Field validating>` renders a small `Spinner` in the field's trailing region (next to the description, or stacked below for horizontal orientation).
- Distinct from `error` — both can be truthy simultaneously (RHF re-validates while showing prior error).

## Orientation

- `vertical` (default): VStack — Label, Control, Description, Error.
- `horizontal`: HStack — Label (left, width from `colors.spacing` token, configurable via className), Control (right, flex 1). Description and Error stack below the control to preserve readability at narrow widths.

## Field.Group

- Replaces the implicit "container with a legend" pattern consumers currently hand-roll.
- Web: `role="group"` + `aria-labelledby={legendId}` on a `<View>`. No `<fieldset>` (RN host-component crash risk; same constraint as current TextInput).
- Native: `<View accessibilityRole="none" accessibilityLabel={legend}>`.
- Props identical to Field minus `name`. Group-level `error`/`required`/`disabled`/`validating` shape the group's a11y + visual envelope (legend styling, group-scoped error message, dim state). They do **not** propagate to individual items inside — per-item state stays per-item.
- Children are typically `<Radio>` items inside a `<Radio.Group>` or multiple `<Checkbox>` components.

## Recommended documentation patterns

Every docs page that touches Field must show:
1. **Basic example** — Label + Control + Error.
2. **RHF Controller example** — full working snippet with `useForm` setup, `Controller`, `Field`.
3. **Zod/manual example** — to demonstrate framework agnosticism.
4. **Group example** — `Field.Group` wrapping a `Radio.Group`.

All examples must be **complete and copy-paste-runnable** ([[feedback_complete_doc_examples]]). No truncated imports.

## Test plan (TDD)

### Web (jsdom) — `Field.test.tsx`

1. Field renders a label that is associated to the control by id (label `nativeID` matches `aria-labelledby` on input).
2. `aria-describedby` includes description id when `<Field.Description>` present.
3. `aria-describedby` includes error id when `error` truthy.
4. `aria-describedby` includes both ids when both present, space-joined in stable order.
5. `aria-invalid` is `true` exactly when error truthy.
6. `aria-required` is `true` exactly when required.
7. `disabled` from Field flows onto the control AND ORs with control's own `disabled`.
8. `<Field.Error />` self-closing renders ctx.error.
9. `<Field.Error>custom</Field.Error>` overrides ctx.error.
10. `Field.Group` renders `role="group"` and is labelled by its `Field.Label`.
11. Horizontal orientation places label visually left of control (snapshot-free; assert flexDirection on container).
12. `Field.Control` injects `id`, `name`, aria-* into its single child (verify via testID on the cloned element's resulting DOM).
13. RHF shape smoke test — pass `field` from a fake Controller render-prop, assert correct prop merge (no actual RHF dependency).

### Web — `Label.test.tsx`

1. Renders text content.
2. `htmlFor` linkage works — clicking the label focuses the associated control (jsdom click-to-focus via the same Pressable pattern as TextInput).
3. `required` shows the indicator with the right `aria-label`.
4. `disabled` dims visually but does not disable the control (it's a hint only).

### Native (jest-expo) — `Field.native.test.tsx`

1. Label has `nativeID`; control has matching `accessibilityLabelledBy`.
2. `accessibilityState.invalid` flips with `error`.
3. `accessibilityState.disabled` flows from Field.
4. `accessibilityState.required` set when required.
5. `Field.Group` has `accessibilityRole="none"` and `accessibilityLabel` from legend.

### Native — `Label.native.test.tsx`

1. Standalone Label renders Text with the expected `nativeID`.
2. `accessibilityRole="text"` and `accessibilityLabel` correct.

### Migration tests

For each of the six affected controls, update tests:
- Remove any `label="…"` / `helperText="…"` / `error="…"` assertions on TextInput, TextArea, Select.
- For Checkbox, Radio, Switch: keep inline label tests; remove `helperText`/`error` assertions.
- Add at least one "wrapped in Field" smoke test per control to prove the Slot injection works.

## Acceptance criteria

1. `yarn workspace @nori-ui/core test` — all three projects (node, jsdom, rn) green.
2. `yarn typecheck` workspace-wide — clean.
3. `yarn biome check .` — no new errors.
4. `apps/docs/content/docs/components/field.mdx` exists with: basic, RHF Controller, Zod, Group examples. All runnable.
5. `apps/docs/content/docs/components/label.mdx` exists with standalone examples.
6. The six affected component docs (`text-input.mdx`, `text-area.mdx`, `select.mdx`, `checkbox.mdx`, `radio.mdx`, `switch.mdx`) updated:
   - Removed examples using the now-removed props.
   - Added at least one "with Field" example.
7. Playground-native: `Field.stories.tsx` covers Basic, WithDescription, WithError, Required, Horizontal, FieldGroupRadio, StandaloneLabel, ValidatingState. Updates to the six affected control stories where they used the removed props.
8. Single commit titled `feat(field)!: add Field + Label primitives and migrate controls`. The `!` triggers a BREAKING CHANGE footer but stays patch per [[feedback_pre_release_no_major_bumps]].

## Out of scope (deferred)

- Async validation orchestration (just render `validating`; no AbortController glue, no debouncing).
- A11y manual sweeps ([[feedback_a11y_verification_effort]] — automation only).
- Per-component bundle-size assertions ([[feedback_no_size_budgets]]).
- Playground-web ([[feedback_skip_playground_web]]).
- Form-level concerns (`<Form>`, submit handling, multi-field validation) — not in shadcn parity scope either.
