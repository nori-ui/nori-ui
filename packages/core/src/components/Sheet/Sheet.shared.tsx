'use client';

/**
 * Shared Sheet internals — context, types, root, trigger, and structural
 * subcomponents (Header, Title, Description, Body, Footer, Close).
 *
 * Imported by both `Sheet.tsx` (native) and `Sheet.web.tsx` (web) to avoid
 * duplication. The panel surface (`SheetPanel`) is platform-specific and
 * lives in each of those files.
 */

import {
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useId,
    useRef,
} from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import {
    hasTextContent,
    slotPressProps,
    slotTestIdProps,
    useOverlayLabels,
    useOverlayOpenState,
    useRegisterOverlayLabel,
} from '../../utils/overlay-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

export type SheetSize = 'sm' | 'md' | 'lg' | 'full' | number;

export type SheetProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Edge the sheet slides in from.
     * @defaultValue 'bottom'
     */
    side?: SheetSide;
    /**
     * Panel size: preset key or an explicit pixel value.
     * - 'sm'   → 25% of viewport height/width
     * - 'md'   → 50%
     * - 'lg'   → 75%
     * - 'full' → 100%
     * - number → explicit px value
     * @defaultValue 'md'
     */
    size?: SheetSize;
    /**
     * Whether tapping the backdrop closes the sheet.
     * @defaultValue true
     */
    dismissible?: boolean;
    children?: ReactNode;
};

export type SheetContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    titleId: string;
    descriptionId: string;
    hasTitle: boolean;
    hasDescription: boolean;
    registerTitle: () => () => void;
    registerDescription: () => () => void;
    triggerRef: { current: HTMLElement | null };
    side: SheetSide;
    size: SheetSize;
    dismissible: boolean;
};

// ─── Size helpers ─────────────────────────────────────────────────────────────

export const SIZE_PERCENT: Record<Exclude<SheetSize, number>, string> = {
    sm: '25%',
    md: '50%',
    lg: '75%',
    full: '100%',
};

export function resolveSizeValue(size: SheetSize): string | number {
    if (typeof size === 'number') {
        return size;
    }
    return SIZE_PERCENT[size];
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const SheetContext = createContext<SheetContextValue | null>(null);

export const useSheetContext = (label: string): SheetContextValue => {
    const ctx = useContext(SheetContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Sheet>.`);
    }
    return ctx;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const SheetRoot = ({
    open,
    defaultOpen = false,
    onOpenChange,
    side = 'bottom',
    size = 'md',
    dismissible = true,
    children,
}: SheetProps) => {
    const [current, setOpen] = useOverlayOpenState({ open, defaultOpen, onOpenChange });
    const labels = useOverlayLabels();

    const baseId = useId();
    const triggerRef = useRef<HTMLElement | null>(null);

    const ctxValue: SheetContextValue = {
        open: current,
        setOpen,
        titleId: `${baseId}-title`,
        descriptionId: `${baseId}-description`,
        ...labels,
        triggerRef,
        side,
        size,
        dismissible,
    };

    return <SheetContext.Provider value={ctxValue}>{children}</SheetContext.Provider>;
};

// ─── Trigger ──────────────────────────────────────────────────────────────────

export type SheetTriggerProps = {
    /** Render the child as the trigger (Slot pattern). @defaultValue true */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export const SheetTrigger = ({ asChild = true, children, className, testID }: SheetTriggerProps) => {
    const ctx = useSheetContext('SheetTrigger');
    const onPress = useCallback(() => ctx.setOpen(true), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    ctx.triggerRef.current = node;
                }}
                {...slotPressProps(child, onPress)}
                aria-haspopup="dialog"
                aria-expanded={ctx.open}
                {...slotTestIdProps(child, testID)}
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
            role="button"
            accessibilityRole="button"
            {...({ 'aria-haspopup': 'dialog' } as Record<string, unknown>)}
            aria-expanded={ctx.open}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {wrapStringChildren(children)}
        </Pressable>
    );
};

// ─── Header ───────────────────────────────────────────────────────────────────

export type SheetHeaderProps = { children?: ReactNode; className?: string };

export const SheetHeader = ({ children, className }: SheetHeaderProps) => {
    const colors = useThemeColors();
    return (
        <View
            className={cn('flex-col gap-1', className)}
            style={{
                flexDirection: 'column',
                gap: px(colors.spacing['1']),
                paddingHorizontal: px(colors.spacing['6']),
                paddingTop: px(colors.spacing['6']),
                paddingBottom: px(colors.spacing['2']),
            }}
        >
            {children}
        </View>
    );
};

// ─── Title ────────────────────────────────────────────────────────────────────

export type SheetTitleProps = { children?: ReactNode; className?: string };

export const SheetTitle = ({ children, className }: SheetTitleProps) => {
    const ctx = useSheetContext('SheetTitle');
    const colors = useThemeColors();
    useRegisterOverlayLabel(ctx.registerTitle);
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
};

// ─── Description ─────────────────────────────────────────────────────────────

export type SheetDescriptionProps = { children?: ReactNode; className?: string };

export const SheetDescription = ({ children, className }: SheetDescriptionProps) => {
    const ctx = useSheetContext('SheetDescription');
    const colors = useThemeColors();
    useRegisterOverlayLabel(ctx.registerDescription);
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
};

// ─── Body ─────────────────────────────────────────────────────────────────────

export type SheetBodyProps = { children?: ReactNode; className?: string };

export const SheetBody = ({ children, className }: SheetBodyProps) => {
    const colors = useThemeColors();
    return (
        <View
            className={cn('flex-1', className)}
            style={{
                flex: 1,
                paddingHorizontal: px(colors.spacing['6']),
                paddingVertical: px(colors.spacing['4']),
            }}
        >
            {children}
        </View>
    );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export type SheetFooterProps = { children?: ReactNode; className?: string };

export const SheetFooter = ({ children, className }: SheetFooterProps) => {
    const colors = useThemeColors();
    return (
        <View
            className={cn('flex-row items-center justify-end gap-2', className)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: px(colors.spacing['2']),
                paddingHorizontal: px(colors.spacing['6']),
                paddingBottom: px(colors.spacing['6']),
                paddingTop: px(colors.spacing['2']),
            }}
        >
            {children}
        </View>
    );
};

// ─── Close ────────────────────────────────────────────────────────────────────

export type SheetCloseProps = {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
    /**
     * Accessible name. Defaults to the translated "Close" when the button has
     * no text of its own (icon-only); visible text is used as the name otherwise.
     */
    accessibilityLabel?: string;
};

/**
 * Element that closes the sheet when activated. With `asChild` (default),
 * wraps the child. Without children it renders a default ✕ button in the
 * panel's top-right corner.
 */
export const SheetClose = ({ asChild = true, children, className, testID, accessibilityLabel }: SheetCloseProps) => {
    const ctx = useSheetContext('SheetClose');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const label = accessibilityLabel ?? t('common.close');
    const onPress = useCallback(() => ctx.setOpen(false), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        return (
            <Slot
                {...slotPressProps(child, onPress)}
                {...slotTestIdProps(child, testID)}
                {...(className !== undefined ? { className } : {})}
            >
                {child}
            </Slot>
        );
    }

    if (children !== undefined && children !== null) {
        // Visible text is the accessible name; the fallback label would
        // announce "Close" for a button that reads "Cancel".
        const needsLabel = accessibilityLabel !== undefined || !hasTextContent(children);
        return (
            <Pressable
                onPress={onPress}
                role="button"
                accessibilityRole="button"
                {...(needsLabel ? { accessibilityLabel: label, 'aria-label': label } : {})}
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
            accessibilityLabel={label}
            aria-label={label}
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
};

// ─── Utilities ────────────────────────────────────────────────────────────────

export function wrapStringChildren(children: ReactNode): ReactNode {
    if (typeof children === 'string' || typeof children === 'number') {
        return <RNText>{children}</RNText>;
    }
    return children;
}

export type SheetPanelProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
    /** Accessible name when the sheet has no `Sheet.Title`. */
    'aria-label'?: string;
};

/**
 * Accessible-name props for the panel surface. `aria-labelledby` /
 * `aria-describedby` are only emitted for a Title / Description that is
 * actually mounted, so the ids never dangle.
 */
export function sheetPanelLabelProps(ctx: SheetContextValue, ariaLabel: string | undefined): Record<string, string> {
    return {
        ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
        ...(ctx.hasTitle && ariaLabel === undefined ? { 'aria-labelledby': ctx.titleId } : {}),
        ...(ctx.hasDescription ? { 'aria-describedby': ctx.descriptionId } : {}),
    };
}

// Fills the overlay container behind the panel. A sibling of the panel (not
// its parent) so hiding it from assistive tech does not hide the sheet itself.
export const SHEET_SCRIM_FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
