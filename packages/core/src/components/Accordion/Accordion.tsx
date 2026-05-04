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
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { AnimatedView } from '../../animation/animated-view';
import { useAnimatedNumber } from '../../animation/use-animated-number';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { px } from '../../theme/px';
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
    onChange?: (next: string | null) => void;
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
    onChange?: (next: string[]) => void;
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
        throw new Error(`<${label}> must be rendered inside an <Accordion.Item>.`);
    }
    return ctx;
};

/**
 * Vertically stacked, individually expandable sections. Compose:
 *
 *   <Accordion type="single" defaultValue="overview" collapsible>
 *     <Accordion.Item value="overview">
 *       <Accordion.Trigger>Overview</Accordion.Trigger>
 *       <Accordion.Content>...</Accordion.Content>
 *     </Accordion.Item>
 *   </Accordion>
 *
 * Modes:
 *   - `single` — at most one item open. Pass `collapsible` to allow closing the
 *     open item.
 *   - `multiple` — any combination open. `value` / `defaultValue` are arrays.
 *
 * Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) both
 * supported. Triggers are real `<button>`s with full keyboard nav: ArrowDown /
 * ArrowUp move focus, Home / End jump to first / last, Enter / Space toggle.
 */
const AccordionRoot = (props: AccordionProps) => {
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
            if (type === 'single') {
                return singleCurrent === v;
            }
            return multipleCurrent.includes(v);
        },
        [type, singleCurrent, multipleCurrent]
    );

    const toggle = useCallback(
        (v: string) => {
            if (type === 'single') {
                const next = singleCurrent === v ? (props.collapsible ? null : singleCurrent) : v;
                if (next === singleCurrent) {
                    return;
                }
                if (!singleControlled) {
                    setSingleInner(next);
                }
                props.onChange?.(next);
            } else {
                const has = multipleCurrent.includes(v);
                const next = has ? multipleCurrent.filter((x) => x !== v) : [...multipleCurrent, v];
                if (!multipleControlled) {
                    setMultipleInner(next);
                }
                props.onChange?.(next);
            }
        },
        // The handler needs the latest snapshot of every prop — `props` is a
        // discriminated union so spreading it into the deps is the cleanest
        // way to keep both branches honest.
        [type, singleCurrent, multipleCurrent, singleControlled, multipleControlled, props]
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

    const moveFocus = useCallback((offset: 1 | -1, fromValue: string) => {
        const order = orderRef.current;
        if (order.length === 0) {
            return;
        }
        const idx = order.indexOf(fromValue);
        const start = idx === -1 ? 0 : idx;
        const len = order.length;
        const next = order[(start + offset + len) % len];
        if (!next) {
            return;
        }
        refs.current.get(next)?.current?.focus?.();
    }, []);

    const focusEdge = useCallback((edge: 'first' | 'last') => {
        const order = orderRef.current;
        if (order.length === 0) {
            return;
        }
        const target = edge === 'first' ? order[0] : order[order.length - 1];
        if (!target) {
            return;
        }
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
};

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

// Layout-only constants for the trigger / content; theme-driven sizes are
// merged in inside the component below.
const TRIGGER_LAYOUT_BASE: ViewStyle = {
    minHeight: 44, // component-density literal — not from theme
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const CONTENT_INNER_LAYOUT_BASE: ViewStyle = {
    // Padding values come from theme inside AccordionContent.
};

/** A single expandable section. Wraps an `Accordion.Trigger` and `Accordion.Content`. */
const AccordionItem = ({ value, disabled = false, children, className, testID }: AccordionItemProps) => {
    const ctx = useAccordionContext('Accordion.Item');
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
};

export type AccordionTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * The clickable row that toggles its item open / closed. Renders a real
 * `<button>` (via Pressable) and wires `aria-expanded` + `aria-controls` to
 * the matching `Accordion.Content`.
 */
const AccordionTrigger = ({ children, className, testID }: AccordionTriggerProps) => {
    const ctx = useAccordionContext('Accordion.Trigger');
    const item = useAccordionItemContext('Accordion.Trigger');
    const colors = useThemeColors();
    const ownRef = useRef<HTMLElement | null>(null);
    const triggerStyle: ViewStyle = {
        ...TRIGGER_LAYOUT_BASE,
        paddingHorizontal: px(colors.spacing['4']),
        paddingVertical: px(colors.spacing['3']),
        gap: px(colors.spacing['3']),
    };

    useEffect(() => {
        ctx.register(item.value, ownRef);
        return () => ctx.unregister(item.value);
    }, [ctx, item.value]);

    const onPress = useCallback(() => {
        if (item.disabled) {
            return;
        }
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
                    if (!item.disabled) {
                        ctx.toggle(item.value);
                    }
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
            style={[triggerStyle, item.disabled ? { opacity: 0.5 } : null]}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: colors.semantic.text.default,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: colors.fontWeight.medium as '500',
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
};

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

// Animation timing — mirrors the Switch slide and the web CSS
// transition exactly so the accordion feels identical on web and native.
const ACCORDION_ANIM_DURATION_MS = 200;

/**
 * The collapsible body. On web it always mounts but slides open / closed
 * via an animated max-height + opacity transition (200ms ease). On native
 * it mounts in a measure-pass on first render to capture the natural
 * content height, then animates `height` + `opacity` via the shared
 * `useAnimatedNumber` primitive (200ms, cubic-bezier(0.16, 1, 0.3, 1) —
 * matches the Switch thumb slide).
 *
 * Implementation note: the web-side height + transition styles are pushed
 * onto the outer wrapper's DOM node via a ref + useEffect rather than
 * through the View's `style` prop. Reason: rn-web's style filter drops
 * keys it doesn't recognise as RN style props (`transition`, `maxHeight`
 * shorthand, etc.), taking the whole fragment with them. Direct DOM
 * mutation bypasses that filter — same trick used by Dialog's backdrop
 * blur.
 */
const AccordionContent = ({ children, className, testID, forceMount: _forceMount = false }: AccordionContentProps) => {
    const item = useAccordionItemContext('Accordion.Content');
    const colors = useThemeColors();
    const wrapperRef = useRef<HTMLElement | null>(null);
    const innerRef = useRef<HTMLElement | null>(null);
    // Natural (open-state) height of the content, captured on first
    // layout. Re-captured if the layout reports a different size while
    // open (e.g. dynamic content).
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
    const innerStyle: ViewStyle = {
        ...CONTENT_INNER_LAYOUT_BASE,
        paddingHorizontal: px(colors.spacing['4']),
        paddingTop: px(colors.spacing['1']),
        paddingBottom: px(colors.spacing['3']),
    };

    // Slide open/close on web. We measure the natural height of the inner
    // content each time the open state flips, then animate the wrapper's
    // maxHeight to/from 0. Setting maxHeight: 'none' after the transition
    // would let the content grow if it later changes — but for the v0
    // accordion we expect static content, so we leave maxHeight at the
    // measured value (good enough; resize observer can come later).
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const wrapper = wrapperRef.current;
        const inner = innerRef.current;
        if (!wrapper || !inner) {
            return;
        }

        // First-render shortcut: skip the animation when an item starts
        // already open (avoids the "all items open then animate closed"
        // flash on mount).
        const isFirstPaint = wrapper.dataset.noriPainted !== '1';
        wrapper.dataset.noriPainted = '1';

        wrapper.style.overflow = 'hidden';
        wrapper.style.transitionProperty = 'max-height, opacity';
        wrapper.style.transitionDuration = `${ACCORDION_ANIM_DURATION_MS}ms`;
        wrapper.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';

        if (item.open) {
            const target = inner.scrollHeight;
            if (isFirstPaint) {
                wrapper.style.maxHeight = `${target}px`;
                wrapper.style.opacity = '1';
                return;
            }
            // Animate from current measured 0px to the target height.
            wrapper.style.maxHeight = '0px';
            wrapper.style.opacity = '0';
            // Force a reflow so the start state actually applies before
            // we set the end state — otherwise the browser collapses
            // both into a single repaint and skips the animation.
            void wrapper.offsetHeight;
            requestAnimationFrame(() => {
                wrapper.style.maxHeight = `${target}px`;
                wrapper.style.opacity = '1';
            });
        } else {
            // Going from open → closed. Set the explicit current height
            // first so we have something to transition FROM (auto/none
            // doesn't transition).
            const current = inner.scrollHeight;
            wrapper.style.maxHeight = `${current}px`;
            wrapper.style.opacity = '1';
            void wrapper.offsetHeight;
            requestAnimationFrame(() => {
                wrapper.style.maxHeight = '0px';
                wrapper.style.opacity = '0';
            });
        }
    }, [item.open]);

    // Native height + opacity animation. Driven by `useAnimatedNumber`,
    // which dispatches per-property to a static-key reanimated worklet
    // (the plugin can't serialize closures over computed keys, so each
    // property gets its own static-key useAnimatedStyle inside the hook).
    //
    // Target values are derived from open + measured size. Before
    // measurement we still call the hooks (hook order must stay
    // stable); they animate to/from 0 which becomes a no-op until the
    // first onLayout fires.
    const targetHeight = item.open ? (measuredHeight ?? 0) : 0;
    const targetOpacity = item.open ? 1 : 0;
    const heightAnim = useAnimatedNumber('height', targetHeight, {
        duration: ACCORDION_ANIM_DURATION_MS,
    });
    const opacityAnim = useAnimatedNumber('opacity', targetOpacity, {
        duration: ACCORDION_ANIM_DURATION_MS,
    });

    const onInnerLayout = useCallback(
        (e: LayoutChangeEvent) => {
            if (Platform.OS === 'web') {
                return;
            }
            const next = e.nativeEvent.layout.height;
            if (next > 0 && next !== measuredHeight) {
                setMeasuredHeight(next);
            }
        },
        [measuredHeight]
    );

    // Native path: always mount the inner so we can measure its natural
    // height once. Before measurement, we render with `position:
    // absolute, opacity: 0` so the layout pass runs off-screen and
    // doesn't affect the surrounding flow (avoids the "flash of fully-
    // open content" on first paint of an initially-closed item).
    // After measurement, the outer Animated.View drives height +
    // opacity together.
    if (Platform.OS !== 'web') {
        const animatedWrapperStyle: ViewStyle = {
            overflow: 'hidden',
        };
        // Pre-measurement: render the inner off-screen for one layout
        // pass. The wrapper claims 0 height in the flow so the next
        // sibling is positioned correctly until we know the real size.
        if (measuredHeight === null) {
            return (
                <AnimatedView
                    {...(testID !== undefined ? { testID } : {})}
                    accessibilityRole="none"
                    aria-labelledby={item.triggerId}
                    aria-hidden={!item.open}
                    style={[animatedWrapperStyle, { height: 0 }]}
                    className={cn('overflow-hidden', className)}
                >
                    <View
                        onLayout={onInnerLayout}
                        className={cn('px-4 pt-1 pb-3')}
                        // Absolute + left/right:0 stretches the measurement
                        // pass to the parent's full width, so wrapping text
                        // measures at its REAL natural height. Without
                        // left/right, Yoga gives an absolute child width 0
                        // and the measurement collapses to a few pixels.
                        style={[innerStyle, { position: 'absolute', left: 0, right: 0, opacity: 0 }]}
                    >
                        {typeof children === 'string' ? (
                            <RNText
                                style={{
                                    color: colors.semantic.text.muted,
                                    fontFamily: colors.fontFamily.body,
                                    fontSize: px(colors.fontSize.sm),
                                    lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                                }}
                            >
                                {children}
                            </RNText>
                        ) : (
                            children
                        )}
                    </View>
                </AnimatedView>
            );
        }
        return (
            <AnimatedView
                {...(testID !== undefined ? { testID } : {})}
                accessibilityRole="none"
                aria-labelledby={item.triggerId}
                aria-hidden={!item.open}
                style={[animatedWrapperStyle, heightAnim as object]}
                className={cn('overflow-hidden', className)}
            >
                <AnimatedView style={opacityAnim as object}>
                    {/* No `onLayout` on this inner — once we've captured
                        the natural height in the measurement pass above,
                        re-measuring here during the animation would see
                        the CLIPPED height (the parent is mid-transition
                        between 0 and the target) and clobber
                        `measuredHeight` with that smaller value, freezing
                        the open state at one line. Single-shot measurement
                        is fine for static content; remeasuring on content
                        change is a follow-up. */}
                    <View className={cn('px-4 pt-1 pb-3')} style={innerStyle}>
                        {typeof children === 'string' ? (
                            <RNText
                                style={{
                                    color: colors.semantic.text.muted,
                                    fontFamily: colors.fontFamily.body,
                                    fontSize: px(colors.fontSize.sm),
                                    lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                                }}
                            >
                                {children}
                            </RNText>
                        ) : (
                            children
                        )}
                    </View>
                </AnimatedView>
            </AnimatedView>
        );
    }

    return (
        <View
            ref={(node: unknown) => {
                wrapperRef.current = node as HTMLElement | null;
            }}
            {...(testID !== undefined ? { testID } : {})}
            role="region"
            accessibilityRole="none"
            id={item.contentId}
            aria-labelledby={item.triggerId}
            aria-hidden={!item.open}
            className={cn('overflow-hidden', className)}
        >
            <View
                ref={(node: unknown) => {
                    innerRef.current = node as HTMLElement | null;
                }}
                className={cn('px-4 pt-1 pb-3')}
                style={innerStyle}
            >
                {typeof children === 'string' ? (
                    <RNText
                        style={{
                            color: colors.semantic.text.muted,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                            lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                        }}
                    >
                        {children}
                    </RNText>
                ) : (
                    children
                )}
            </View>
        </View>
    );
};

/**
 * Public `Accordion` value — the root function plus its `.Item`, `.Trigger`,
 * and `.Content` static members. `Object.assign` produces a value whose
 * inferred type carries the static properties, so `.d.ts` consumers can
 * write `<Accordion.Item>` without a separate import.
 */
export const Accordion = Object.assign(AccordionRoot, {
    Item: AccordionItem,
    Trigger: AccordionTrigger,
    Content: AccordionContent,
});
