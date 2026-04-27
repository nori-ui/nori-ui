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
import { Pressable, Text as RNText, View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type ToggleVariant = 'default' | 'outline';
export type ToggleSize = 'sm' | 'md' | 'lg';

type SizeTokens = {
    height: number;
    paddingH: number;
    fontSize: number;
    iconSize: number;
};

const SIZE_TOKENS: Record<ToggleSize, SizeTokens> = {
    sm: { height: 32, paddingH: 10, fontSize: 13, iconSize: 14 },
    md: { height: 40, paddingH: 12, fontSize: 14, iconSize: 16 },
    lg: { height: 48, paddingH: 16, fontSize: 16, iconSize: 20 },
};

// ---------- standalone <Toggle> -----------------------------------------------

export type ToggleProps = {
    /** Controlled pressed state. Pair with `onPressedChange`. */
    pressed?: boolean;
    /** Uncontrolled initial pressed state. Ignored when `pressed` is provided. */
    defaultPressed?: boolean;
    /** Fires with the next pressed state when the user toggles. */
    onPressedChange?: (next: boolean) => void;
    /**
     * Visual treatment.
     * - `default` — transparent when off, filled with `interactive.primary` when on.
     * - `outline` — bordered when off, tinted background + accent border when on.
     * @defaultValue 'default'
     */
    variant?: ToggleVariant;
    /** @defaultValue 'md' */
    size?: ToggleSize;
    /** Group-level disable (also forwarded by `<ToggleGroup>` to its items). */
    disabled?: boolean;
    /** Visible label or icon content. */
    children?: ReactNode;
    /** Required when `children` is icon-only. */
    'aria-label'?: string;
    accessibilityLabel?: string;
    className?: string;
    testID?: string;
};

/**
 * A two-state button — like the bold / italic buttons in a rich-text
 * toolbar. Use `<Toggle>` standalone for a single bistable action; reach
 * for `<ToggleGroup>` when you need a clustered set with shared selection
 * semantics.
 *
 * Reach for `<Switch>` instead when the control flips a setting in a form
 * (a "darkmode on/off" preference). Reach for `<Checkbox>` when the
 * control selects a value inside a form. `<Toggle>` is for buttons that
 * carry an on/off visual.
 */
export function Toggle({
    pressed,
    defaultPressed = false,
    onPressedChange,
    variant = 'default',
    size = 'md',
    disabled = false,
    children,
    'aria-label': ariaLabel,
    accessibilityLabel,
    className,
    testID,
}: ToggleProps) {
    const [inner, setInner] = useState<boolean>(defaultPressed);
    const isControlled = pressed !== undefined;
    const isOn = isControlled ? Boolean(pressed) : inner;

    const handlePress = useCallback(() => {
        if (disabled) return;
        const next = !isOn;
        if (!isControlled) setInner(next);
        onPressedChange?.(next);
    }, [disabled, isControlled, isOn, onPressedChange]);

    return (
        <ToggleVisual
            isOn={isOn}
            disabled={disabled}
            variant={variant}
            size={size}
            onPress={handlePress}
            ariaLabel={ariaLabel ?? accessibilityLabel}
            className={className}
            testID={testID}
        >
            {children}
        </ToggleVisual>
    );
}

// ---------- shared visual -----------------------------------------------------

type ToggleVisualProps = {
    isOn: boolean;
    disabled: boolean;
    variant: ToggleVariant;
    size: ToggleSize;
    onPress: () => void;
    onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
    onFocus?: (() => void) | undefined;
    ariaLabel?: string | undefined;
    className?: string | undefined;
    testID?: string | undefined;
    children?: ReactNode | undefined;
    /**
     * Group-aware roving tabindex. `undefined` means "the natural tab
     * stop" (standalone Toggle); inside a group, a number is supplied.
     */
    tabIndex?: number | undefined;
    /** Border-radius override for grouped items (square middle, rounded ends). */
    borderRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number } | undefined;
    /** Suppress the right border so adjacent items share a single seam. */
    suppressRightBorder?: boolean | undefined;
    /** Force the bordered look (used by grouped `default` items so the row reads as one chip). */
    forceBorder?: boolean | undefined;
    refCallback?: ((node: HTMLElement | null) => void) | undefined;
};

const ToggleVisual = ({
    isOn,
    disabled,
    variant,
    size,
    onPress,
    onKeyDown,
    onFocus,
    ariaLabel,
    className,
    testID,
    children,
    tabIndex,
    borderRadius,
    suppressRightBorder,
    forceBorder,
    refCallback,
}: ToggleVisualProps) => {
    const colors = useThemeColors();
    const tokens = SIZE_TOKENS[size];

    const radiusEach = borderRadius && typeof borderRadius !== 'number' ? borderRadius : undefined;
    const radiusValue = typeof borderRadius === 'number' ? borderRadius : radiusEach ? undefined : 6;

    const baseStyle: ViewStyle = {
        height: tokens.height,
        paddingHorizontal: tokens.paddingH,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...(radiusValue !== undefined ? { borderRadius: radiusValue } : null),
        ...(radiusEach
            ? {
                  borderTopLeftRadius: radiusEach.topLeft,
                  borderTopRightRadius: radiusEach.topRight,
                  borderBottomLeftRadius: radiusEach.bottomLeft,
                  borderBottomRightRadius: radiusEach.bottomRight,
              }
            : null),
        // 200ms color/background transition. Web only; native ignores it.
        ...({
            transitionProperty: 'background-color, border-color, color',
            transitionDuration: '200ms',
            transitionTimingFunction: 'ease',
        } as ViewStyle),
    };

    const surfaceFor = (hovered: boolean): ViewStyle => {
        if (variant === 'outline' || forceBorder) {
            return {
                backgroundColor: isOn
                    ? variant === 'outline'
                        ? colors.semantic.background.subtle
                        : colors.semantic.interactive.primary
                    : hovered
                      ? colors.semantic.background.subtle
                      : 'transparent',
                borderWidth: 1,
                borderColor: isOn ? colors.semantic.interactive.primary : colors.semantic.border.default,
                ...(suppressRightBorder ? { borderRightWidth: 0 } : null),
            };
        }
        // Default variant, standalone — give the off state a subtle
        // resting bg + 1px border so the control reads as a button. The
        // earlier "transparent off" look only made sense inside a group
        // where the cluster's shared seams told the eye "this is a row of
        // buttons"; standalone it just looked like text.
        return {
            backgroundColor: isOn
                ? colors.semantic.interactive.primary
                : hovered
                  ? colors.semantic.background.subtle
                  : colors.semantic.background.elevated,
            borderWidth: 1,
            borderColor: isOn ? colors.semantic.interactive.primary : colors.semantic.border.default,
        };
    };

    // Text color: inverted on the filled-on surface, accent-colored on the
    // outline-on surface, default text otherwise.
    const textColor =
        variant === 'outline'
            ? isOn
                ? colors.semantic.interactive.primary
                : colors.semantic.text.default
            : isOn
              ? colors.semantic.text.inverted
              : colors.semantic.text.default;

    const accessibilityProps: Record<string, unknown> = {
        role: 'button',
        accessibilityRole: 'button',
        'aria-pressed': isOn,
        accessibilityState: { selected: isOn, disabled },
        ...(ariaLabel ? { 'aria-label': ariaLabel, accessibilityLabel: ariaLabel } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(testID !== undefined ? { testID } : {}),
        ...(tabIndex !== undefined ? { tabIndex } : {}),
        ...(onKeyDown ? { onKeyDown } : {}),
        ...(onFocus ? { onFocus } : {}),
    };

    // RN-Web's Pressable on web doesn't reliably invoke the style callback
    // (the hovered/pressed state isn't always wired through to a re-render
    // — at least in the version we ship against). Compute the static style
    // upfront with `hovered=false` and overlay a `:hover` color via CSS
    // class for the off-state hover. Active-state hover is for outline
    // variant only and doesn't change the look enough to justify the
    // complexity of a style-callback path here.
    const surfaceStatic = surfaceFor(false);

    return (
        <Pressable
            ref={(node: unknown) => {
                refCallback?.(node as HTMLElement | null);
            }}
            disabled={disabled}
            onPress={() => {
                if (!disabled) onPress();
            }}
            {...accessibilityProps}
            className={cn(
                'inline-flex flex-row items-center justify-center select-none',
                disabled ? 'opacity-50' : undefined,
                className
            )}
            style={[baseStyle, surfaceStatic, disabled ? { opacity: 0.5 } : null]}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: textColor,
                        fontSize: tokens.fontSize,
                        fontWeight: '500',
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
        </Pressable>
    );
};

// ---------- <ToggleGroup> + context ------------------------------------------

type ToggleGroupContextValue = {
    type: 'single' | 'multiple';
    setValue: (value: string) => void;
    isPressed: (value: string) => boolean;
    disabled: boolean;
    variant: ToggleVariant;
    size: ToggleSize;
    register: (value: string, ref: RefObject<HTMLElement | null>) => void;
    unregister: (value: string) => void;
    rovingValue: string | undefined;
    setRovingValue: (next: string) => void;
    moveBy: (delta: 1 | -1, current: string) => void;
    moveTo: (position: 'first' | 'last') => void;
    /** Live ordered list of registered item values — drives border math. */
    order: string[];
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

const useToggleGroupContext = () => {
    const ctx = useContext(ToggleGroupContext);
    if (!ctx) throw new Error('<ToggleGroupItem> must be rendered inside a <ToggleGroup>.');
    return ctx;
};

type ToggleGroupCommonProps = {
    /** Group-level disable. Each item's `disabled` is OR-ed with this. */
    disabled?: boolean;
    /** @defaultValue 'default' */
    variant?: ToggleVariant;
    /** @defaultValue 'md' */
    size?: ToggleSize;
    children?: ReactNode;
    className?: string;
    testID?: string;
    'aria-label'?: string;
    accessibilityLabel?: string;
};

export type ToggleGroupSingleProps = ToggleGroupCommonProps & {
    /** Multi-select gives an array; single-select gives a string (or undefined). */
    type: 'single';
    // `| undefined` is intentional under exactOptionalPropertyTypes — clicking
    // the active item clears the selection, so consumers MUST be allowed to
    // pass `undefined` as the controlled value, not just omit the prop.
    value?: string | undefined;
    defaultValue?: string | undefined;
    onValueChange?: (next: string | undefined) => void;
};

export type ToggleGroupMultipleProps = ToggleGroupCommonProps & {
    type: 'multiple';
    value?: string[] | undefined;
    defaultValue?: string[] | undefined;
    onValueChange?: (next: string[]) => void;
};

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

/**
 * Cluster of `<ToggleGroupItem>`s with shared selection semantics.
 *
 * - `type="multiple"` — value is `string[]`. Clicking toggles a value
 *   in/out of the array. ARIA exposes a plain `role="group"`.
 * - `type="single"` — value is `string | undefined`. Clicking sets it;
 *   re-clicking the active one clears it. ARIA exposes `role="radiogroup"`
 *   so AT users hear "1 of N selected" semantics.
 *
 * Keyboard: `ArrowRight` / `ArrowLeft` move focus between items (roving
 * tabindex), `Home` / `End` jump to the ends, and `Space` / `Enter`
 * toggle the focused item.
 */
export function ToggleGroup(props: ToggleGroupProps) {
    const {
        type,
        disabled = false,
        variant = 'default',
        size = 'md',
        children,
        className,
        testID,
        'aria-label': ariaLabel,
        accessibilityLabel,
    } = props;

    // Controlled / uncontrolled state, branching on `type`.
    const [innerSingle, setInnerSingle] = useState<string | undefined>(
        type === 'single' ? (props as ToggleGroupSingleProps).defaultValue : undefined
    );
    const [innerMultiple, setInnerMultiple] = useState<string[]>(
        type === 'multiple' ? ((props as ToggleGroupMultipleProps).defaultValue ?? []) : []
    );

    const isSingle = type === 'single';
    const isControlled = isSingle
        ? (props as ToggleGroupSingleProps).value !== undefined
        : (props as ToggleGroupMultipleProps).value !== undefined;

    const setValue = useCallback(
        (next: string) => {
            if (disabled) return;
            if (isSingle) {
                const current = isControlled ? (props as ToggleGroupSingleProps).value : innerSingle;
                const updated = current === next ? undefined : next;
                if (!isControlled) setInnerSingle(updated);
                (props as ToggleGroupSingleProps).onValueChange?.(updated);
            } else {
                const current: string[] =
                    (isControlled ? (props as ToggleGroupMultipleProps).value : innerMultiple) ?? [];
                const updated = current.includes(next) ? current.filter((v) => v !== next) : [...current, next];
                if (!isControlled) setInnerMultiple(updated);
                (props as ToggleGroupMultipleProps).onValueChange?.(updated);
            }
        },
        [disabled, isSingle, isControlled, innerSingle, innerMultiple, props]
    );

    const isPressed = useCallback(
        (v: string) => {
            if (isSingle) {
                const current = isControlled ? (props as ToggleGroupSingleProps).value : innerSingle;
                return current === v;
            }
            const current = (isControlled ? (props as ToggleGroupMultipleProps).value : innerMultiple) ?? [];
            return current.includes(v);
        },
        [isSingle, isControlled, innerSingle, innerMultiple, props]
    );

    // --- roving tabindex order management ---
    const refs = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());
    // Live ordered list — re-render the group whenever items register so
    // border math (first/last) and roving init see the current order.
    const [order, setOrder] = useState<string[]>([]);
    const [rovingValue, setRovingValueState] = useState<string | undefined>(undefined);

    const register = useCallback((v: string, ref: RefObject<HTMLElement | null>) => {
        refs.current.set(v, ref);
        setOrder((prev) => (prev.includes(v) ? prev : [...prev, v]));
        setRovingValueState((current) => current ?? v);
    }, []);

    const unregister = useCallback((v: string) => {
        refs.current.delete(v);
        setOrder((prev) => prev.filter((x) => x !== v));
        setRovingValueState((current) => (current === v ? undefined : current));
    }, []);

    const focusValue = useCallback((v: string) => {
        refs.current.get(v)?.current?.focus?.();
    }, []);

    const setRovingValue = useCallback((v: string) => setRovingValueState(v), []);

    const moveBy = useCallback(
        (delta: 1 | -1, current: string) => {
            const list = order;
            if (list.length === 0) return;
            const idx = list.indexOf(current);
            const start = idx === -1 ? 0 : idx;
            const next = list[(start + delta + list.length) % list.length];
            if (!next) return;
            setRovingValueState(next);
            focusValue(next);
        },
        [order, focusValue]
    );

    const moveTo = useCallback(
        (position: 'first' | 'last') => {
            const list = order;
            if (list.length === 0) return;
            const next = position === 'first' ? list[0] : list[list.length - 1];
            if (!next) return;
            setRovingValueState(next);
            focusValue(next);
        },
        [order, focusValue]
    );

    const ctxValue = useMemo<ToggleGroupContextValue>(
        () => ({
            type,
            setValue,
            isPressed,
            disabled,
            variant,
            size,
            register,
            unregister,
            rovingValue,
            setRovingValue,
            moveBy,
            moveTo,
            order,
        }),
        [
            type,
            setValue,
            isPressed,
            disabled,
            variant,
            size,
            register,
            unregister,
            rovingValue,
            setRovingValue,
            moveBy,
            moveTo,
            order,
        ]
    );

    const groupRole = isSingle ? 'radiogroup' : 'group';
    const label = ariaLabel ?? accessibilityLabel;

    const groupProps: Record<string, unknown> = {
        role: groupRole,
        accessibilityRole: groupRole,
        ...(label ? { 'aria-label': label, accessibilityLabel: label } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    // For the `default` variant we render items zero-gap so they share
    // borders, like a UISegmentedControl. For `outline` we keep a small
    // gap so the bordered cells don't double up their seams.
    const containerStyle: ViewStyle =
        variant === 'default'
            ? { flexDirection: 'row', alignItems: 'stretch', gap: 0 }
            : { flexDirection: 'row', alignItems: 'stretch', gap: 4 };

    return (
        <ToggleGroupContext.Provider value={ctxValue}>
            <View
                {...groupProps}
                className={cn(
                    'inline-flex flex-row items-stretch',
                    variant === 'default' ? 'gap-0' : 'gap-1',
                    disabled ? 'opacity-60' : undefined,
                    className
                )}
                style={[containerStyle, disabled ? { opacity: 0.6 } : null]}
            >
                {children}
            </View>
        </ToggleGroupContext.Provider>
    );
}

export type ToggleGroupItemProps = {
    /** Unique identifier within the group — written into `value` when pressed. */
    value: string;
    /** Disable just this item (OR-ed with group-level `disabled`). */
    disabled?: boolean;
    children?: ReactNode;
    'aria-label'?: string;
    accessibilityLabel?: string;
    className?: string;
    testID?: string;
};

/**
 * One toggle inside a `<ToggleGroup>`. Throws with a clear message when
 * rendered outside of one.
 */
export function ToggleGroupItem({
    value,
    disabled,
    children,
    'aria-label': ariaLabel,
    accessibilityLabel,
    className,
    testID,
}: ToggleGroupItemProps) {
    const ctx = useToggleGroupContext();
    const ownRef = useRef<HTMLElement | null>(null);
    // Capture register/unregister in a ref so the effect's deps stay
    // value-only — otherwise a new context object on every render (driven
    // by setOrder inside register) would re-fire the effect → setState
    // loop → "Maximum update depth exceeded".
    const registryRef = useRef({ register: ctx.register, unregister: ctx.unregister });
    registryRef.current = { register: ctx.register, unregister: ctx.unregister };

    useEffect(() => {
        // Read-through holder so the registered ref always sees the latest node.
        const holder: RefObject<HTMLElement | null> = {
            get current() {
                return ownRef.current;
            },
            set current(_v) {
                /* no-op — read-through to ownRef */
            },
        } as unknown as RefObject<HTMLElement | null>;
        registryRef.current.register(value, holder);
        return () => registryRef.current.unregister(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const isOn = ctx.isPressed(value);
    const isDisabled = disabled || ctx.disabled;
    const isRoving = ctx.rovingValue === value;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown': {
                    event.preventDefault();
                    ctx.moveBy(1, value);
                    return;
                }
                case 'ArrowLeft':
                case 'ArrowUp': {
                    event.preventDefault();
                    ctx.moveBy(-1, value);
                    return;
                }
                case 'Home': {
                    event.preventDefault();
                    ctx.moveTo('first');
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    ctx.moveTo('last');
                    return;
                }
                case ' ':
                case 'Enter': {
                    event.preventDefault();
                    if (!isDisabled) ctx.setValue(value);
                    return;
                }
            }
        },
        [ctx, isDisabled, value]
    );

    const handleFocus = useCallback(() => {
        ctx.setRovingValue(value);
    }, [ctx, value]);

    // Items inside a `default`-variant group share borders: only the first
    // rounds the left, the last rounds the right; everything else is square.
    const idx = ctx.order.indexOf(value);
    const isFirst = idx === 0;
    const isLast = idx === ctx.order.length - 1;
    const sharedRadius = 6;
    const isClustered = ctx.order.length > 1;
    const borderRadius = isClustered
        ? {
              topLeft: isFirst ? sharedRadius : 0,
              bottomLeft: isFirst ? sharedRadius : 0,
              topRight: isLast ? sharedRadius : 0,
              bottomRight: isLast ? sharedRadius : 0,
          }
        : sharedRadius;

    return (
        <ToggleVisual
            isOn={isOn}
            disabled={Boolean(isDisabled)}
            variant={ctx.variant}
            size={ctx.size}
            onPress={() => ctx.setValue(value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            ariaLabel={ariaLabel ?? accessibilityLabel}
            className={className}
            testID={testID}
            tabIndex={isRoving ? 0 : -1}
            borderRadius={borderRadius}
            forceBorder={ctx.variant === 'default' && isClustered}
            suppressRightBorder={isClustered && !isLast}
            refCallback={(node) => {
                ownRef.current = node;
            }}
        >
            {children}
        </ToggleVisual>
    );
}
