'use client';

/**
 * Web-specific Sheet — identical to `Sheet.tsx` but provided as a separate
 * platform entry-point so bundlers that prefer `.web.tsx` (Next.js, Vite with
 * react-native-web preset) pick up this file automatically.
 *
 * Both `Sheet.tsx` and `Sheet.web.tsx` share all context/types/subcomponents
 * from `Sheet.shared.tsx`. The `SheetPanel` implementation is duplicated here
 * to avoid a circular module reference (Jest's `.web.tsx`-first resolution
 * would re-enter this file if we simply re-exported from `./Sheet`).
 *
 * Animation: CSS transitions (translate + opacity backdrop). No reanimated
 * needed on web — the browser's compositor handles it natively.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Modal, Pressable } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import {
    SheetBody,
    SheetClose,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    type SheetPanelProps,
    SheetRoot,
    type SheetSide,
    type SheetSize,
    SheetTitle,
    SheetTrigger,
    SIZE_PERCENT,
    useSheetContext,
} from './Sheet.shared';

// Re-export all shared parts so importers of `Sheet.web` get the full API.
export {
    SheetBody,
    SheetClose,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    type SheetPanelProps,
    type SheetProps,
    type SheetSide,
    type SheetSize,
    SheetTitle,
    SheetTrigger,
} from './Sheet.shared';

// ─── Panel (web) ──────────────────────────────────────────────────────────────

const SCRIM_COLOR = 'rgba(0, 0, 0, 0.40)';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const SheetPanel = ({ children, className, testID }: SheetPanelProps) => {
    const ctx = useSheetContext('SheetPanel');
    const colors = useThemeColors();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const overlayDomRef = useRef<HTMLElement | null>(null);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (!ctx.open) {
            setEntered(false);
            return;
        }
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, [ctx.open]);

    // Backdrop scrim via direct DOM assignment (rn-web drops non-RN style keys).
    useEffect(() => {
        const node = overlayDomRef.current;
        if (!node) {
            return;
        }
        node.style.transitionProperty = 'background-color';
        node.style.transitionDuration = '200ms';
        node.style.transitionTimingFunction = 'ease-out';
        node.style.backgroundColor = entered ? SCRIM_COLOR : 'rgba(0,0,0,0)';
    }, [entered]);

    // Focus-trap, scroll-lock, Escape-close.
    useEffect(() => {
        if (!ctx.open || typeof document === 'undefined') {
            return;
        }
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusFirst = () => {
            const node = panelRef.current;
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
            const node = panelRef.current;
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
            const restoreTo = ctx.triggerRef.current ?? previouslyFocused;
            restoreTo?.focus?.();
        };
    }, [ctx.open, ctx.setOpen, ctx.triggerRef]);

    const onBackdropPress = useCallback(() => {
        if (ctx.dismissible) {
            ctx.setOpen(false);
        }
    }, [ctx]);

    const isHorizontal = ctx.side === 'left' || ctx.side === 'right';
    const sizeStyle = sizeToWebStyle(ctx.side, ctx.size);

    const panelStyle: ViewStyle = {
        position: 'absolute',
        backgroundColor: colors.semantic.background.elevated,
        ...(isHorizontal ? { top: 0, bottom: 0 } : { left: 0, right: 0 }),
        ...(ctx.side === 'bottom' && { bottom: 0 }),
        ...(ctx.side === 'top' && { top: 0 }),
        ...(ctx.side === 'left' && { left: 0 }),
        ...(ctx.side === 'right' && { right: 0 }),
    };

    const translateStyle: ViewStyle = {
        transform: entered ? 'translateX(0) translateY(0)' : translateOffscreen(ctx.side),
        transitionProperty: 'transform',
        transitionDuration: '280ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    } as unknown as ViewStyle;

    const overlayStyle: ViewStyle = {
        position: 'fixed' as unknown as 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
    } as ViewStyle;

    return (
        <Modal visible={ctx.open} transparent animationType="none" onRequestClose={() => ctx.setOpen(false)}>
            <Pressable
                accessibilityRole="none"
                aria-hidden={true}
                ref={(node) => {
                    overlayDomRef.current = node as unknown as HTMLElement | null;
                }}
                style={overlayStyle}
                onPress={onBackdropPress}
            >
                <Pressable
                    onPress={(event) => event.stopPropagation?.()}
                    ref={(node) => {
                        panelRef.current = node as unknown as HTMLDivElement | null;
                    }}
                    role="dialog"
                    accessibilityRole="none"
                    aria-modal={true}
                    aria-labelledby={ctx.titleId}
                    aria-describedby={ctx.descriptionId}
                    data-side={ctx.side}
                    {...(testID !== undefined ? { testID } : {})}
                    className={cn('bg-semantic-background-elevated', className)}
                    style={[
                        panelStyle,
                        sizeStyle as ViewStyle,
                        translateStyle,
                        {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 20,
                            elevation: 24,
                            ...(ctx.side === 'bottom'
                                ? {
                                      borderTopLeftRadius: 16,
                                      borderTopRightRadius: 16,
                                  }
                                : {}),
                            ...(ctx.side === 'top'
                                ? {
                                      borderBottomLeftRadius: 16,
                                      borderBottomRightRadius: 16,
                                  }
                                : {}),
                        },
                    ]}
                >
                    {children}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

// ─── Compound export ──────────────────────────────────────────────────────────

export const Sheet = Object.assign(SheetRoot, {
    Trigger: SheetTrigger,
    Panel: SheetPanel,
    Header: SheetHeader,
    Title: SheetTitle,
    Description: SheetDescription,
    Body: SheetBody,
    Footer: SheetFooter,
    Close: SheetClose,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sizeToWebStyle(side: SheetSide, size: SheetSize): Record<string, unknown> {
    const isHorizontal = side === 'left' || side === 'right';
    const dim = typeof size === 'number' ? size : SIZE_PERCENT[size];
    return isHorizontal ? { width: dim, height: '100%' } : { height: dim, width: '100%' };
}

function translateOffscreen(side: SheetSide): string {
    switch (side) {
        case 'bottom':
            return 'translateY(100%)';
        case 'top':
            return 'translateY(-100%)';
        case 'left':
            return 'translateX(-100%)';
        case 'right':
            return 'translateX(100%)';
    }
}
