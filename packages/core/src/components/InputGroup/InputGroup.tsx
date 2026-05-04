'use client';

import {
    Children,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { TextInput as RNTextInputType, TextStyle, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import type { TextInputProps } from '../TextInput/TextInput';

// ─── Internal context ─────────────────────────────────────────────────────
//
// Lets the addons + input share focus, error, and disabled state so the
// WHOLE group's border lights up on focus and dimming cascades visually
// without consumers having to duplicate props on every child.
type InputGroupContextValue = {
    inputId: string;
    describeId: string;
    setFocused: (next: boolean) => void;
    hasError: boolean;
    disabled: boolean;
    inputRef: React.MutableRefObject<RNTextInputType | null>;
    focusInput: () => void;
};

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

const useInputGroupContext = (label: string): InputGroupContextValue => {
    const ctx = useContext(InputGroupContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside an <InputGroup>.`);
    }
    return ctx;
};

// Marker symbols on the child component functions so we can split children
// into [prefix, input, suffix] without forcing consumers to pass `position`
// props or use named slots. Whatever sits before the InputGroupInput is a
// prefix; whatever sits after is a suffix.
const ADDON_TYPE = Symbol.for('nori-ui.InputGroupAddon');
const INPUT_TYPE = Symbol.for('nori-ui.InputGroupInput');

const isAddon = (child: unknown): child is ReactElement =>
    isValidElement(child) && (child.type as { __noriType?: symbol })?.__noriType === ADDON_TYPE;

const isInput = (child: unknown): child is ReactElement<InputGroupInputProps> =>
    isValidElement(child) && (child.type as { __noriType?: symbol })?.__noriType === INPUT_TYPE;

// ─── Container ────────────────────────────────────────────────────────────

// Layout-only bases; theme-driven dimensions are merged inside the
// component below.
const CONTAINER_LAYOUT_BASE: ViewStyle = { flexDirection: 'column' };
const FIELD_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    overflow: 'hidden',
};

export type InputGroupProps = {
    children: ReactNode;
    /** Mark the entire group as disabled — cascades visually to addons + input. */
    disabled?: boolean;
    /** Mark the entire group as errored — cascades visually to addons + input. */
    error?: boolean;
    className?: string;
    containerClassName?: string;
    testID?: string;
};

/**
 * Wrapper that visually fuses prefix and/or suffix addons with a TextInput
 * into a SINGLE rounded field — one border around the whole compound, not
 * three separate boxes. Inspired by Chakra's InputGroup and shadcn's input
 * addon pattern.
 *
 * @example
 * <InputGroup>
 *   <InputGroupAddon>@</InputGroupAddon>
 *   <InputGroupInput placeholder="username" />
 * </InputGroup>
 *
 * @example with both prefix and suffix
 * <InputGroup>
 *   <InputGroupAddon>https://</InputGroupAddon>
 *   <InputGroupInput defaultValue="example" />
 *   <InputGroupAddon>.com</InputGroupAddon>
 * </InputGroup>
 */
function InputGroupRoot({
    children,
    disabled = false,
    error: groupErrorProp = false,
    className,
    containerClassName,
    testID,
}: InputGroupProps) {
    const colors = useThemeColors();
    const reactId = useId();
    const inputId = `nori-ui-input-${reactId}`;
    const describeId = `${inputId}-describe`;
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<RNTextInputType | null>(null);

    // Stable identity (does not depend on render-cycle state) so the
    // useMemo below can leave it out of the dep array without lint noise.
    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    // Walk children once, split into [prefix, input, suffix]. Anything that
    // isn't a recognised marker gets dropped — the API guarantees a single
    // integrated bar, not arbitrary slots.
    const childArray = Children.toArray(children);
    const inputIndex = childArray.findIndex(isInput);
    const inputElement = inputIndex >= 0 ? (childArray[inputIndex] as ReactElement<InputGroupInputProps>) : null;
    const prefixNodes = inputIndex >= 0 ? childArray.slice(0, inputIndex).filter(isAddon) : [];
    const suffixNodes = inputIndex >= 0 ? childArray.slice(inputIndex + 1).filter(isAddon) : [];

    // Lift label / helperText / error from the input element so the parent
    // can render them OUTSIDE the bordered field row (a normal field layout
    // wraps the box with label above and helper/error below).
    const inputProps = inputElement?.props ?? ({} as InputGroupInputProps);
    const label = inputProps.label;
    const helperText = inputProps.helperText;
    const inputError = inputProps.error;

    const hasError = Boolean(groupErrorProp) || Boolean(inputError);

    const ctx = useMemo<InputGroupContextValue>(
        () => ({
            inputId,
            describeId,
            setFocused,
            hasError,
            disabled,
            inputRef,
            focusInput,
        }),
        [inputId, describeId, hasError, disabled, focusInput]
    );

    const borderColor = hasError
        ? colors.color.danger
        : focused
          ? colors.semantic.interactive.primary
          : colors.semantic.border.default;

    const fieldStyle = [
        FIELD_LAYOUT_BASE,
        {
            borderRadius: px(colors.radius.md),
            backgroundColor: colors.semantic.background.elevated,
            borderColor,
        },
        disabled ? { opacity: 0.6 } : null,
    ];

    const labelStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        fontWeight: colors.fontWeight.medium as '500',
        color: colors.semantic.text.default,
    };
    const helperStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        color: colors.semantic.text.muted,
    };
    const errorStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        color: colors.color.danger,
    };
    const containerStyle: ViewStyle = { ...CONTAINER_LAYOUT_BASE, gap: px(colors.spacing['1']) };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('flex flex-col gap-1', containerClassName)}
            style={containerStyle}
        >
            {label !== undefined ? (
                // On web we render a real <label htmlFor> so clicking the
                // label focuses the input the standard a11y way (and so
                // jsdom-based tests can assert the label↔input
                // association via the `for` attribute).
                //
                // On native, raw <label> is not a valid host component
                // and RN crashes with "View config getter callback for
                // component `label` must be a function". The native
                // path renders an RNText instead — the underlying
                // RNTextInput still carries accessibilityLabel for
                // screen readers, so the visible text + the a11y name
                // remain in sync. Same web-only `<label>` story as
                // TextInput's earlier iteration; this branch is the
                // explicit native-safe fallback.
                Platform.OS === 'web' ? (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-semantic-text-default"
                        style={labelStyle as object}
                    >
                        {label}
                    </label>
                ) : (
                    <RNText
                        nativeID={`${inputId}-label`}
                        accessibilityRole="text"
                        className="text-sm font-medium text-semantic-text-default"
                        style={labelStyle}
                    >
                        {label}
                    </RNText>
                )
            ) : null}
            <InputGroupContext.Provider value={ctx}>
                <View
                    className={cn(
                        'flex-row items-stretch overflow-hidden rounded-md border focus-within:border-semantic-interactive-primary',
                        hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                        disabled ? 'opacity-60' : undefined,
                        className
                    )}
                    style={fieldStyle}
                >
                    {prefixNodes.map((node, i) => {
                        const key = (node as ReactElement & { key?: string | null }).key ?? `prefix-${i}`;
                        return (
                            <AddonSlot key={key} side="left">
                                {node}
                            </AddonSlot>
                        );
                    })}
                    {inputElement}
                    {suffixNodes.map((node, i) => {
                        const key = (node as ReactElement & { key?: string | null }).key ?? `suffix-${i}`;
                        return (
                            <AddonSlot key={key} side="right">
                                {node}
                            </AddonSlot>
                        );
                    })}
                </View>
            </InputGroupContext.Provider>
            {inputError ? (
                <RNText
                    nativeID={describeId}
                    className="text-sm text-semantic-interactive-destructive"
                    style={errorStyle}
                >
                    {inputError}
                </RNText>
            ) : helperText ? (
                <RNText nativeID={describeId} className="text-sm text-semantic-text-muted" style={helperStyle}>
                    {helperText}
                </RNText>
            ) : null}
        </View>
    );
}

// ─── Addon slot ───────────────────────────────────────────────────────────
//
// Internal wrapper that paints the muted background, draws the 1px vertical
// separator on the input-facing side, and forwards a click to the input so
// the addon reads as decorator, not as something interactive.
function AddonSlot({ children, side }: { children: ReactNode; side: 'left' | 'right' }) {
    const colors = useThemeColors();
    const ctx = useContext(InputGroupContext);
    const dim = ctx?.disabled ? 0.85 : 1;

    const baseStyle: ViewStyle = {
        backgroundColor: colors.semantic.background.subtle,
        paddingHorizontal: px(colors.spacing['3']),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dim,
    };

    const separatorStyle: ViewStyle =
        side === 'left'
            ? { borderRightWidth: 1, borderRightColor: colors.semantic.border.default }
            : { borderLeftWidth: 1, borderLeftColor: colors.semantic.border.default };

    const handlePress = () => {
        ctx?.focusInput();
    };

    return (
        <Pressable
            // Pressing the addon focuses the input — addons are decorators,
            // never tab stops. RN's `accessibilityRole` doesn't accept "presentation"
            // (web-only), so we set the WAI-ARIA role via the web prop instead.
            onPress={handlePress}
            role="none"
            // RN web maps `focusable={false}` to `tabIndex={-1}`.
            focusable={false}
            style={[baseStyle, separatorStyle]}
            className={cn(
                'flex-row items-center justify-center px-3 bg-semantic-background-subtle',
                side === 'right' ? 'border-l border-semantic-border-default' : 'border-r border-semantic-border-default'
            )}
        >
            {children}
        </Pressable>
    );
}

// ─── Addon (public) ───────────────────────────────────────────────────────

export type InputGroupAddonProps = {
    children: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Decorator slot inside an `<InputGroup>`. Renders a muted, non-interactive
 * box that visually fuses with the input. Place before `<InputGroupInput>`
 * for a prefix, after for a suffix. Accepts strings or `ReactNode` (icons).
 */
function InputGroupAddon({ children, className, testID }: InputGroupAddonProps) {
    const colors = useThemeColors();
    const textStyle: TextStyle = {
        color: colors.semantic.text.muted,
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
    };

    // Wrap raw strings/numbers so consumers can pass `"@"` or `<MailIcon />`
    // and both render correctly without callers tripping over RN's "text
    // outside of <Text>" warning.
    if (typeof children === 'string' || typeof children === 'number') {
        return (
            <RNText
                {...(testID !== undefined ? { testID } : {})}
                className={cn('text-sm text-semantic-text-muted', className)}
                style={textStyle}
            >
                {children}
            </RNText>
        );
    }

    return (
        <View {...(testID !== undefined ? { testID } : {})} {...(className !== undefined ? { className } : {})}>
            {children}
        </View>
    );
}

// Brand the function so the parent can locate it via Children.toArray walk.
(InputGroupAddon as unknown as { __noriType: symbol }).__noriType = ADDON_TYPE;

// ─── Input (public) ───────────────────────────────────────────────────────

// Layout-only base; theme-driven dimensions are merged inside InputGroupInput.
const INPUT_LAYOUT_BASE: TextStyle = {
    flex: 1,
    // RN web honours `outlineStyle: 'none'` to suppress the default browser
    // focus ring — the group's own focus-within border replaces it.
    outlineStyle: 'none' as unknown as TextStyle['outlineStyle'],
};

export type InputGroupInputProps = TextInputProps;

/**
 * The text field inside an `<InputGroup>`. Extends the full `TextInput` API
 * (label, helperText, error, disabled, etc.) so consumers don't lose any
 * functionality when reaching for the integrated layout.
 *
 * Implementation note: this renders a bare RN `TextInput` because the
 * surrounding `<InputGroup>` already paints the border + label + helper —
 * those bits are lifted to the parent so they render OUTSIDE the bordered
 * field row, the way a normal field's label/helper sits above/below the box.
 */
function InputGroupInput({
    label: _label,
    helperText: _helperText,
    error,
    disabled,
    onChangeText,
    onFocus,
    onBlur,
    multiline,
    numberOfLines,
    leading: _leading,
    trailing: _trailing,
    containerClassName: _containerClassName,
    className,
    testID,
    ...rest
}: InputGroupInputProps) {
    const colors = useThemeColors();
    const ctx = useInputGroupContext('InputGroupInput');
    const inputId = ctx.inputId;
    const describeId = ctx.describeId;
    const isDisabled = disabled || ctx.disabled;
    const hasError = Boolean(error) || ctx.hasError;

    const inputExtras: Record<string, unknown> = {};
    if (testID !== undefined) {
        inputExtras.testID = testID;
    }
    if (_label !== undefined) {
        inputExtras.accessibilityLabel = _label;
    }
    if (hasError) {
        inputExtras['aria-invalid'] = true;
    }
    if (error || _helperText) {
        inputExtras['aria-describedby'] = describeId;
    }
    if (multiline !== undefined) {
        inputExtras.multiline = multiline;
    }
    if (numberOfLines !== undefined) {
        inputExtras.numberOfLines = numberOfLines;
    }
    if (onChangeText !== undefined) {
        inputExtras.onChangeText = onChangeText;
    }

    const inputStyle: TextStyle = {
        ...INPUT_LAYOUT_BASE,
        paddingVertical: px(colors.spacing['2']),
        paddingHorizontal: px(colors.spacing['3']),
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.md),
        color: colors.semantic.text.default,
    };

    return (
        <RNTextInput
            ref={(node) => {
                ctx.inputRef.current = node;
            }}
            nativeID={inputId}
            editable={!isDisabled}
            className={cn('flex-1 py-2 px-3 text-md text-semantic-text-default outline-none bg-transparent', className)}
            placeholderTextColor={colors.semantic.text.muted}
            onFocus={(e) => {
                ctx.setFocused(true);
                onFocus?.(e);
            }}
            onBlur={(e) => {
                ctx.setFocused(false);
                onBlur?.(e);
            }}
            {...inputExtras}
            {...rest}
            style={[inputStyle, rest.style]}
        />
    );
}

(InputGroupInput as unknown as { __noriType: symbol }).__noriType = INPUT_TYPE;

/**
 * Public `InputGroup` value — the root function plus its `.Addon` and `.Input`
 * static members. `Object.assign` produces a value whose inferred type carries
 * the static properties, so `.d.ts` consumers can write `<InputGroup.Addon>`
 * without a separate import.
 */
export const InputGroup = Object.assign(InputGroupRoot, {
    Addon: InputGroupAddon,
    Input: InputGroupInput,
});
