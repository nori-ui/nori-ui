'use client';

/**
 * Native Sheet entry-point for Metro bundler.
 * Metro resolves `.native.tsx` over `.tsx` on iOS/Android.
 *
 * This file imports from `Sheet.shared.tsx` (not `./Sheet`) to avoid circular
 * resolution. The SheetPanel here uses RN Modal with slide/fade animation —
 * identical to the one in `Sheet.tsx`. The duplicate is intentional: it breaks
 * the circular-import chain that would occur if .native.tsx re-exported from
 * ./Sheet (which Metro would resolve back to .native.tsx).
 *
 * If/when a purely reanimated-based panel is needed (for custom swipe-to-dismiss
 * in v2), override SheetPanel here without touching Sheet.tsx.
 */

import { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import { Modal, Pressable, View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { ButtonGroupContext } from '../ButtonGroup/button-group-context';
import {
    SHEET_SCRIM_FILL,
    SheetBody,
    SheetClose,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    type SheetPanelProps,
    SheetRoot,
    SheetTitle,
    SheetTrigger,
    SIZE_PERCENT,
    sheetPanelLabelProps,
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

// ─── Panel (native) ───────────────────────────────────────────────────────────

const SCRIM_COLOR = 'rgba(0, 0, 0, 0.40)';

export const SheetPanel = ({ children, className, testID, 'aria-label': ariaLabel }: SheetPanelProps) => {
    const ctx = useSheetContext('SheetPanel');
    const colors = useThemeColors();

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
        ...(isHorizontal ? { top: 0, bottom: 0, width: dim as number } : { left: 0, right: 0, height: dim as number }),
        ...(ctx.side === 'bottom' && { bottom: 0 }),
        ...(ctx.side === 'top' && { top: 0 }),
        ...(ctx.side === 'left' && { left: 0 }),
        ...(ctx.side === 'right' && { right: 0 }),
    };

    const overlayStyle: ViewStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };

    const sizeStyle: ViewStyle = isHorizontal
        ? { width: dim as number, height: '100%' as unknown as number }
        : { height: dim as number, width: '100%' as unknown as number };

    return (
        // A surface is its own visual context: buttons inside it must not pick
        // up the size and joined corners of a ButtonGroup that happens to
        // contain the trigger.
        <ButtonGroupContext.Provider value={null}>
            <Modal
                visible={ctx.open}
                transparent
                animationType={ctx.side === 'bottom' || ctx.side === 'top' ? 'slide' : 'fade'}
                onRequestClose={() => ctx.setOpen(false)}
            >
                <View style={overlayStyle}>
                    <Pressable
                        accessibilityRole="none"
                        aria-hidden={true}
                        tabIndex={-1}
                        style={[SHEET_SCRIM_FILL, { backgroundColor: SCRIM_COLOR }]}
                        onPress={onBackdropPress}
                    />
                    {/* A View, not a Pressable: a Pressable is one accessibility
                    element on iOS, which would collapse everything inside
                    the sheet into a single unreadable node. */}
                    <View
                        role="dialog"
                        accessibilityRole="none"
                        aria-modal={true}
                        {...sheetPanelLabelProps(ctx, ariaLabel)}
                        {...(testID !== undefined ? { testID } : {})}
                        className={cn('bg-semantic-background-elevated', className)}
                        style={[
                            panelStyle,
                            sizeStyle,
                            {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: -2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 20,
                                elevation: 24,
                                ...(ctx.side === 'bottom' ? { borderTopLeftRadius: 16, borderTopRightRadius: 16 } : {}),
                                ...(ctx.side === 'top'
                                    ? { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }
                                    : {}),
                            },
                        ]}
                    >
                        {children}
                    </View>
                </View>
            </Modal>
        </ButtonGroupContext.Provider>
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
