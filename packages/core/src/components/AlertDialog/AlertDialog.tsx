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
import { Modal, Platform, Pressable, Text as RNText, View } from 'react-native';
import { Slot } from '../../slot';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

type AlertDialogContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    titleId: string;
    descriptionId: string;
    triggerRef: { current: HTMLElement | null };
    cancelRef: { current: HTMLElement | null };
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

const useAlertDialogContext = (label: string): AlertDialogContextValue => {
    const ctx = useContext(AlertDialogContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside an <AlertDialog>.`);
    }
    return ctx;
};

export type AlertDialogProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Confirmation dialog that **forces a user response**. Use for destructive
 * or otherwise irreversible actions ("Delete project?", "Sign out everyone?").
 *
 * Differs from `Dialog` in two important ways:
 *   - The backdrop click does **not** dismiss.
 *   - The Escape key does **not** dismiss.
 *
 * The user must press `AlertDialogCancel` or `AlertDialogAction` to close.
 * Initial focus lands on Cancel — the less destructive choice — so a stray
 * Enter keypress doesn't fire the destructive action.
 *
 * For non-destructive content (forms, info, settings), prefer `Dialog` —
 * it allows Escape and click-outside to dismiss, which is the expected
 * affordance for forgettable interactions.
 */
export function AlertDialog({ open, defaultOpen = false, onOpenChange, children }: AlertDialogProps) {
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

    const baseId = useId();
    const triggerRef = useRef<HTMLElement | null>(null);
    const cancelRef = useRef<HTMLElement | null>(null);

    const ctxValue: AlertDialogContextValue = {
        open: current,
        setOpen,
        titleId: `${baseId}-title`,
        descriptionId: `${baseId}-description`,
        triggerRef,
        cancelRef,
    };

    return <AlertDialogContext.Provider value={ctxValue}>{children}</AlertDialogContext.Provider>;
}

export type AlertDialogTriggerProps = {
    /** Render the child as the trigger (Slot pattern). Default true. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Element that opens the alert dialog when activated. `asChild` by default
 * so any element (Button, Link, custom Pressable) becomes the trigger.
 */
export function AlertDialogTrigger({ asChild = true, children, className, testID }: AlertDialogTriggerProps) {
    const ctx = useAlertDialogContext('AlertDialogTrigger');
    const onPress = useCallback(() => ctx.setOpen(true), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Pass both onClick (web HTML button) and onPress (RN Pressable / our
        // own Button) so the trigger fires regardless of the wrapped child's
        // event model.
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            ctx.setOpen(true);
        };
        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    ctx.triggerRef.current = node;
                }}
                onClick={fire(child.props.onClick as ((e: unknown) => void) | undefined)}
                onPress={fire(child.props.onPress as ((e: unknown) => void) | undefined)}
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
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {children}
        </Pressable>
    );
}

// Same scrim + blur recipe as Dialog (see Dialog.tsx). 24% black + 4px
// blur leaves the page text "almost readable" behind the dialog rather
// than fully obscured. Native keeps a flat scrim — RN doesn't have
// backdrop-filter and the native shim would be an extra peer dep.
const SCRIM_COLOR = 'rgba(0, 0, 0, 0.24)';
const BLUR_AMOUNT = 4;

// Static overlay layout. The animatable scrim color + backdrop-filter
// are pushed onto the overlay's DOM ref via useEffect inside the
// component because rn-web's style filter drops keys it doesn't
// recognise as RN style props (backdropFilter, transitionProperty).
// See the Dialog backdrop-blur implementation for the same trick.
const OVERLAY_BASE_STYLE: ViewStyle = {
    position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    ...(Platform.OS === 'web' ? ({ zIndex: 50 } as ViewStyle) : { backgroundColor: SCRIM_COLOR }),
};

const CONTENT_BASE_STYLE: ViewStyle = {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    padding: 24,
    gap: 12,
    ...(Platform.OS === 'web'
        ? ({
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              // Subtle scale-in: 0.95 → 1 over 150ms. Honors prefers-reduced-motion
              // via the media query below — set as a CSS variable so the keyframe
              // can be disabled without remounting.
              animationName: 'nori-alert-dialog-in',
              animationDuration: '150ms',
              animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              animationFillMode: 'both',
          } as ViewStyle)
        : { elevation: 24 }),
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [role="button"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])';

/**
 * react-native-web renders our `<Button>` (which wraps `Pressable`) as a
 * `<div role="button">` without a tabindex. That's invisible to native focus
 * APIs in browsers AND jsdom. Poke a `tabindex="0"` onto the node so
 * `.focus()` actually sets `document.activeElement`.
 *
 * Idempotent — only sets it when missing.
 */
function ensureFocusable(node: HTMLElement | null): void {
    if (!node) return;
    if (node.hasAttribute('tabindex')) return;
    node.setAttribute('tabindex', '0');
}

const KEYFRAMES_STYLE_ID = 'nori-alert-dialog-keyframes';
const KEYFRAMES_CSS = `
@keyframes nori-alert-dialog-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  [data-nori-alert-dialog-content] { animation: none !important; }
}
`;

function ensureKeyframesInjected(): void {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_STYLE_ID;
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
}

export type AlertDialogContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * The visible alert dialog surface — overlay + centered card. Renders only
 * while open. On web: traps focus inside, locks body scroll, restores focus
 * on close. Crucially, neither overlay click nor Escape closes — the user
 * MUST press an explicit Cancel/Action button.
 */
export function AlertDialogContent({ children, className, testID }: AlertDialogContentProps) {
    const ctx = useAlertDialogContext('AlertDialogContent');
    const colors = useThemeColors();
    const contentRef = useRef<HTMLDivElement | null>(null);
    const overlayDomRef = useRef<HTMLElement | null>(null);
    // Two-phase mount: render overlay at scrim 0 / blur 0 first, then
    // flip to target values on the next frame so CSS transitions have a
    // start state to interpolate from. Same pattern as Dialog.
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (Platform.OS !== 'web') {
            setEntered(true);
            return;
        }
        if (!ctx.open) {
            setEntered(false);
            return;
        }
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, [ctx.open]);

    // Animated scrim + backdrop-filter — pushed onto the overlay's DOM
    // node directly because rn-web's style filter drops the
    // transition/backdrop-filter keys when passed via the View's `style`
    // prop. Web only; native uses the flat scrim baked into
    // OVERLAY_BASE_STYLE.
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const node = overlayDomRef.current;
        if (!node) return;
        node.style.transitionProperty = 'background-color, backdrop-filter, -webkit-backdrop-filter';
        node.style.transitionDuration = '150ms, 200ms, 200ms';
        node.style.transitionTimingFunction = 'ease-out';
        if (entered) {
            node.style.backgroundColor = SCRIM_COLOR;
            node.style.backdropFilter = `blur(${BLUR_AMOUNT}px)`;
            node.style.setProperty('-webkit-backdrop-filter', `blur(${BLUR_AMOUNT}px)`);
        } else {
            node.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            node.style.backdropFilter = 'blur(0px)';
            node.style.setProperty('-webkit-backdrop-filter', 'blur(0px)');
        }
    }, [entered]);

    useEffect(() => {
        if (!ctx.open) return;
        if (Platform.OS !== 'web') return;
        if (typeof document === 'undefined') return;

        ensureKeyframesInjected();

        const previouslyFocused = document.activeElement as HTMLElement | null;

        // Lock body scroll. Preserve the previous inline value so we don't
        // clobber a consumer-set lock.
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Initial focus: prefer the Cancel button (least destructive default).
        // Fall back to first focusable. Only fall back to the container if
        // there's nothing focusable at all (an alertdialog with no actions
        // is a misuse — we still want it to receive keydown for the trap).
        const focusInitial = () => {
            const node = contentRef.current;
            if (!node) return;
            // Make every focusable target reachable up front. RN-Web Pressables
            // render as `<div role="button">` without tabindex; without this
            // poke, programmatic `.focus()` on them is a no-op.
            const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            for (const el of focusable) ensureFocusable(el);
            const cancel = ctx.cancelRef.current;
            if (cancel?.focus) {
                ensureFocusable(cancel);
                cancel.focus();
                return;
            }
            const first = focusable[0];
            if (first) {
                first.focus();
            } else {
                node.setAttribute('tabindex', '-1');
                node.focus();
            }
        };
        focusInitial();

        // Focus trap only — Escape does NOT close (alert dialog contract).
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;
            const node = contentRef.current;
            if (!node) return;
            // Don't filter by `offsetParent` here: jsdom always reports `null`
            // for it (no layout engine), which would collapse the trap to the
            // currently focused element only. AlertDialog's content surface is
            // tightly controlled; trust the selector.
            const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) return;
            // Make every focusable target reachable from jsdom too.
            for (const el of focusable) ensureFocusable(el);
            if (event.shiftKey) {
                if (document.activeElement === first || !node.contains(document.activeElement)) {
                    event.preventDefault();
                    last.focus();
                }
            } else if (document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevBodyOverflow;
            const restoreTo = ctx.triggerRef.current ?? previouslyFocused;
            restoreTo?.focus?.();
        };
    }, [ctx.open, ctx.triggerRef, ctx.cancelRef]);

    // RN Modal's `onRequestClose` fires on Android hardware back. We
    // intentionally make it a no-op: an alert dialog cannot be backed out
    // of without an explicit choice. A consumer that needs Android back to
    // mean "cancel" should wire it via their own action.
    const onRequestClose = useCallback(() => {
        /* intentional no-op — alert dialog requires explicit action */
    }, []);

    return (
        <Modal
            visible={ctx.open}
            transparent
            // Web: 'none' so RN's built-in fade doesn't fight our own
            // overlay/content transitions (its layer-level fade caused
            // backdrop-filter to "snap in" at the end on Dialog — same
            // failure mode applies here). Native keeps 'fade' since we
            // have no CSS transition path there.
            animationType={Platform.OS === 'web' ? 'none' : 'fade'}
            onRequestClose={onRequestClose}
        >
            <View
                ref={(node) => {
                    overlayDomRef.current = node as unknown as HTMLElement | null;
                }}
                accessibilityRole="none"
                aria-hidden={true}
                style={OVERLAY_BASE_STYLE}
                // Note: this is a <View>, not a <Pressable>. The overlay must NOT
                // dismiss on click for an alert dialog.
            >
                <View
                    ref={(node) => {
                        contentRef.current = node as unknown as HTMLDivElement | null;
                    }}
                    role="alertdialog"
                    accessibilityRole="alert"
                    aria-modal={true}
                    aria-labelledby={ctx.titleId}
                    aria-describedby={ctx.descriptionId}
                    {...(testID !== undefined ? { testID } : {})}
                    {...({ 'data-nori-alert-dialog-content': 'true' } as Record<string, string>)}
                    className={cn('w-full max-w-md rounded-xl bg-semantic-background-elevated p-6 gap-3', className)}
                    style={[CONTENT_BASE_STYLE, { backgroundColor: colors.semantic.background.elevated }]}
                >
                    <View className="flex-col gap-1.5" style={{ flexDirection: 'column', gap: 6 }}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export type AlertDialogTextProps = {
    children?: ReactNode;
    className?: string;
};

/** Heading inside AlertDialogContent. Wires `aria-labelledby`. */
export function AlertDialogTitle({ children, className }: AlertDialogTextProps) {
    const ctx = useAlertDialogContext('AlertDialogTitle');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.titleId}
            id={ctx.titleId}
            role="heading"
            aria-level={2}
            className={cn('text-lg font-semibold text-semantic-text-default', className)}
            style={{ color: colors.semantic.text.default, fontSize: 18, fontWeight: '600' }}
        >
            {children}
        </RNText>
    );
}

/** Body description inside AlertDialogContent. Wires `aria-describedby`. */
export function AlertDialogDescription({ children, className }: AlertDialogTextProps) {
    const ctx = useAlertDialogContext('AlertDialogDescription');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.descriptionId}
            id={ctx.descriptionId}
            className={cn('text-sm text-semantic-text-muted', className)}
            style={{ color: colors.semantic.text.muted, fontSize: 14, lineHeight: 20 }}
        >
            {children}
        </RNText>
    );
}

export type AlertDialogActionProps = {
    /** Render the child as the action (Slot pattern). Default true. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
    /** Forwarded to the wrapped child / fallback Pressable. Fires before close. */
    onPress?: (event?: unknown) => void;
};

/**
 * The destructive / confirming action. Closes the dialog AND forwards
 * `onPress` to the consumer's handler so they can run the side effect.
 */
export function AlertDialogAction({ asChild = true, children, className, testID, onPress }: AlertDialogActionProps) {
    const ctx = useAlertDialogContext('AlertDialogAction');
    const handle = useCallback(
        (event?: unknown) => {
            onPress?.(event);
            ctx.setOpen(false);
        },
        [ctx, onPress]
    );

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Wrap both event names so an HTML button (onClick) and an RN
        // Pressable / Button (onPress) both fire — and both still call the
        // child's own handler if present.
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            handle(event);
        };
        return (
            <Slot
                onClick={fire(child.props.onClick as ((e: unknown) => void) | undefined)}
                onPress={fire(child.props.onPress as ((e: unknown) => void) | undefined)}
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {child}
            </Slot>
        );
    }

    return (
        <Pressable
            onPress={handle}
            role="button"
            accessibilityRole="button"
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {children}
        </Pressable>
    );
}

export type AlertDialogCancelProps = {
    /** Render the child as the cancel button (Slot pattern). Default true. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
    /** Forwarded to the wrapped child / fallback Pressable. Fires before close. */
    onPress?: (event?: unknown) => void;
};

/**
 * The cancel / dismiss action. Closes the dialog AND forwards `onPress`.
 * Receives initial focus inside `AlertDialogContent` — Cancel is the
 * least destructive default, so a stray Enter keypress can't fire the
 * destructive action.
 */
export function AlertDialogCancel({ asChild = true, children, className, testID, onPress }: AlertDialogCancelProps) {
    const ctx = useAlertDialogContext('AlertDialogCancel');
    const handle = useCallback(
        (event?: unknown) => {
            onPress?.(event);
            ctx.setOpen(false);
        },
        [ctx, onPress]
    );

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            handle(event);
        };
        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    ctx.cancelRef.current = node;
                }}
                onClick={fire(child.props.onClick as ((e: unknown) => void) | undefined)}
                onPress={fire(child.props.onPress as ((e: unknown) => void) | undefined)}
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
                ctx.cancelRef.current = node as unknown as HTMLElement | null;
            }}
            onPress={handle}
            role="button"
            accessibilityRole="button"
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {children}
        </Pressable>
    );
}

export type AlertDialogFooterProps = {
    children?: ReactNode;
    className?: string;
};

/** Convenience row for action buttons (right-aligned). */
export function AlertDialogFooter({ children, className }: AlertDialogFooterProps) {
    return (
        <View
            className={cn('mt-4 flex-row items-center justify-end gap-2', className)}
            style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
            }}
        >
            {children}
        </View>
    );
}
