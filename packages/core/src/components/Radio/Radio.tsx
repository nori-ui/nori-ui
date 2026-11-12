'use client';

import {
    createContext,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

type RadioRefMap = Map<string, RefObject<HTMLElement | null>>;

type RadioGroupContextValue = {
    value: string | undefined;
    select: (next: string) => void;
    disabled: boolean;
    orientation: RadioGroupOrientation;
    name: string | undefined;
    /** The option that is the tab stop while nothing is selected: the first enabled one. */
    firstEnabledValue: string | undefined;
    register: (value: string, ref: RefObject<HTMLElement | null>) => void;
    unregister: (value: string) => void;
    setOptionDisabled: (value: string, disabled: boolean) => void;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const useRadioGroupContext = (): RadioGroupContextValue => {
    const ctx = useContext(RadioGroupContext);
    if (!ctx) {
        throw new Error('<Radio> must be rendered inside a <Radio.Group>.');
    }
    return ctx;
};

export type RadioGroupProps = {
    /** Controlled selected value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    /** Fires with the new value when the selection changes. */
    onChange?: (next: string) => void;
    /** When true, every Radio inside is non-interactive. Individual Radios can also opt in. */
    disabled?: boolean;
    /**
     * Layout orientation. Drives the keyboard nav axis (Down/Up for vertical,
     * Right/Left for horizontal — both pairs work in either orientation as a
     * usability bonus).
     * @defaultValue 'vertical'
     */
    orientation?: RadioGroupOrientation;
    /**
     * Form field name (web only). The selected value is submitted under this
     * name with an enclosing HTML `<form>`.
     */
    name?: string;
    /**
     * Accessible name for the group. `Field.Control` sets this on iOS, where
     * `aria-labelledby` has no effect.
     */
    accessibilityLabel?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
    // ── Accessibility / Field.Control injection ──────────────────────────────
    /** HTML id forwarded to the radiogroup container. Injected by Field.Control. */
    id?: string;
    /** React Native equivalent of `id`. Injected by Field.Control. */
    nativeID?: string;
    /** Points to the element that labels this group. Injected by Field.Control. */
    'aria-labelledby'?: string;
    /** React Native equivalent of `aria-labelledby`. Injected by Field.Control. */
    accessibilityLabelledBy?: string;
    /** Points to description / error elements. Injected by Field.Control. */
    'aria-describedby'?: string;
    /** React Native equivalent of `aria-describedby`. Injected by Field.Control. */
    accessibilityDescribedBy?: string;
    /** Marks the group as invalid. Injected by Field.Control when Field has an error. */
    'aria-invalid'?: boolean;
    /** Marks the group as required. Injected by Field.Control when Field is required. */
    'aria-required'?: boolean;
};

export type RadioProps = {
    /** Unique value within the group. Required. */
    value: string;
    /** Visible label that doubles as the accessibility label. */
    label?: string;
    /** Disable just this option. */
    disabled?: boolean;
    /** Custom content rendered next to the radio dot. Overrides `label`. */
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// Layout-only base; theme-driven gap is merged inside Radio. The dot
// dimensions are component-density literals — not from theme — because the
// radio dot has a fixed visual ramp independent of the spacing scale.
const ROW_LAYOUT_BASE: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
const DOT_OUTER_BASE: ViewStyle = {
    width: 18, // component-density literal — not from theme
    height: 18, // component-density literal — not from theme
    borderRadius: 9, // perfect circle of dot diameter — not from theme
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
};
const DOT_INNER_BASE: ViewStyle = {
    width: 8, // component-density literal — not from theme
    height: 8, // component-density literal — not from theme
    borderRadius: 4, // perfect circle — not from theme
};

/**
 * Single-selection group of radio buttons. Container owns the value;
 * children declare their `value` and any extra disabled state.
 *
 * Keyboard nav follows the WAI-ARIA radiogroup pattern:
 *   - Tab into the group → focus lands on the selected option (or the
 *     first when nothing is selected). Tab out leaves the group.
 *   - ArrowDown / ArrowRight → next option (wraps).
 *   - ArrowUp / ArrowLeft → previous option (wraps).
 *   - Home / End → first / last.
 *   - Selection follows focus, so an arrow key both moves focus and
 *     activates the option (the standard radiogroup behavior).
 */
export const RadioGroup = ({
    value,
    defaultValue,
    onChange,
    disabled = false,
    orientation = 'vertical',
    name,
    children,
    className,
    testID,
    id,
    nativeID,
    accessibilityLabel,
    'aria-labelledby': ariaLabelledBy,
    accessibilityLabelledBy,
    'aria-describedby': ariaDescribedBy,
    accessibilityDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
}: RadioGroupProps) => {
    const [inner, setInner] = useState<string | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

    const refs = useRef<RadioRefMap>(new Map());
    const orderRef = useRef<string[]>([]);
    const disabledValuesRef = useRef<Set<string>>(new Set());
    const [firstEnabledValue, setFirstEnabledValue] = useState<string | undefined>(undefined);

    const syncFirstEnabled = useCallback(() => {
        setFirstEnabledValue(orderRef.current.find((v) => !disabledValuesRef.current.has(v)));
    }, []);

    const register = useCallback(
        (v: string, ref: RefObject<HTMLElement | null>) => {
            refs.current.set(v, ref);
            if (!orderRef.current.includes(v)) {
                orderRef.current.push(v);
            }
            syncFirstEnabled();
        },
        [syncFirstEnabled]
    );

    const unregister = useCallback(
        (v: string) => {
            refs.current.delete(v);
            disabledValuesRef.current.delete(v);
            orderRef.current = orderRef.current.filter((x) => x !== v);
            syncFirstEnabled();
        },
        [syncFirstEnabled]
    );

    const setOptionDisabled = useCallback(
        (v: string, isOptionDisabled: boolean) => {
            if (isOptionDisabled) {
                disabledValuesRef.current.add(v);
            } else {
                disabledValuesRef.current.delete(v);
            }
            syncFirstEnabled();
        },
        [syncFirstEnabled]
    );

    const select = useCallback(
        (next: string) => {
            if (disabled) {
                return;
            }
            if (!isControlled) {
                setInner(next);
            }
            onChange?.(next);
        },
        [disabled, isControlled, onChange]
    );

    const focusValue = useCallback((next: string) => {
        const ref = refs.current.get(next);
        ref?.current?.focus?.();
    }, []);

    // Walks from `startIndex` in `direction` (wrapping) to the nearest
    // enabled option, then selects and focuses it. Disabled options are
    // never reachable from the keyboard.
    const selectEnabledFrom = useCallback(
        (startIndex: number, direction: 1 | -1) => {
            const order = orderRef.current;
            const len = order.length;
            for (let step = 0; step < len; step += 1) {
                const candidate = order[(((startIndex + step * direction) % len) + len) % len];
                if (candidate !== undefined && !disabledValuesRef.current.has(candidate)) {
                    select(candidate);
                    focusValue(candidate);
                    return;
                }
            }
        },
        [focusValue, select]
    );

    const moveBy = useCallback(
        (offset: 1 | -1) => {
            const order = orderRef.current;
            if (order.length === 0) {
                return;
            }
            const idx = current ? order.indexOf(current) : -1;
            const start = idx === -1 ? (offset === 1 ? -1 : 0) : idx;
            selectEnabledFrom(start + offset, offset);
        },
        [current, selectEnabledFrom]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const order = orderRef.current;
            if (order.length === 0) {
                return;
            }
            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight': {
                    event.preventDefault();
                    moveBy(1);
                    return;
                }
                case 'ArrowUp':
                case 'ArrowLeft': {
                    event.preventDefault();
                    moveBy(-1);
                    return;
                }
                case 'Home': {
                    event.preventDefault();
                    selectEnabledFrom(0, 1);
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    selectEnabledFrom(order.length - 1, -1);
                    return;
                }
            }
        },
        [moveBy, selectEnabledFrom]
    );

    const ctxValue = useMemo<RadioGroupContextValue>(
        () => ({
            value: current,
            select,
            disabled,
            orientation,
            name,
            firstEnabledValue,
            register,
            unregister,
            setOptionDisabled,
        }),
        [current, select, disabled, orientation, name, firstEnabledValue, register, unregister, setOptionDisabled]
    );

    // RN's View doesn't model onKeyDown in its TS surface but RN-Web passes
    // it through to the underlying div. Cast at the spread boundary.
    const groupProps: Record<string, unknown> = {
        role: 'radiogroup',
        accessibilityRole: 'radiogroup',
        'aria-orientation': orientation,
        'aria-disabled': disabled || undefined,
        onKeyDown: handleKeyDown,
        ...(testID !== undefined ? { testID } : {}),
        ...(id !== undefined ? { id } : {}),
        ...(nativeID !== undefined ? { nativeID } : {}),
        ...(accessibilityLabel !== undefined ? { accessibilityLabel } : {}),
        ...(ariaLabelledBy !== undefined ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(accessibilityLabelledBy !== undefined ? { accessibilityLabelledBy } : {}),
        ...(ariaDescribedBy !== undefined ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(accessibilityDescribedBy !== undefined ? { accessibilityDescribedBy } : {}),
        ...(ariaInvalid ? { 'aria-invalid': true } : {}),
        ...(ariaRequired ? { 'aria-required': true } : {}),
    };

    return (
        <RadioGroupContext.Provider value={ctxValue}>
            <RadioGroupViewport
                groupProps={groupProps}
                orientation={orientation}
                disabled={disabled}
                {...(className !== undefined ? { className } : {})}
            >
                {children}
                {/* react-native-web drops `name`, so on web a hidden input
                 * carries the selection into an enclosing HTML form. Like
                 * native radios, nothing is submitted while disabled or
                 * while no option is selected. */}
                {Platform.OS === 'web' && name !== undefined && current !== undefined && !disabled ? (
                    <input type="hidden" name={name} value={current} />
                ) : null}
            </RadioGroupViewport>
        </RadioGroupContext.Provider>
    );
};

// Inner view so we can call useThemeColors() to source the orientation
// gap from the spacing token scale (the parent owns hooks for state).
const RadioGroupViewport = ({
    groupProps,
    orientation,
    disabled,
    className,
    children,
}: {
    groupProps: Record<string, unknown>;
    orientation: RadioGroupOrientation;
    disabled: boolean;
    className?: string;
    children?: ReactNode;
}) => {
    const colors = useThemeColors();
    return (
        <View
            {...groupProps}
            className={cn(
                orientation === 'horizontal' ? 'flex-row gap-4' : 'flex-col gap-3',
                disabled ? 'opacity-60' : undefined,
                className
            )}
            style={[
                orientation === 'horizontal'
                    ? { flexDirection: 'row', gap: px(colors.spacing['4']) }
                    : { flexDirection: 'column', gap: px(colors.spacing['3']) },
                disabled ? { opacity: 0.6 } : null,
            ]}
        >
            {children}
        </View>
    );
};

/**
 * One option inside a `<Radio.Group>`. Must be rendered inside one — throws
 * with a clear message if not.
 */
const RadioOption = ({ value, label, disabled, children, className, testID }: RadioProps) => {
    const ctx = useRadioGroupContext();
    const colors = useThemeColors();
    const ownRef = useRef<HTMLElement | null>(null);
    const selected = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;

    // Depend on the stable registry functions, not the whole context: the
    // context changes on every selection, and re-registering then would move
    // this option to the end of the group's keyboard order.
    const { register, unregister, setOptionDisabled } = ctx;
    useEffect(() => {
        register(value, ownRef);
        return () => unregister(value);
    }, [register, unregister, value]);
    useEffect(() => {
        setOptionDisabled(value, Boolean(isDisabled));
    }, [setOptionDisabled, value, isDisabled]);

    const onPress = useCallback(() => {
        if (isDisabled) {
            return;
        }
        ctx.select(value);
    }, [ctx, value, isDisabled]);

    // Roving tabindex: only the selected option (or the first enabled one
    // when nothing is selected) participates in the tab order.
    const tabIndex = selected || (ctx.value === undefined && ctx.firstEnabledValue === value) ? 0 : -1;

    // With custom `children` the visible content is the accessible name; an
    // explicit label here would override it. `value` is only the fallback
    // for a radio that renders no text at all.
    const hasCustomContent = children !== undefined && children !== null;
    const accessibilityLabel = label ?? (hasCustomContent ? undefined : value);

    const radioProps: Record<string, unknown> = {
        ref: (node: HTMLElement | null) => {
            ownRef.current = node;
        },
        role: 'radio',
        accessibilityRole: 'radio',
        'aria-checked': selected,
        accessibilityState: { checked: selected, disabled: Boolean(isDisabled) },
        ...(accessibilityLabel !== undefined ? { accessibilityLabel, 'aria-label': accessibilityLabel } : {}),
        tabIndex,
        onPress,
        ...(isDisabled ? { 'aria-disabled': true, disabled: true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    const dotOuterStyle: ViewStyle = {
        ...DOT_OUTER_BASE,
        backgroundColor: colors.semantic.background.elevated,
        borderColor: selected ? colors.semantic.interactive.primary : colors.color.neutral['400'],
    };
    const dotInnerStyle: ViewStyle = { ...DOT_INNER_BASE, backgroundColor: colors.semantic.interactive.primary };

    const rowStyle: ViewStyle = { ...ROW_LAYOUT_BASE, gap: px(colors.spacing['2']) };

    return (
        <Pressable
            {...radioProps}
            className={cn('flex-row items-center gap-2', isDisabled ? 'opacity-60' : undefined, className)}
            style={[rowStyle, isDisabled ? { opacity: 0.6 } : null]}
        >
            <View style={dotOuterStyle}>{selected ? <View style={dotInnerStyle} /> : null}</View>
            {children ??
                (label !== undefined ? (
                    <RNText
                        style={{
                            color: colors.semantic.text.default,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.md),
                        }}
                    >
                        {label}
                    </RNText>
                ) : null)}
        </Pressable>
    );
};

/**
 * Public `Radio` value — the per-option component plus its `.Group` static
 * member (the cluster). Use `<Radio.Group>` to wrap a list of `<Radio />`s.
 *
 * `Object.assign` produces a value whose inferred type carries the static
 * properties, so `.d.ts` consumers can write `<Radio.Group>` without a
 * separate import.
 */
export const Radio = Object.assign(RadioOption, {
    Group: RadioGroup,
});
