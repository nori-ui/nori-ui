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
    useState,
} from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

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

    const ctxValue: SheetContextValue = {
        open: current,
        setOpen,
        titleId: `${baseId}-title`,
        descriptionId: `${baseId}-description`,
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
    accessibilityLabel?: string;
};

export const SheetClose = ({
    asChild = true,
    children,
    className,
    testID,
    accessibilityLabel = 'Close',
}: SheetCloseProps) => {
    const ctx = useSheetContext('SheetClose');
    const onPress = useCallback(() => ctx.setOpen(false), [ctx]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
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
};
