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
import { Modal, Platform, Pressable, View } from 'react-native';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';

type TriggerRect = { top: number; left: number; width: number; height: number };

type PopoverContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    contentId: string;
    triggerRef: { current: HTMLElement | null };
    contentRef: { current: HTMLDivElement | null };
    triggerRect: TriggerRect | null;
    measureTrigger: () => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = (label: string): PopoverContextValue => {
    const ctx = useContext(PopoverContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Popover>.`);
    }
    return ctx;
};

export type PopoverProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Non-modal floating panel anchored to a trigger element. Use for help
 * tooltips with rich content, color pickers, or profile previews.
 *
 * Composition: `Popover` (root, owns open state), `PopoverTrigger`
 * (forwards events to its child via Slot when `asChild`), `PopoverContent`
 * (the floating surface).
 *
 * Differences from `Dialog`: non-modal — does NOT trap focus or lock
 * scroll. Tab moves outside as normal. Differences from `Tooltip`: can
 * contain interactive content (buttons, inputs, links) and dismisses on
 * outside-click + Escape rather than mouse-leave.
 *
 * Behavior:
 *   - Trigger click toggles open/close.
 *   - Click outside the content (and outside the trigger) closes.
 *   - Escape closes.
 *
 * Cross-platform: uses RN `<Modal>` as the visibility/portal primitive on
 * native (transparent backdrop, tap-outside-to-close). On web, the content
 * uses `position: fixed` + a measured trigger rect so it escapes any
 * ancestor `overflow: hidden`.
 */
export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
    const [inner, setInner] = useState<boolean>(defaultOpen);
    const isControlled = open !== undefined;
    const current = isControlled ? open : inner;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInner(next);
            }
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    const baseId = useId();
    const triggerRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Measure the trigger so the content can render with `position: fixed` +
    // computed coords. position:fixed escapes any ancestor's overflow:hidden
    // (e.g. fumadocs Tabs panes, our Preview frame), which is the single
    // biggest source of "the popup got cut off" bugs.
    const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
    const measureTrigger = useCallback(() => {
        const node = triggerRef.current;
        if (!node || typeof node.getBoundingClientRect !== 'function') {
            return;
        }
        const rect = node.getBoundingClientRect();
        setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }, []);

    const ctxValue: PopoverContextValue = {
        open: current,
        setOpen,
        contentId: `${baseId}-content`,
        triggerRef,
        contentRef,
        triggerRect,
        measureTrigger,
    };

    return <PopoverContext.Provider value={ctxValue}>{children}</PopoverContext.Provider>;
}

export type PopoverTriggerProps = {
    /** Render the child as the trigger (Slot pattern). Default true — pass `false` for an inline pressable. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Element that toggles the popover. Uses `asChild` by default so any
 * element (Button, Link, custom Pressable) becomes the trigger.
 *
 * The trigger element gets `aria-haspopup="dialog"` and `aria-expanded`
 * so assistive tech announces the relationship.
 */
export function PopoverTrigger({ asChild = true, children, className, testID }: PopoverTriggerProps) {
    const ctx = usePopoverContext('PopoverTrigger');
    const onPress = useCallback(() => {
        ctx.measureTrigger();
        ctx.setOpen(!ctx.open);
    }, [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Pass both onClick (web HTML buttons) AND onPress (RN Pressable /
        // our own Button) so the trigger fires regardless of which event
        // model the wrapped child speaks. The child's existing handler
        // runs first, then we toggle.
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            ctx.measureTrigger();
            ctx.setOpen(!ctx.open);
        };
        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    ctx.triggerRef.current = node;
                }}
                onClick={fire(child.props.onClick as ((e: unknown) => void) | undefined)}
                onPress={fire(child.props.onPress as ((e: unknown) => void) | undefined)}
                aria-haspopup="dialog"
                aria-expanded={ctx.open}
                aria-controls={ctx.contentId}
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
            onPress={onPress}
            {...({
                'aria-haspopup': 'dialog',
                'aria-expanded': ctx.open,
                'aria-controls': ctx.contentId,
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {children}
        </Pressable>
    );
}

const GAP = 4; // visual gap between trigger and content
const MIN_WIDTH = 200;

function computePosition(
    rect: TriggerRect,
    side: PopoverSide,
    align: PopoverAlign,
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

export type PopoverContentProps = {
    /** Side of the trigger to anchor on. @defaultValue 'bottom' */
    side?: PopoverSide;
    /** Alignment along the trigger edge. @defaultValue 'center' */
    align?: PopoverAlign;
    children?: ReactNode;
    className?: string;
    testID?: string;
    /** Accessible label when no visible heading is present. */
    'aria-label'?: string;
};

/**
 * The floating popover surface. Renders only while open. On web uses
 * `position: fixed` with a measured trigger rect so it escapes any
 * ancestor `overflow: hidden`. Non-modal: focus is NOT trapped inside —
 * the user can tab back out as normal.
 *
 * ARIA: `role="dialog"` (without `aria-modal`) so assistive tech
 * announces it as a grouping but doesn't suppress the rest of the page.
 */
export function PopoverContent({
    side = 'bottom',
    align = 'center',
    children,
    className,
    testID,
    ...rest
}: PopoverContentProps) {
    const ctx = usePopoverContext('PopoverContent');
    const colors = useThemeColors();
    const ariaLabel = rest['aria-label'];

    // Measure content size after first paint so we can anchor `top`-style
    // popups (which need to know content height to render above the trigger).
    const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

    // Web-only side effects: outside-click close, Escape close, re-measure
    // on resize. RN Modal handles its own dismissal on native (tap-outside
    // is the transparent overlay's onPress).
    useEffect(() => {
        if (!ctx.open) {
            return;
        }
        if (Platform.OS !== 'web') {
            return;
        }
        if (typeof document === 'undefined') {
            return;
        }

        ctx.measureTrigger();

        const onDocMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            const trigger = ctx.triggerRef.current;
            const content = ctx.contentRef.current;
            if (trigger?.contains(target)) {
                return;
            }
            if (content?.contains(target)) {
                return;
            }
            ctx.setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                ctx.setOpen(false);
            }
        };
        const onResize = () => ctx.measureTrigger();
        const onScroll = () => ctx.measureTrigger();

        document.addEventListener('mousedown', onDocMouseDown);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll, true);
        };
        // ctx is the provider's stable identity; we only care about open transitions.
    }, [ctx.open, ctx.measureTrigger, ctx.setOpen, ctx.triggerRef, ctx.contentRef]);

    // Reset measured size when popover closes so reopening re-measures fresh.
    useEffect(() => {
        if (!ctx.open) {
            setContentSize(null);
        }
    }, [ctx.open]);

    if (!ctx.open) {
        return null;
    }

    const position = ctx.triggerRect ? computePosition(ctx.triggerRect, side, align, contentSize) : null;

    const contentBaseStyle: ViewStyle = {
        minWidth: MIN_WIDTH,
        borderRadius: px(colors.radius.lg),
        borderWidth: 1,
        borderColor: colors.semantic.border.default,
        backgroundColor: colors.semantic.background.elevated,
        padding: px(colors.spacing['4']),
        ...(Platform.OS === 'web'
            ? ({
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                  // Subtle scale-in. Skipped on native (do nothing fancy there).
                  transition: 'opacity 120ms ease-out, transform 120ms ease-out',
                  transform: 'scale(1)',
                  opacity: 1,
              } as ViewStyle)
            : { elevation: 8 }),
    };

    const positionedStyle: ViewStyle =
        Platform.OS === 'web'
            ? position
                ? ({
                      position: 'fixed' as unknown as 'absolute',
                      top: position.top,
                      left: position.left,
                      zIndex: 50,
                  } as ViewStyle)
                : ({
                      // Trigger not yet measured — render off-screen for a
                      // frame to avoid a flash at (0,0).
                      position: 'fixed' as unknown as 'absolute',
                      top: -9999,
                      left: -9999,
                      zIndex: 50,
                  } as ViewStyle)
            : {};

    const content = (
        <View
            ref={(node) => {
                ctx.contentRef.current = node as unknown as HTMLDivElement | null;
                if (Platform.OS !== 'web') {
                    return;
                }
                if (!node) {
                    return;
                }
                if (typeof (node as unknown as HTMLDivElement).getBoundingClientRect !== 'function') {
                    return;
                }
                const rect = (node as unknown as HTMLDivElement).getBoundingClientRect();
                if (!contentSize || contentSize.width !== rect.width || contentSize.height !== rect.height) {
                    setContentSize({ width: rect.width, height: rect.height });
                }
            }}
            {...({
                role: 'dialog',
                id: ctx.contentId,
                ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel, accessibilityLabel: ariaLabel } : {}),
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            className={cn(
                'rounded-lg border border-semantic-border-default bg-semantic-background-elevated',
                className
            )}
            style={[contentBaseStyle, positionedStyle]}
        >
            {children}
        </View>
    );

    if (Platform.OS === 'web') {
        return content;
    }

    // Native: use Modal as the floating layer with a transparent backdrop.
    // Tap on the backdrop closes the popover.
    return (
        <Modal visible={ctx.open} transparent animationType="fade" onRequestClose={() => ctx.setOpen(false)}>
            <Pressable
                accessibilityRole="none"
                aria-hidden={true}
                onPress={() => ctx.setOpen(false)}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'transparent',
                }}
            >
                <Pressable
                    onPress={(event) => event.stopPropagation?.()}
                    style={{
                        position: 'absolute',
                        top: ctx.triggerRect
                            ? side === 'top'
                                ? Math.max(8, ctx.triggerRect.top - GAP - 80)
                                : ctx.triggerRect.top + ctx.triggerRect.height + GAP
                            : 80,
                        left: ctx.triggerRect ? Math.max(8, ctx.triggerRect.left) : 16,
                    }}
                >
                    {content}
                </Pressable>
            </Pressable>
        </Modal>
    );
}
