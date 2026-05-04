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
import { Modal, Platform, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { BlurBackdrop } from './blur-backdrop';

type DialogContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    titleId: string;
    descriptionId: string;
    triggerRef: { current: HTMLElement | null };
};

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = (label: string): DialogContextValue => {
    const ctx = useContext(DialogContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Dialog>.`);
    }
    return ctx;
};

export type DialogProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Modal dialog. Owns open state and provides context for `DialogTrigger`,
 * `DialogContent`, `DialogTitle`, `DialogDescription`, and `DialogClose`.
 *
 * Behavior:
 *   - Click the trigger to open. Click outside the content, press Escape,
 *     or click an explicit close to dismiss.
 *   - Focus is trapped inside the content while open (web). On close, focus
 *     returns to whatever opened the dialog.
 *   - Background scrolling is locked while open (web).
 *
 * Cross-platform: uses RN `<Modal>` as the visibility/portal primitive. On
 * web, additional focus-trap / scroll-lock / Escape-key effects layer on
 * top via the platform check inside `DialogContent`.
 */
function DialogRoot({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
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

    const ctxValue: DialogContextValue = {
        open: current,
        setOpen,
        titleId: `${baseId}-title`,
        descriptionId: `${baseId}-description`,
        triggerRef,
    };

    return <DialogContext.Provider value={ctxValue}>{children}</DialogContext.Provider>;
}

export type DialogTriggerProps = {
    /** Render the child as the trigger (Slot pattern). Default true — pass `false` for an inline button. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Element that opens the dialog when activated. Uses `asChild` by default so
 * any element (Button, Link, custom Pressable) becomes the trigger.
 */
function DialogTrigger({ asChild = true, children, className, testID }: DialogTriggerProps) {
    const ctx = useDialogContext('DialogTrigger');
    const onPress = useCallback(() => ctx.setOpen(true), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Pass both onClick (web HTML buttons) AND onPress (RN Pressable /
        // our own Button) so the trigger fires regardless of which event
        // model the wrapped child speaks. The child's existing handler
        // runs first, then we open.
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
            {wrapStringChildren(children)}
        </Pressable>
    );
}

// On native, raw strings rendered as children of a non-Text component
// throw "Text strings must be rendered within a <Text> component". On
// web, react-native-web silently tolerates it. Wrap any string/number
// children in an RNText so the same JSX renders cleanly on both
// platforms. Non-string children are passed through unchanged.
function wrapStringChildren(children: ReactNode): ReactNode {
    if (typeof children === 'string' || typeof children === 'number') {
        return <RNText>{children}</RNText>;
    }
    return children;
}

// Scrim + blur target values — applied at the entered state on web,
// always on as a flat scrim on native (RN doesn't have backdrop-filter
// and the native shim would be an extra peer dep for vanishingly little
// visual gain on a v0 component).
// 24% scrim + 4px blur — strong enough to push the page back but the
// content underneath is still legible. Earlier 32%/8px felt like a frosted
// glass slab that completely obscured the page; this lets the page show
// through as "behind glass, slightly out of focus."
const SCRIM_COLOR = 'rgba(0, 0, 0, 0.24)';
const BLUR_AMOUNT = 4;

// Static overlay layout — alignment, fixed positioning. The animatable
// bits (scrim color, backdrop-filter blur) live in a useEffect inside
// the component that pokes them onto the DOM ref directly so rn-web's
// style filter can't strip the non-RN keys (backdropFilter,
// transitionProperty). On web the styles start at blur(0px) +
// transparent and transition to the target values on the next frame.
//
// Why not put blur(8px) here as a constant: when blur is applied to a
// layer that's mid-fade (e.g. RN Modal's animationType="fade" fades
// opacity from 0 → 1), Safari and Chromium GPU-composite the layer
// without rendering backdrop-filter — so the blur appears to "snap in"
// at the end of the fade. Animating blur explicitly via our own
// transition (and disabling the Modal's fade on web) avoids the snap.
const OVERLAY_LAYOUT_BASE: ViewStyle = {
    position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // On native the BlurBackdrop sibling renders BEHIND this overlay and
    // already provides dim + frosted-glass via expo-blur's `tint`/`intensity`.
    // Painting SCRIM_COLOR on top would mask the blur entirely (the user
    // sees only a flat tint), so the overlay stays transparent and the
    // BlurView is the dominant visual on native.
    ...(Platform.OS === 'web' ? ({ zIndex: 50 } as ViewStyle) : { backgroundColor: 'transparent' }),
};

// Layout / animation only — theme-driven dimensions are merged inside
// DialogContent below.
const CONTENT_LAYOUT_BASE: ViewStyle = {
    width: '100%',
    maxWidth: 480, // component-density literal — not from theme
    ...(Platform.OS === 'web'
        ? ({
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          } as ViewStyle)
        : { elevation: 24 }),
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type DialogContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * The visible dialog surface — overlay + centered card. Renders only when
 * the parent `Dialog` is open. On web: traps focus inside, locks body
 * scroll, and dismisses on Escape or overlay click.
 */
function DialogContent({ children, className, testID }: DialogContentProps) {
    const ctx = useDialogContext('DialogContent');
    const colors = useThemeColors();
    const scheme = useColorScheme();
    const contentRef = useRef<HTMLDivElement | null>(null);
    const overlayStyle: ViewStyle = {
        ...OVERLAY_LAYOUT_BASE,
        padding: px(colors.spacing['4']),
    };
    const contentStyle: ViewStyle = {
        ...CONTENT_LAYOUT_BASE,
        borderRadius: px(colors.radius.xl),
        padding: px(colors.spacing['6']),
        gap: px(colors.spacing['3']),
    };
    // Scale-in: render at scale(0.96) + opacity 0 first, flip to 1 in a
    // useEffect so the CSS transition has a frame to animate from. Web
    // only; native uses `Modal animationType="fade"` which is enough.
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
    const enterStyle: ViewStyle =
        Platform.OS === 'web'
            ? ({
                  opacity: entered ? 1 : 0,
                  transform: [{ scale: entered ? 1 : 0.96 }],
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '150ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              } as ViewStyle)
            : {};

    // Overlay's scrim + backdrop-filter share the same `entered` flag as
    // the content card, so the blur starts at 0 and the scrim at 0% on
    // the first paint, then both transition to their target values at the
    // next frame — same 150ms curve as the card. The blur duration is
    // bumped slightly (200ms) so it lands a hair AFTER the scrim instead
    // of slamming to full strength immediately, which reads more natural.
    //
    // We reach for a direct DOM ref + .style assignments here rather than
    // pass the styles through `<Pressable style={...}>`. Reason: rn-web's
    // style filter drops keys it doesn't recognize as RN style props —
    // and `backdropFilter`, `transitionProperty`, etc. fall through that
    // filter, taking the whole style fragment with them. Native gets a
    // flat scrim with no blur; RN doesn't have backdrop-filter and the
    // native shim would be an extra peer dep for negligible gain.
    const overlayDomRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const node = overlayDomRef.current;
        if (!node) {
            return;
        }
        // First paint: kick off transparent + zero blur so the next
        // assignment animates from 0 to target. We only need this on
        // the very first frame — the inline style on second frame
        // overwrites these.
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

    // Web-only side effects: focus trap, scroll lock, Escape close,
    // initial focus on the first focusable inside the dialog. RN Modal
    // handles its own focus model on native, so the platform check keeps
    // these out of the native render path.
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

        const previouslyFocused = document.activeElement as HTMLElement | null;

        // Lock body scroll. Preserve any previously set inline style so
        // we don't accidentally clobber a consumer's lock from elsewhere.
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Move focus into the dialog. Prefer the first focusable element;
        // if there isn't one, focus the dialog container itself so it
        // receives the keydown events.
        const focusFirst = () => {
            const node = contentRef.current;
            if (!node) {
                return;
            }
            const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            const first = focusable[0];
            if (first) {
                first.focus();
            } else {
                node.setAttribute('tabindex', '-1');
                node.focus();
            }
        };
        focusFirst();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                ctx.setOpen(false);
                return;
            }
            if (event.key !== 'Tab') {
                return;
            }
            const node = contentRef.current;
            if (!node) {
                return;
            }
            const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
                (el) => el.offsetParent !== null || el === document.activeElement
            );
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) {
                return;
            }
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
            // Restore focus to whatever opened the dialog (the trigger),
            // falling back to the previously focused node if the trigger
            // is gone.
            const restoreTo = ctx.triggerRef.current ?? previouslyFocused;
            restoreTo?.focus?.();
        };
    }, [ctx.open, ctx.setOpen, ctx.triggerRef]);

    const onOverlayPress = useCallback(() => ctx.setOpen(false), [ctx]);

    return (
        <Modal
            visible={ctx.open}
            transparent
            // Web: 'none' so RN's built-in fade doesn't fight our own
            // overlay/content transitions (its layer-level fade caused
            // backdrop-filter to "snap in" at the end). Native: 'fade'
            // is what users expect on iOS/Android and we don't have a
            // CSS transition path there anyway.
            animationType={Platform.OS === 'web' ? 'none' : 'fade'}
            onRequestClose={() => ctx.setOpen(false)}
        >
            {/* Native blur layer. Renders nothing on web (the overlay's
                CSS backdrop-filter handles it) and renders nothing if
                expo-blur isn't installed (graceful degrade — the scrim
                Pressable below still dims the background). */}
            <BlurBackdrop intensity={60} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <Pressable
                accessibilityRole="none"
                aria-hidden={true}
                ref={(node) => {
                    overlayDomRef.current = node as unknown as HTMLElement | null;
                }}
                style={overlayStyle}
                onPress={onOverlayPress}
            >
                <Pressable
                    onPress={(event) => event.stopPropagation?.()}
                    ref={(node) => {
                        contentRef.current = node as unknown as HTMLDivElement | null;
                    }}
                    role="dialog"
                    accessibilityRole="none"
                    aria-modal={true}
                    aria-labelledby={ctx.titleId}
                    aria-describedby={ctx.descriptionId}
                    {...(testID !== undefined ? { testID } : {})}
                    className={cn('w-full max-w-md rounded-xl bg-semantic-background-elevated p-6 gap-3', className)}
                    style={[contentStyle, { backgroundColor: colors.semantic.background.elevated }, enterStyle]}
                >
                    <View
                        className="flex-col gap-1.5"
                        style={{ flexDirection: 'column', gap: px(colors.spacing['2']) - 2 }}
                    >
                        {children}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export type DialogTextProps = {
    children?: ReactNode;
    className?: string;
};

/** Heading inside DialogContent. Wires `aria-labelledby`. */
function DialogTitle({ children, className }: DialogTextProps) {
    const ctx = useDialogContext('DialogTitle');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.titleId}
            id={ctx.titleId}
            role="heading"
            aria-level={2}
            className={cn('text-lg font-semibold text-semantic-text-default', className)}
            style={{
                color: colors.semantic.text.default,
                fontFamily: colors.fontFamily.display,
                fontSize: px(colors.fontSize.lg),
                fontWeight: colors.fontWeight.semibold as '600',
            }}
        >
            {children}
        </RNText>
    );
}

/** Subtitle / description inside DialogContent. Wires `aria-describedby`. */
function DialogDescription({ children, className }: DialogTextProps) {
    const ctx = useDialogContext('DialogDescription');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.descriptionId}
            id={ctx.descriptionId}
            className={cn('text-sm text-semantic-text-muted', className)}
            style={{
                color: colors.semantic.text.muted,
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
            }}
        >
            {children}
        </RNText>
    );
}

export type DialogCloseProps = {
    /** Render the child as the close button (Slot pattern). Default true. */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
    accessibilityLabel?: string;
};

/**
 * Element that closes the dialog when activated. With `asChild` (default),
 * wraps the child. Without `asChild`, renders a default ✕ button — useful
 * for the canonical top-right corner close.
 */
function DialogClose({ asChild = true, children, className, testID, accessibilityLabel = 'Close' }: DialogCloseProps) {
    const ctx = useDialogContext('DialogClose');
    const colors = useThemeColors();
    const onPress = useCallback(() => ctx.setOpen(false), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        // Same dual-event story as DialogTrigger: pass both onClick (web
        // button) and onPress (RN Pressable / our own Button) so the
        // wrapped element fires regardless of its event model.
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            ctx.setOpen(false);
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

    if (children !== undefined) {
        return (
            <Pressable
                onPress={onPress}
                role="button"
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                aria-label={accessibilityLabel}
                {...(testID !== undefined ? { testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {wrapStringChildren(children)}
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            role="button"
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            aria-label={accessibilityLabel}
            {...(testID !== undefined ? { testID } : {})}
            className={cn('absolute right-3 top-3 w-8 h-8 items-center justify-center rounded-md', className)}
            style={{
                position: 'absolute',
                right: px(colors.spacing['3']),
                top: px(colors.spacing['3']),
                // 32×32 close hit target — component-density literal — not from theme
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: px(colors.radius.md),
            }}
        >
            <defaultSemanticIcons.close size={18} color={colors.semantic.text.muted} />
        </Pressable>
    );
}

export type DialogFooterProps = {
    children?: ReactNode;
    className?: string;
};

/** Convenience row for dialog action buttons (right-aligned). */
function DialogFooter({ children, className }: DialogFooterProps) {
    const colors = useThemeColors();
    return (
        <View
            className={cn('mt-4 flex-row items-center justify-end gap-2', className)}
            style={{
                marginTop: px(colors.spacing['4']),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: px(colors.spacing['2']),
            }}
        >
            {children}
        </View>
    );
}

/**
 * Public `Dialog` value — the root function plus its `.Trigger`, `.Content`,
 * `.Title`, `.Description`, `.Footer`, and `.Close` static members. `Object.assign`
 * produces a value whose inferred type carries the static properties, so `.d.ts`
 * consumers can write `<Dialog.Content>` without a separate import.
 */
export const Dialog = Object.assign(DialogRoot, {
    Trigger: DialogTrigger,
    Content: DialogContent,
    Title: DialogTitle,
    Description: DialogDescription,
    Footer: DialogFooter,
    Close: DialogClose,
});
