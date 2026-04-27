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
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type AccordionType = 'single' | 'multiple';

type SingleProps = {
    /** One-at-a-time mode. */
    type: 'single';
    /** Controlled open value. Pass `null` (with `collapsible`) for "nothing open". */
    value?: string | null;
    /** Uncontrolled initial open value. */
    defaultValue?: string;
    /** Fires when the open value changes. Receives the new value (string), or `null` if collapsed. */
    onValueChange?: (next: string | null) => void;
    /** Allow closing the open item by clicking it again. @defaultValue false */
    collapsible?: boolean;
};

type MultipleProps = {
    /** Any combination open. */
    type: 'multiple';
    /** Controlled list of open values. */
    value?: string[];
    /** Uncontrolled initial list of open values. */
    defaultValue?: string[];
    /** Fires when the open list changes. Receives the new list. */
    onValueChange?: (next: string[]) => void;
    /** No-op in `multiple` mode (items are always individually collapsible). */
    collapsible?: never;
};

type CommonProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export type AccordionProps = (SingleProps | MultipleProps) & CommonProps;

type AccordionContextValue = {
    baseId: string;
    isOpen: (value: string) => boolean;
    toggle: (value: string) => void;
    register: (value: string, ref: RefObject<HTMLElement | null>) => void;
    unregister: (value: string) => void;
    moveFocus: (offset: 1 | -1, fromValue: string) => void;
    focusEdge: (edge: 'first' | 'last') => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordionContext = (label: string): AccordionContextValue => {
    const ctx = useContext(AccordionContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside an <Accordion>.`);
    }
    return ctx;
};

type AccordionItemContextValue = {
    value: string;
    open: boolean;
    disabled: boolean;
    triggerId: string;
    contentId: string;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

const useAccordionItemContext = (label: string): AccordionItemContextValue => {
    const ctx = useContext(AccordionItemContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside an <AccordionItem>.`);
    }
    return ctx;
};

/**
 * Vertically stacked, individually expandable sections. Compose:
 *
 *   <Accordion type="single" defaultValue="overview" collapsible>
 *     <AccordionItem value="overview">
 *       <AccordionTrigger>Overview</AccordionTrigger>
 *       <AccordionContent>...</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Modes:
 *   - `single` — at most one item open. Pass `collapsible` to allow closing the
 *     open item.
 *   - `multiple` — any combination open. `value` / `defaultValue` are arrays.
 *
 * Controlled (`value` + `onValueChange`) and uncontrolled (`defaultValue`) both
 * supported. Triggers are real `<button>`s with full keyboard nav: ArrowDown /
 * ArrowUp move focus, Home / End jump to first / last, Enter / Space toggle.
 */
export function Accordion(props: AccordionProps) {
    const baseId = useId();
    const refs = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());
    const orderRef = useRef<string[]>([]);

    // Pull out the props we always need; the discriminated union handlers below
    // narrow on `type` for the actual state logic.
    const { type, children, className, testID } = props;

    // Single-mode internal state. We always allocate both state slots so the
    // hook order stays stable across re-renders regardless of `type`.
    const [singleInner, setSingleInner] = useState<string | null>(
        type === 'single' ? (props.defaultValue ?? null) : null
    );
    const [multipleInner, setMultipleInner] = useState<string[]>(type === 'multiple' ? (props.defaultValue ?? []) : []);

    const singleControlled = type === 'single' && props.value !== undefined;
    const multipleControlled = type === 'multiple' && props.value !== undefined;

    const singleCurrent = type === 'single' ? (singleControlled ? (props.value ?? null) : singleInner) : null;
    const multipleCurrent = type === 'multiple' ? (multipleControlled ? (props.value ?? []) : multipleInner) : [];

    const isOpen = useCallback(
        (v: string) => {
            if (type === 'single') return singleCurrent === v;
            return multipleCurrent.includes(v);
        },
        [type, singleCurrent, multipleCurrent]
    );

    const toggle = useCallback(
        (v: string) => {
            if (type === 'single') {
                const next = singleCurrent === v ? (props.collapsible ? null : singleCurrent) : v;
                if (next === singleCurrent) return;
                if (!singleControlled) setSingleInner(next);
                props.onValueChange?.(next);
            } else {
                const has = multipleCurrent.includes(v);
                const next = has ? multipleCurrent.filter((x) => x !== v) : [...multipleCurrent, v];
                if (!multipleControlled) setMultipleInner(next);
                props.onValueChange?.(next);
            }
        },
        // The handler needs the latest snapshot of every prop — `props` is a
        // discriminated union so spreading it into the deps is the cleanest
        // way to keep both branches honest.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type, singleCurrent, multipleCurrent, singleControlled, multipleControlled, props]
    );

    const register = useCallback((v: string, ref: RefObject<HTMLElement | null>) => {
        refs.current.set(v, ref);
        if (!orderRef.current.includes(v)) orderRef.current.push(v);
    }, []);

    const unregister = useCallback((v: string) => {
        refs.current.delete(v);
        orderRef.current = orderRef.current.filter((x) => x !== v);
    }, []);

    const moveFocus = useCallback((offset: 1 | -1, fromValue: string) => {
        const order = orderRef.current;
        if (order.length === 0) return;
        const idx = order.indexOf(fromValue);
        const start = idx === -1 ? 0 : idx;
        const len = order.length;
        const next = order[(start + offset + len) % len];
        if (!next) return;
        refs.current.get(next)?.current?.focus?.();
    }, []);

    const focusEdge = useCallback((edge: 'first' | 'last') => {
        const order = orderRef.current;
        if (order.length === 0) return;
        const target = edge === 'first' ? order[0] : order[order.length - 1];
        if (!target) return;
        refs.current.get(target)?.current?.focus?.();
    }, []);

    const ctxValue = useMemo<AccordionContextValue>(
        () => ({ baseId, isOpen, toggle, register, unregister, moveFocus, focusEdge }),
        [baseId, isOpen, toggle, register, unregister, moveFocus, focusEdge]
    );

    return (
        <AccordionContext.Provider value={ctxValue}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                className={cn('flex-col w-full', className)}
                style={{ flexDirection: 'column', width: '100%' }}
            >
                {children}
            </View>
        </AccordionContext.Provider>
    );
}

export type AccordionItemProps = {
    /** Stable identifier — links the item to `value` / `defaultValue` on the parent. */
    value: string;
    /** Disable expansion of this item. The trigger remains focusable for nav consistency. */
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const ITEM_BASE: ViewStyle = {
    borderBottomWidth: 1,
    flexDirection: 'column',
};

/** A single expandable section. Wraps an `AccordionTrigger` and `AccordionContent`. */
export function AccordionItem({ value, disabled = false, children, className, testID }: AccordionItemProps) {
    const ctx = useAccordionContext('AccordionItem');
    const colors = useThemeColors();
    const open = ctx.isOpen(value);

    const itemCtx = useMemo<AccordionItemContextValue>(
        () => ({
            value,
            open,
            disabled,
            triggerId: `${ctx.baseId}-trigger-${value}`,
            contentId: `${ctx.baseId}-content-${value}`,
        }),
        [value, open, disabled, ctx.baseId]
    );

    return (
        <AccordionItemContext.Provider value={itemCtx}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                className={cn('flex-col border-b border-semantic-border-default', className)}
                style={[ITEM_BASE, { borderBottomColor: colors.semantic.border.default }]}
            >
                {children}
            </View>
        </AccordionItemContext.Provider>
    );
}

export type AccordionTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const TRIGGER_BASE: ViewStyle = {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
};

/**
 * The clickable row that toggles its item open / closed. Renders a real
 * `<button>` (via Pressable) and wires `aria-expanded` + `aria-controls` to
 * the matching `AccordionContent`.
 */
export function AccordionTrigger({ children, className, testID }: AccordionTriggerProps) {
    const ctx = useAccordionContext('AccordionTrigger');
    const item = useAccordionItemContext('AccordionTrigger');
    const colors = useThemeColors();
    const ownRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        ctx.register(item.value, ownRef);
        return () => ctx.unregister(item.value);
    }, [ctx, item.value]);

    const onPress = useCallback(() => {
        if (item.disabled) return;
        ctx.toggle(item.value);
    }, [ctx, item.value, item.disabled]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    ctx.moveFocus(1, item.value);
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    ctx.moveFocus(-1, item.value);
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
                    event.preventDefault();
                    if (!item.disabled) ctx.toggle(item.value);
                    return;
                }
            }
        },
        [ctx, item.value, item.disabled]
    );

    // CSS transition for the chevron rotation on web. On native, RN expects
    // an array of transform objects (`[{ rotate: '180deg' }]`), so we branch
    // by platform to keep both ends rendering correctly. The web branch also
    // adds a CSS transition for a smooth rotation; native snaps (consumers
    // who want a spring can compose their own).
    const chevronStyle =
        Platform.OS === 'web'
            ? ({
                  transition: 'transform 200ms ease',
                  transform: `rotate(${item.open ? 180 : 0}deg)`,
              } as unknown as ViewStyle)
            : ({ transform: [{ rotate: item.open ? '180deg' : '0deg' }] } as ViewStyle);

    const triggerProps: Record<string, unknown> = {
        ref: (node: HTMLElement | null) => {
            ownRef.current = node;
        },
        role: 'button',
        accessibilityRole: 'button',
        'aria-expanded': item.open,
        'aria-controls': item.contentId,
        'aria-disabled': item.disabled || undefined,
        id: item.triggerId,
        // Every trigger sits in the tab order — pressing Tab moves through
        // the accordion sequentially, then arrow keys take over once focused.
        tabIndex: 0,
        onPress,
        onKeyDown: handleKeyDown,
        ...(item.disabled ? { disabled: true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    return (
        <Pressable
            {...triggerProps}
            className={cn(
                'flex-row items-center justify-between gap-3 px-4 py-3 min-h-[44px] hover:bg-semantic-background-subtle',
                item.disabled ? 'opacity-50' : 'opacity-100',
                className
            )}
            style={[TRIGGER_BASE, item.disabled ? { opacity: 0.5 } : null]}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: colors.semantic.text.default,
                        fontSize: 15,
                        fontWeight: '500',
                        flexShrink: 1,
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
            <View aria-hidden={true} style={chevronStyle}>
                <defaultSemanticIcons.chevronDown size={18} color={colors.semantic.text.muted} />
            </View>
        </Pressable>
    );
}

export type AccordionContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
    /**
     * Keep the content mounted even when collapsed. Useful for forms that
     * shouldn't lose state, or content that's expensive to mount.
     * @defaultValue false
     */
    forceMount?: boolean;
};

const CONTENT_BASE: ViewStyle = {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    overflow: 'hidden',
};

/**
 * The collapsible body. Hidden when the parent `AccordionItem` is closed.
 * On web, expanding uses a CSS max-height transition; on native, the body
 * mounts/unmounts.
 */
export function AccordionContent({ children, className, testID, forceMount = false }: AccordionContentProps) {
    const item = useAccordionItemContext('AccordionContent');
    const colors = useThemeColors();

    if (!item.open && !forceMount) return null;

    const contentStyle: ViewStyle = {
        ...CONTENT_BASE,
        ...(Platform.OS === 'web' && forceMount
            ? ({
                  maxHeight: item.open ? 9999 : 0,
                  transition: 'max-height 200ms ease',
                  paddingTop: item.open ? 4 : 0,
                  paddingBottom: item.open ? 12 : 0,
              } as unknown as ViewStyle)
            : {}),
    };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="region"
            accessibilityRole="none"
            id={item.contentId}
            aria-labelledby={item.triggerId}
            aria-hidden={!item.open}
            className={cn('px-4 pt-1 pb-3', className)}
            style={contentStyle}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: colors.semantic.text.muted,
                        fontSize: 14,
                        lineHeight: 20,
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
        </View>
    );
}
