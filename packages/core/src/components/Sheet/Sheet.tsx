'use client';

/**
 * Sheet — default (native) implementation.
 *
 * Metro resolves `.native.tsx` over `.tsx` so on native builds, `Sheet.native.tsx`
 * wins. On web, `Sheet.web.tsx` wins. This file serves as the fallback for
 * environments that don't apply platform extensions (plain Node / jest node project).
 *
 * Shared context, types, and structural subcomponents live in `Sheet.shared.tsx`.
 * The `SheetPanel` here uses RN Modal with Platform.OS guards for web CSS
 * transitions and native slide animation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Modal, Platform, Pressable } from 'react-native';
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
    SheetTitle,
    SheetTrigger,
    SIZE_PERCENT,
    useSheetContext,
} from './Sheet.shared';

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

// ─── Panel ────────────────────────────────────────────────────────────────────

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

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const node = overlayDomRef.current;
        if (!node) {
            return;
        }
        node.style.transitionProperty = 'background-color';
        node.style.transitionDuration = '200ms';
        node.style.transitionTimingFunction = 'ease-out';
        node.style.backgroundColor = entered ? SCRIM_COLOR : 'rgba(0,0,0,0)';
    }, [entered]);

    useEffect(() => {
        if (!ctx.open || Platform.OS !== 'web' || typeof document === 'undefined') {
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
    const dim = typeof ctx.size === 'number' ? ctx.size : SIZE_PERCENT[ctx.size];

    const panelStyle: ViewStyle = {
        position: 'absolute',
        backgroundColor: colors.semantic.background.elevated,
        ...(isHorizontal ? { top: 0, bottom: 0 } : { left: 0, right: 0 }),
        ...(ctx.side === 'bottom' && { bottom: 0 }),
        ...(ctx.side === 'top' && { top: 0 }),
        ...(ctx.side === 'left' && { left: 0 }),
        ...(ctx.side === 'right' && { right: 0 }),
    };

    const translateStyle: ViewStyle =
        Platform.OS === 'web'
            ? ({
                  transform: entered ? 'translateX(0) translateY(0)' : translateOffscreen(ctx.side),
                  transitionProperty: 'transform',
                  transitionDuration: '280ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              } as unknown as ViewStyle)
            : {};

    const overlayStyle: ViewStyle = {
        position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...(Platform.OS === 'web' ? ({ zIndex: 50 } as ViewStyle) : { backgroundColor: SCRIM_COLOR }),
    };

    const sizeStyle = isHorizontal
        ? { width: dim, height: '100%' as unknown as number }
        : { height: dim, width: '100%' as unknown as number };

    return (
        <Modal
            visible={ctx.open}
            transparent
            animationType={
                Platform.OS === 'web' ? 'none' : ctx.side === 'bottom' || ctx.side === 'top' ? 'slide' : 'fade'
            }
            onRequestClose={() => ctx.setOpen(false)}
        >
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
                            ...(ctx.side === 'bottom' ? { borderTopLeftRadius: 16, borderTopRightRadius: 16 } : {}),
                            ...(ctx.side === 'top' ? { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 } : {}),
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

export const Drawer = Sheet;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
