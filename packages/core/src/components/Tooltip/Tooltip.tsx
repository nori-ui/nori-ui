'use client';

import {
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

type TriggerRect = { top: number; left: number; width: number; height: number };

type TooltipContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    /** Open after `delayMs` if still hovered/focused. */
    requestOpen: () => void;
    /** Close after `closeDelayMs`; cancellable. */
    requestClose: () => void;
    /** Cancel any pending open/close timers (e.g. when re-entering). */
    cancelTimers: () => void;
    contentId: string;
    triggerRef: { current: HTMLElement | null };
    contentRef: { current: HTMLDivElement | null };
    triggerRect: TriggerRect | null;
    measureTrigger: () => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

const useTooltipContext = (label: string): TooltipContextValue => {
    const ctx = useContext(TooltipContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Tooltip>.`);
    }
    return ctx;
};

const DEFAULT_OPEN_DELAY_MS = 500;
const DEFAULT_CLOSE_DELAY_MS = 0;
/** Long-press duration on native — matches platform defaults (iOS ~500ms). */
const LONG_PRESS_MS = 500;

export type TooltipProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Delay before the tooltip opens after hover/focus.
     * @defaultValue 500
     */
    delayMs?: number;
    /**
     * Delay before the tooltip closes after hover-out / blur. Useful for
     * giving users time to move into the tooltip if it ever becomes
     * interactive (it shouldn't — use Popover for that — but the knob is
     * here so the API matches Radix).
     * @defaultValue 0
     */
    closeDelayMs?: number;
    children?: ReactNode;
};

/**
 * Small floating label triggered by hover (web) or long-press (native).
 * Use for short contextual hints — most often on icon-only buttons. NOT
 * for rich interactive content; reach for `Popover` when the surface
 * needs to hold buttons, inputs, or links.
 *
 * Composition: `Tooltip` (root, owns open state and timers),
 * `TooltipTrigger` (forwards events to its child via Slot when
 * `asChild`), `TooltipContent` (the floating label).
 *
 * Accessibility: the trigger gets `aria-describedby` pointing at the
 * content id — tooltips augment the trigger's accessible name, they do
 * NOT replace it. The icon-only button still needs an `aria-label`.
 *
 * Behavior:
 *   - Open on hover (web mouseover) or focus, after `delayMs`.
 *   - Close on hover-out, blur, or Escape.
 *   - Native: long-press the trigger (500ms) to reveal; tap-anywhere or
 *     re-press to dismiss.
 *
 * Cross-platform: web renders the content inline with `position: fixed`
 * + a measured trigger rect so it escapes any ancestor `overflow:
 * hidden`. Native renders inline with `position: absolute` — the parent
 * needs to allow overflow for the chip to peek out.
 */
export function Tooltip({
    open,
    defaultOpen = false,
    onOpenChange,
    delayMs = DEFAULT_OPEN_DELAY_MS,
    closeDelayMs = DEFAULT_CLOSE_DELAY_MS,
    children,
}: TooltipProps) {
    const [inner, setInner] = useState<boolean>(defaultOpen);
    const isControlled = open !== undefined;
    const current = isControlled ? open : inner;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) setInner(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    // Open / close timers. Both are cleared on unmount and on every new
    // request — so rapid hover-in / hover-out doesn't leave a stale timer
    // about to flip state after the user has moved on.
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelTimers = useCallback(() => {
        if (openTimer.current) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const requestOpen = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        if (openTimer.current) return;
        if (delayMs <= 0) {
            setOpen(true);
            return;
        }
        openTimer.current = setTimeout(() => {
            openTimer.current = null;
            setOpen(true);
        }, delayMs);
    }, [delayMs, setOpen]);

    const requestClose = useCallback(() => {
        if (openTimer.current) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
        if (closeTimer.current) return;
        if (closeDelayMs <= 0) {
            setOpen(false);
            return;
        }
        closeTimer.current = setTimeout(() => {
            closeTimer.current = null;
            setOpen(false);
        }, closeDelayMs);
    }, [closeDelayMs, setOpen]);

    useEffect(() => () => cancelTimers(), [cancelTimers]);

    const baseId = useId();
    const triggerRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Measure the trigger so the content can render with `position: fixed` +
    // computed coords. position:fixed escapes any ancestor's overflow:hidden
    // (e.g. fumadocs Tabs panes, our Preview frame), which is the single
    // biggest source of "the tooltip got cut off" bugs.
    const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
    const measureTrigger = useCallback(() => {
        const node = triggerRef.current;
        if (!node || typeof node.getBoundingClientRect !== 'function') return;
        const rect = node.getBoundingClientRect();
        setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }, []);

    const ctxValue: TooltipContextValue = {
        open: current,
        setOpen,
        requestOpen,
        requestClose,
        cancelTimers,
        contentId: `${baseId}-content`,
        triggerRef,
        contentRef,
        triggerRect,
        measureTrigger,
    };

    return <TooltipContext.Provider value={ctxValue}>{children}</TooltipContext.Provider>;
}

export type TooltipTriggerProps = {
    /** Render the child as the trigger (Slot pattern). Default true — pass `false` for an inline pressable. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Element that reveals the tooltip. Uses `asChild` by default so any
 * element (Button, IconButton, custom Pressable) becomes the trigger.
 *
 * Wires `aria-describedby` to the content's id — assistive tech reads
 * the tooltip text in addition to the trigger's own accessible name.
 *
 * Web: opens on `mouseEnter` and `focus`; closes on `mouseLeave` and
 * `blur`, both honoring the configured delays. Native: opens on
 * `onLongPress` (500ms hold) and closes on the next press anywhere.
 */
export function TooltipTrigger({ asChild = true, children, className, testID }: TooltipTriggerProps) {
    const ctx = useTooltipContext('TooltipTrigger');

    const handleMouseEnter = useCallback(() => {
        ctx.measureTrigger();
        ctx.requestOpen();
    }, [ctx]);
    const handleMouseLeave = useCallback(() => {
        ctx.requestClose();
    }, [ctx]);
    const handleFocus = useCallback(() => {
        ctx.measureTrigger();
        ctx.requestOpen();
    }, [ctx]);
    const handleBlur = useCallback(() => {
        ctx.requestClose();
    }, [ctx]);
    const handleLongPress = useCallback(() => {
        ctx.measureTrigger();
        ctx.setOpen(true);
    }, [ctx]);
    const handlePress = useCallback(() => {
        // Native: tap (after a long-press has revealed it) dismisses.
        if (Platform.OS !== 'web' && ctx.open) ctx.setOpen(false);
    }, [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Compose the wrapped child's existing handlers with ours so any
        // app-level onClick / onFocus / onPress still fires. The tooltip
        // event runs AFTER the child's so consumer code wins on conflict.
        const compose =
            <T,>(existing: ((e: T) => void) | undefined, next: (e: T) => void) =>
            (event: T) => {
                existing?.(event);
                next(event);
            };
        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    ctx.triggerRef.current = node;
                }}
                onMouseEnter={compose(child.props.onMouseEnter as ((e: unknown) => void) | undefined, handleMouseEnter)}
                onMouseLeave={compose(child.props.onMouseLeave as ((e: unknown) => void) | undefined, handleMouseLeave)}
                onFocus={compose(child.props.onFocus as ((e: unknown) => void) | undefined, handleFocus)}
                onBlur={compose(child.props.onBlur as ((e: unknown) => void) | undefined, handleBlur)}
                {...(Platform.OS !== 'web'
                    ? {
                          onLongPress: compose(
                              child.props.onLongPress as ((e: unknown) => void) | undefined,
                              handleLongPress
                          ),
                          onPress: compose(child.props.onPress as ((e: unknown) => void) | undefined, handlePress),
                          delayLongPress: LONG_PRESS_MS,
                      }
                    : {})}
                aria-describedby={ctx.open ? ctx.contentId : undefined}
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {child}
            </Slot>
        );
    }

    return (
        <Pressable
            ref={(node) => {
                ctx.triggerRef.current = node as unknown as HTMLElement | null;
            }}
            {...(Platform.OS !== 'web'
                ? { onLongPress: handleLongPress, onPress: handlePress, delayLongPress: LONG_PRESS_MS }
                : {})}
            {...({
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave,
                onFocus: handleFocus,
                onBlur: handleBlur,
                'aria-describedby': ctx.open ? ctx.contentId : undefined,
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {children}
        </Pressable>
    );
}

const GAP = 4; // visual gap between trigger and content
const MIN_WIDTH = 0; // tooltips hug their text — no enforced minimum

function computePosition(
    rect: TriggerRect,
    side: TooltipSide,
    align: TooltipAlign,
    contentSize: { width: number; height: number } | null
): { top: number; left: number } {
    const cw = contentSize?.width ?? MIN_WIDTH;
    const ch = contentSize?.height ?? 0;

    let top = 0;
    let left = 0;

    switch (side) {
        case 'top':
            top = rect.top - GAP - ch;
            break;
        case 'bottom':
            top = rect.top + rect.height + GAP;
            break;
        case 'left':
            left = rect.left - GAP - cw;
            break;
        case 'right':
            left = rect.left + rect.width + GAP;
            break;
    }

    if (side === 'top' || side === 'bottom') {
        switch (align) {
            case 'start':
                left = rect.left;
                break;
            case 'center':
                left = rect.left + rect.width / 2 - cw / 2;
                break;
            case 'end':
                left = rect.left + rect.width - cw;
                break;
        }
    } else {
        switch (align) {
            case 'start':
                top = rect.top;
                break;
            case 'center':
                top = rect.top + rect.height / 2 - ch / 2;
                break;
            case 'end':
                top = rect.top + rect.height - ch;
                break;
        }
    }

    return { top, left };
}

export type TooltipContentProps = {
    /** Side of the trigger to anchor on. @defaultValue 'top' */
    side?: TooltipSide;
    /** Alignment along the trigger edge. @defaultValue 'center' */
    align?: TooltipAlign;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * The floating tooltip surface. Renders only while open. On web uses
 * `position: fixed` with a measured trigger rect so it escapes any
 * ancestor `overflow: hidden`.
 *
 * ARIA: `role="tooltip"` plus a unique id that the trigger's
 * `aria-describedby` points at.
 */
export function TooltipContent({ side = 'top', align = 'center', children, className, testID }: TooltipContentProps) {
    const ctx = useTooltipContext('TooltipContent');
    const colors = useThemeColors();

    // Measure content size after first paint so we can anchor `top`-side
    // tooltips (which need to know content height to render above the trigger).
    const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

    // Direct DOM ref for the entrance animation. We poke `transform`,
    // `opacity`, and `transition` straight onto node.style instead of
    // passing them through `<View style>`, because rn-web's style filter
    // drops keys it doesn't recognize as RN style props (`transitionProperty`,
    // `transitionDuration`, etc.) — so any style fragment containing them
    // gets discarded entirely. Same pattern as the Dialog backdrop-blur fix.
    const domRef = useRef<HTMLDivElement | null>(null);
    const [entered, setEntered] = useState(false);

    // Web-only: Escape closes. Re-measure trigger on resize/scroll so the
    // chip stays anchored during page motion.
    useEffect(() => {
        if (!ctx.open) return;
        if (Platform.OS !== 'web') return;
        if (typeof document === 'undefined') return;

        ctx.measureTrigger();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                ctx.setOpen(false);
            }
        };
        const onResize = () => ctx.measureTrigger();
        const onScroll = () => ctx.measureTrigger();

        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [ctx.open, ctx.measureTrigger, ctx.setOpen]);

    // Reset measured size and entrance flag when tooltip closes so a
    // reopen re-measures and re-animates fresh.
    useEffect(() => {
        if (!ctx.open) {
            setContentSize(null);
            setEntered(false);
        }
    }, [ctx.open]);

    // Entrance animation. On the first paint we render at scale(0.95) +
    // opacity 0; the next frame we flip the styles to scale(1) + opacity
    // 1, and the CSS transition handles the in-between. Web only —
    // native renders without animation (an animated mount on RN would
    // require Reanimated for negligible visual gain on a hint chip).
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (!ctx.open) return;
        const node = domRef.current;
        if (!node) return;
        // Initial values — explicitly set so the first frame is at the
        // pre-entrance state regardless of inherited styles.
        node.style.transformOrigin = 'center';
        node.style.transitionProperty = 'opacity, transform';
        node.style.transitionDuration = '100ms';
        node.style.transitionTimingFunction = 'ease-out';
        node.style.opacity = entered ? '1' : '0';
        node.style.transform = entered ? 'scale(1)' : 'scale(0.95)';
    }, [ctx.open, entered]);

    // Kick off the transition on the next frame after mount.
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (!ctx.open) return;
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, [ctx.open]);

    if (!ctx.open) return null;

    const position = ctx.triggerRect ? computePosition(ctx.triggerRect, side, align, contentSize) : null;

    const contentBaseStyle: ViewStyle = {
        borderRadius: px(colors.radius.md),
        backgroundColor: colors.semantic.text.default,
        paddingVertical: px(colors.spacing['2']) - 2, // closest theme-rooted approximation of legacy 6
        paddingHorizontal: px(colors.spacing['2']),
        ...(Platform.OS === 'web'
            ? ({
                  boxShadow: '0 4px 6px -2px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)',
              } as ViewStyle)
            : { elevation: 4 }),
    };

    const positionedStyle: ViewStyle =
        Platform.OS === 'web'
            ? position
                ? ({
                      position: 'fixed' as unknown as 'absolute',
                      top: position.top,
                      left: position.left,
                      zIndex: 60,
                  } as ViewStyle)
                : ({
                      // Trigger not yet measured — render off-screen for a
                      // frame to avoid a flash at (0,0).
                      position: 'fixed' as unknown as 'absolute',
                      top: -9999,
                      left: -9999,
                      zIndex: 60,
                  } as ViewStyle)
            : ({
                  // Native: rely on the parent allowing overflow. We anchor
                  // by absolute positioning relative to wherever the
                  // tooltip is mounted in the tree (typically right next
                  // to the trigger).
                  position: 'absolute',
                  top: position?.top ?? 0,
                  left: position?.left ?? 0,
              } as ViewStyle);

    return (
        <View
            ref={(node) => {
                ctx.contentRef.current = node as unknown as HTMLDivElement | null;
                domRef.current = node as unknown as HTMLDivElement | null;
                if (Platform.OS !== 'web') return;
                if (!node) return;
                if (typeof (node as unknown as HTMLDivElement).getBoundingClientRect !== 'function') return;
                const rect = (node as unknown as HTMLDivElement).getBoundingClientRect();
                if (!contentSize || contentSize.width !== rect.width || contentSize.height !== rect.height) {
                    setContentSize({ width: rect.width, height: rect.height });
                }
            }}
            {...({
                role: 'tooltip',
                id: ctx.contentId,
                // Don't soak up pointer events — hovering the tooltip
                // itself should NOT block the trigger's mouse-leave from
                // firing. Tooltips are presentational; if you need
                // interactivity, reach for Popover.
                pointerEvents: 'none',
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            className={cn('rounded-md', className)}
            style={[contentBaseStyle, positionedStyle]}
        >
            <RNText
                className="text-xs"
                style={{
                    color: colors.semantic.text.inverted,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.tight),
                }}
            >
                {children}
            </RNText>
        </View>
    );
}
