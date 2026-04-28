'use client';

import {
    createContext,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivation = 'automatic' | 'manual';

type TabsContextValue = {
    value: string | undefined;
    setValue: (next: string) => void;
    baseId: string;
    orientation: TabsOrientation;
    activation: TabsActivation;
    register: (value: string, ref: RefObject<HTMLElement | null>) => void;
    unregister: (value: string) => void;
    moveFocus: (offset: 1 | -1, fromValue: string) => void;
    focusEdge: (edge: 'first' | 'last') => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = (label: string): TabsContextValue => {
    const ctx = useContext(TabsContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Tabs>.`);
    }
    return ctx;
};

export type TabsProps = {
    /** Controlled active tab value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    /** Fires with the new value when the active tab changes. */
    onChange?: (next: string) => void;
    /**
     * Layout direction of the tablist. Drives the keyboard-nav axis.
     * @defaultValue 'horizontal'
     */
    orientation?: TabsOrientation;
    /**
     * Whether arrow keys also activate the focused tab.
     *  - `automatic` (default) — selection follows focus, matching most UIs.
     *  - `manual` — arrow keys move focus only; the user presses Enter or
     *    Space to activate. Use when activating a tab is expensive.
     * @defaultValue 'automatic'
     */
    activation?: TabsActivation;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Tab pattern with keyboard nav, roving tabindex, and content/trigger
 * association via shared `value`s. Compose:
 *
 *   <Tabs defaultValue="overview">
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="settings">Settings</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">…</TabsContent>
 *     <TabsContent value="settings">…</TabsContent>
 *   </Tabs>
 *
 * Follows the WAI-ARIA tablist pattern: `tablist` / `tab` / `tabpanel` roles,
 * arrow-key navigation that wraps, Home/End for first/last, and roving
 * tabindex so tabbing into the group lands on the active tab.
 */
export function Tabs({
    value,
    defaultValue,
    onChange,
    orientation = 'horizontal',
    activation = 'automatic',
    children,
    className,
    testID,
}: TabsProps) {
    const baseId = useId();
    const [inner, setInner] = useState<string | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

    const refs = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());
    const orderRef = useRef<string[]>([]);

    const setValue = useCallback(
        (next: string) => {
            if (!isControlled) {
                setInner(next);
            }
            onChange?.(next);
        },
        [isControlled, onChange]
    );

    const register = useCallback((v: string, ref: RefObject<HTMLElement | null>) => {
        refs.current.set(v, ref);
        if (!orderRef.current.includes(v)) {
            orderRef.current.push(v);
        }
    }, []);

    const unregister = useCallback((v: string) => {
        refs.current.delete(v);
        orderRef.current = orderRef.current.filter((x) => x !== v);
    }, []);

    const focusValue = useCallback(
        (next: string) => {
            const ref = refs.current.get(next);
            ref?.current?.focus?.();
            if (activation === 'automatic') {
                setValue(next);
            }
        },
        [activation, setValue]
    );

    const moveFocus = useCallback(
        (offset: 1 | -1, fromValue: string) => {
            const order = orderRef.current;
            if (order.length === 0) {
                return;
            }
            const idx = order.indexOf(fromValue);
            const start = idx === -1 ? 0 : idx;
            const len = order.length;
            const next = order[(start + offset + len) % len];
            if (next) {
                focusValue(next);
            }
        },
        [focusValue]
    );

    const focusEdge = useCallback(
        (edge: 'first' | 'last') => {
            const order = orderRef.current;
            if (order.length === 0) {
                return;
            }
            const target = edge === 'first' ? order[0] : order[order.length - 1];
            if (target) {
                focusValue(target);
            }
        },
        [focusValue]
    );

    const ctxValue = useMemo<TabsContextValue>(
        () => ({
            value: current,
            setValue,
            baseId,
            orientation,
            activation,
            register,
            unregister,
            moveFocus,
            focusEdge,
        }),
        [current, setValue, baseId, orientation, activation, register, unregister, moveFocus, focusEdge]
    );

    return (
        <TabsContext.Provider value={ctxValue}>
            <TabsViewport
                orientation={orientation}
                {...(className !== undefined ? { className } : {})}
                {...(testID !== undefined ? { testID } : {})}
            >
                {children}
            </TabsViewport>
        </TabsContext.Provider>
    );
}

// Inner view so we can call useThemeColors() to source the orientation
// gap from the spacing token scale.
function TabsViewport({
    orientation,
    className,
    testID,
    children,
}: {
    orientation: TabsOrientation;
    className?: string;
    testID?: string;
    children?: ReactNode;
}) {
    const colors = useThemeColors();
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn(orientation === 'vertical' ? 'flex-row gap-4' : 'flex-col gap-3', className)}
            style={
                orientation === 'vertical'
                    ? { flexDirection: 'row', gap: px(colors.spacing['4']) }
                    : { flexDirection: 'column', gap: px(colors.spacing['3']) }
            }
        >
            {children}
        </View>
    );
}

export type TabsListProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// Layout-only bases; theme-driven gap is merged inside TabsList.
const LIST_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
};

const LIST_VERTICAL_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRightWidth: 1,
};

/** Container for `TabsTrigger`s. Renders the underline rule on the appropriate edge. */
export function TabsList({ children, className, testID }: TabsListProps) {
    const ctx = useTabsContext('TabsList');
    const colors = useThemeColors();
    const gap = px(colors.spacing['1']);
    const listStyle: ViewStyle =
        ctx.orientation === 'vertical'
            ? { ...LIST_VERTICAL_LAYOUT_BASE, gap, borderRightColor: colors.semantic.border.default }
            : { ...LIST_LAYOUT_BASE, gap, borderBottomColor: colors.semantic.border.default };
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="tablist"
            accessibilityRole="tablist"
            aria-orientation={ctx.orientation}
            className={cn(
                ctx.orientation === 'vertical'
                    ? 'flex-col gap-1 border-r border-semantic-border-default'
                    : 'flex-row items-center gap-1 border-b border-semantic-border-default',
                className
            )}
            style={listStyle}
        >
            {children}
        </View>
    );
}

export type TabsTriggerProps = {
    /** Value linking this trigger to a `<TabsContent>`. */
    value: string;
    /** Disable just this trigger. */
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// Subtle 200ms ease on border + text color so the active tab indicator
// fades in/out (and the trigger label colors smoothly between selected
// and idle) instead of snapping. Web only — RN ignores the transition*
// keys silently. We don't ship a true sliding magic-pill on either
// platform yet; that would need react-native-reanimated and per-trigger
// rect measurement, which is more complexity than this earns right now.
const TRIGGER_TRANSITION = {
    transitionProperty: 'border-color, color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
} as ViewStyle;

// Layout / transition only; theme-driven padding is merged inside TabsTrigger.
const TRIGGER_LAYOUT_BASE: ViewStyle = {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
    ...TRIGGER_TRANSITION,
};

const TRIGGER_LAYOUT_BASE_VERTICAL: ViewStyle = {
    borderRightWidth: 2,
    borderRightColor: 'transparent',
    marginRight: -1,
    ...TRIGGER_TRANSITION,
};

/** Clickable tab. Activating it shows the matching `TabsContent`. */
export function TabsTrigger({ value, disabled, children, className, testID }: TabsTriggerProps) {
    const ctx = useTabsContext('TabsTrigger');
    const colors = useThemeColors();
    const ownRef = useRef<HTMLElement | null>(null);
    const selected = ctx.value === value;
    const isVertical = ctx.orientation === 'vertical';

    useEffect(() => {
        ctx.register(value, ownRef);
        return () => ctx.unregister(value);
    }, [ctx, value]);

    const onPress = useCallback(() => {
        if (disabled) {
            return;
        }
        ctx.setValue(value);
    }, [ctx, value, disabled]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
            const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
            switch (event.key) {
                case nextKey:
                    event.preventDefault();
                    ctx.moveFocus(1, value);
                    return;
                case prevKey:
                    event.preventDefault();
                    ctx.moveFocus(-1, value);
                    return;
                case 'Home':
                    event.preventDefault();
                    ctx.focusEdge('first');
                    return;
                case 'End':
                    event.preventDefault();
                    ctx.focusEdge('last');
                    return;
                case 'Enter':
                case ' ': {
                    if (ctx.activation === 'manual') {
                        event.preventDefault();
                        if (!disabled) {
                            ctx.setValue(value);
                        }
                    }
                    return;
                }
            }
        },
        [ctx, value, disabled, isVertical]
    );

    const accentStyle = selected
        ? isVertical
            ? { borderRightColor: colors.semantic.interactive.primary }
            : { borderBottomColor: colors.semantic.interactive.primary }
        : null;

    const triggerProps: Record<string, unknown> = {
        ref: (node: HTMLElement | null) => {
            ownRef.current = node;
        },
        role: 'tab',
        accessibilityRole: 'tab',
        'aria-selected': selected,
        'aria-controls': `${ctx.baseId}-panel-${value}`,
        id: `${ctx.baseId}-tab-${value}`,
        tabIndex: selected ? 0 : -1,
        onPress,
        onKeyDown: handleKeyDown,
        ...(disabled ? { 'aria-disabled': true, disabled: true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    const triggerPadding: ViewStyle = {
        paddingHorizontal: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['2']),
    };
    const triggerStyle: ViewStyle = isVertical
        ? { ...TRIGGER_LAYOUT_BASE_VERTICAL, ...triggerPadding }
        : { ...TRIGGER_LAYOUT_BASE, ...triggerPadding };

    return (
        <Pressable
            {...triggerProps}
            className={cn(
                isVertical
                    ? 'px-3 py-2 -mr-px border-r-2 border-r-transparent'
                    : 'px-3 py-2 -mb-px border-b-2 border-b-transparent',
                selected ? 'border-r-semantic-interactive-primary' : '',
                disabled ? 'opacity-50' : 'opacity-100',
                className
            )}
            style={[triggerStyle, accentStyle, disabled ? { opacity: 0.5 } : null]}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: selected ? colors.semantic.interactive.primary : colors.semantic.text.muted,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: selected
                            ? (colors.fontWeight.semibold as '600')
                            : (colors.fontWeight.medium as '500'),
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
        </Pressable>
    );
}

export type TabsContentProps = {
    /** Value of the trigger this panel pairs with. */
    value: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/** Panel content shown when its `value` matches the active tab. */
export function TabsContent({ value, children, className, testID }: TabsContentProps) {
    const ctx = useTabsContext('TabsContent');
    const active = ctx.value === value;
    if (!active) {
        return null;
    }
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="tabpanel"
            accessibilityRole="none"
            id={`${ctx.baseId}-panel-${value}`}
            aria-labelledby={`${ctx.baseId}-tab-${value}`}
            tabIndex={0}
            className={cn('outline-none', className)}
        >
            {children}
        </View>
    );
}
