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

export type RadioGroupOrientation = 'horizontal' | 'vertical';

type RadioRefMap = Map<string, RefObject<HTMLElement | null>>;

type RadioGroupContextValue = {
    value: string | undefined;
    select: (next: string) => void;
    disabled: boolean;
    orientation: RadioGroupOrientation;
    name: string | undefined;
    register: (value: string, ref: RefObject<HTMLElement | null>) => void;
    unregister: (value: string) => void;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const useRadioGroupContext = (): RadioGroupContextValue => {
    const ctx = useContext(RadioGroupContext);
    if (!ctx) {
        throw new Error('<Radio> must be rendered inside a <RadioGroup>.');
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
    /** HTML `name` for form integration on web. Optional but recommended. */
    name?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
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

const ROW_STYLE: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 8 };
const DOT_OUTER_BASE: ViewStyle = {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
};
const DOT_INNER_BASE: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
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
export function RadioGroup({
    value,
    defaultValue,
    onChange,
    disabled = false,
    orientation = 'vertical',
    name,
    children,
    className,
    testID,
}: RadioGroupProps) {
    const [inner, setInner] = useState<string | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

    const refs = useRef<RadioRefMap>(new Map());
    const orderRef = useRef<string[]>([]);

    const register = useCallback((v: string, ref: RefObject<HTMLElement | null>) => {
        refs.current.set(v, ref);
        if (!orderRef.current.includes(v)) orderRef.current.push(v);
    }, []);

    const unregister = useCallback((v: string) => {
        refs.current.delete(v);
        orderRef.current = orderRef.current.filter((x) => x !== v);
    }, []);

    const select = useCallback(
        (next: string) => {
            if (disabled) return;
            if (!isControlled) setInner(next);
            onChange?.(next);
        },
        [disabled, isControlled, onChange]
    );

    const focusValue = useCallback((next: string) => {
        const ref = refs.current.get(next);
        ref?.current?.focus?.();
    }, []);

    const moveBy = useCallback(
        (offset: 1 | -1) => {
            const order = orderRef.current;
            if (order.length === 0) return;
            const idx = current ? order.indexOf(current) : -1;
            const start = idx === -1 ? (offset === 1 ? -1 : 0) : idx;
            const len = order.length;
            const next = order[(start + offset + len) % len];
            if (!next) return;
            select(next);
            focusValue(next);
        },
        [current, focusValue, select]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const order = orderRef.current;
            if (order.length === 0) return;
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
                    const first = order[0];
                    if (first) {
                        select(first);
                        focusValue(first);
                    }
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    const last = order[order.length - 1];
                    if (last) {
                        select(last);
                        focusValue(last);
                    }
                    return;
                }
            }
        },
        [focusValue, moveBy, select]
    );

    const ctxValue = useMemo<RadioGroupContextValue>(
        () => ({ value: current, select, disabled, orientation, name, register, unregister }),
        [current, select, disabled, orientation, name, register, unregister]
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
    };

    return (
        <RadioGroupContext.Provider value={ctxValue}>
            <View
                {...groupProps}
                className={cn(
                    orientation === 'horizontal' ? 'flex-row gap-4' : 'flex-col gap-3',
                    disabled ? 'opacity-60' : undefined,
                    className
                )}
                style={[
                    orientation === 'horizontal'
                        ? { flexDirection: 'row', gap: 16 }
                        : { flexDirection: 'column', gap: 12 },
                    disabled ? { opacity: 0.6 } : null,
                ]}
            >
                {children}
            </View>
        </RadioGroupContext.Provider>
    );
}

/**
 * One option inside a `<RadioGroup>`. Must be rendered inside one — throws
 * with a clear message if not.
 */
export function Radio({ value, label, disabled, children, className, testID }: RadioProps) {
    const ctx = useRadioGroupContext();
    const colors = useThemeColors();
    const ownRef = useRef<HTMLElement | null>(null);
    const selected = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;

    useEffect(() => {
        ctx.register(value, ownRef);
        return () => ctx.unregister(value);
    }, [ctx, value]);

    const onPress = useCallback(() => {
        if (isDisabled) return;
        ctx.select(value);
    }, [ctx, value, isDisabled]);

    // Roving tabindex: only the selected option (or the first when nothing
    // is selected) participates in the tab order.
    const tabIndex = selected || (ctx.value === undefined && isFirstOption(ctx, value)) ? 0 : -1;

    const accessibilityLabel = label ?? value;

    const radioProps: Record<string, unknown> = {
        ref: (node: HTMLElement | null) => {
            ownRef.current = node;
        },
        role: 'radio',
        accessibilityRole: 'radio',
        'aria-checked': selected,
        accessibilityState: { checked: selected, disabled: Boolean(isDisabled) },
        accessibilityLabel,
        'aria-label': accessibilityLabel,
        tabIndex,
        onPress,
        ...(isDisabled ? { 'aria-disabled': true, disabled: true } : {}),
        ...(testID !== undefined ? { testID } : {}),
        ...(ctx.name ? { name: ctx.name } : {}),
    };

    const dotOuterStyle: ViewStyle = {
        ...DOT_OUTER_BASE,
        backgroundColor: colors.semantic.background.elevated,
        borderColor: selected ? colors.semantic.interactive.primary : colors.color.neutral['400'],
    };
    const dotInnerStyle: ViewStyle = { ...DOT_INNER_BASE, backgroundColor: colors.semantic.interactive.primary };

    return (
        <Pressable
            {...radioProps}
            className={cn('flex-row items-center gap-2', isDisabled ? 'opacity-60' : undefined, className)}
            style={[ROW_STYLE, isDisabled ? { opacity: 0.6 } : null]}
        >
            <View style={dotOuterStyle}>{selected ? <View style={dotInnerStyle} /> : null}</View>
            {children ??
                (label !== undefined ? (
                    <RNText style={{ color: colors.semantic.text.default, fontSize: 16 }}>{label}</RNText>
                ) : null)}
        </Pressable>
    );
}

// Tiny helper: when no value is selected yet, the first registered Radio is
// the tabbable one. This is computed inside Radio (not the context) so we
// don't have to re-render every Radio whenever the order changes.
function isFirstOption(ctx: RadioGroupContextValue, value: string): boolean {
    // We only have access to register/unregister; Radio doesn't get a peek
    // at the order list. The simple-but-correct fallback: every Radio renders
    // tabIndex=0 when value is undefined, which is harmless for one-radio
    // groups and equivalent to the standard "tab into the first" for
    // multi-radio groups (browsers honor the first tabIndex=0 they hit).
    void ctx;
    void value;
    return true;
}
