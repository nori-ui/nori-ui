'use client';

import {
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useState,
} from 'react';
import { Platform, Pressable, Text as RNText } from 'react-native';
import { Slot } from '../../slot';
import {
    MenuContent,
    type MenuContentProps,
    MenuContextProvider,
    MenuItem,
    type MenuItemProps,
    MenuLabel,
    type MenuLabelProps,
    MenuSeparator,
    type MenuSeparatorProps,
} from '../DropdownMenu/DropdownMenu';
import { Popover, usePopoverContext } from '../Popover/Popover';

// ---------------------------------------------------------------------------
// ContextMenu internal context (separate from DropdownMenu's context)
// ---------------------------------------------------------------------------

type ContextMenuCtxValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
};

const ContextMenuCtx = createContext<ContextMenuCtxValue | null>(null);

const useContextMenuCtx = () => {
    const ctx = useContext(ContextMenuCtx);
    if (!ctx) {
        throw new Error('ContextMenu compound parts must be rendered inside a <ContextMenu>.');
    }
    return ctx;
};

// ---------------------------------------------------------------------------
// ContextMenu root
// ---------------------------------------------------------------------------

export type ContextMenuProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Long-press (native) or right-click (web) triggered menu. Shares the same
 * compound surface as `DropdownMenu` but with a different trigger gesture.
 *
 * - **Web**: right-click (`contextmenu` event) opens the menu. The browser's
 *   native context menu is suppressed via `preventDefault`.
 * - **Native**: long-press (`onLongPress`) opens the menu.
 *
 * The menu is anchored to the trigger element's bounding box (cursor-coordinate
 * anchoring is deferred to v2).
 *
 * ```tsx
 * <ContextMenu>
 *   <ContextMenu.Trigger>
 *     <View style={{ padding: 16 }}>
 *       <Text>Right-click or long-press me</Text>
 *     </View>
 *   </ContextMenu.Trigger>
 *   <ContextMenu.Content>
 *     <ContextMenu.Item onSelect={() => console.log('copy')}>Copy</ContextMenu.Item>
 *     <ContextMenu.Item onSelect={() => console.log('paste')}>Paste</ContextMenu.Item>
 *   </ContextMenu.Content>
 * </ContextMenu>
 * ```
 */
const ContextMenuRoot = ({ open, defaultOpen = false, onOpenChange, children }: ContextMenuProps) => {
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

    return (
        <ContextMenuCtx.Provider value={{ open: current, setOpen }}>
            <Popover open={current} onOpenChange={setOpen}>
                {children}
            </Popover>
        </ContextMenuCtx.Provider>
    );
};

// ---------------------------------------------------------------------------
// ContextMenu.Trigger
// ---------------------------------------------------------------------------

export type ContextMenuTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Trigger element for ContextMenu.
 *
 * - Web: fires on `contextmenu` (right-click). Calls `preventDefault` so the
 *   browser's native context menu is suppressed.
 * - Native: fires on `onLongPress`.
 */
const ContextMenuTrigger = ({ children, className, testID }: ContextMenuTriggerProps) => {
    const ctx = useContextMenuCtx();
    const popover = usePopoverContext('ContextMenu.Trigger');

    const openMenu = useCallback(() => {
        popover.measureTrigger();
        ctx.setOpen(true);
    }, [ctx, popover]);

    if (Platform.OS === 'web') {
        if (isValidElement(children)) {
            const child = children as ReactElement<Record<string, unknown>>;
            const existing = child.props.onContextMenu as ((e: MouseEvent) => void) | undefined;
            return (
                <Slot
                    ref={(node: HTMLElement | null) => {
                        popover.triggerRef.current = node;
                    }}
                    onContextMenu={(e: MouseEvent) => {
                        e.preventDefault();
                        existing?.(e);
                        openMenu();
                    }}
                    {...({
                        'aria-haspopup': 'menu',
                        'aria-expanded': ctx.open,
                        'aria-controls': popover.contentId,
                    } as Record<string, unknown>)}
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
                    popover.triggerRef.current = node as unknown as HTMLElement | null;
                }}
                {...({
                    onContextMenu: (e: MouseEvent) => {
                        e.preventDefault();
                        openMenu();
                    },
                    'aria-haspopup': 'menu',
                    'aria-expanded': ctx.open,
                    'aria-controls': popover.contentId,
                } as Record<string, unknown>)}
                {...(testID !== undefined ? { testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {typeof children === 'string' || typeof children === 'number' ? <RNText>{children}</RNText> : children}
            </Pressable>
        );
    }

    // Native — long press
    if (isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        const existing = child.props.onLongPress as ((e: unknown) => void) | undefined;
        return (
            <Slot
                ref={(node: unknown) => {
                    popover.triggerRef.current = node as HTMLElement | null;
                }}
                onLongPress={(e: unknown) => {
                    existing?.(e);
                    openMenu();
                }}
                accessibilityRole="button"
                {...(testID !== undefined ? { testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {child}
            </Slot>
        );
    }

    return (
        <Pressable
            ref={(node) => {
                popover.triggerRef.current = node as unknown as HTMLElement | null;
            }}
            onLongPress={openMenu}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {typeof children === 'string' || typeof children === 'number' ? <RNText>{children}</RNText> : children}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// ContextMenu.Content
// ---------------------------------------------------------------------------

export type ContextMenuContentProps = MenuContentProps;

/**
 * The floating menu surface for ContextMenu. Wraps the shared MenuContent and
 * provides the MenuContext so `ContextMenu.Item` can close the menu on select.
 */
const ContextMenuContent = (props: ContextMenuContentProps) => {
    const ctx = useContextMenuCtx();
    const close = useCallback(() => ctx.setOpen(false), [ctx]);
    return (
        <MenuContextProvider open={ctx.open} close={close}>
            <MenuContent {...props} />
        </MenuContextProvider>
    );
};

// ---------------------------------------------------------------------------
// Public compound export
// ---------------------------------------------------------------------------

export { MenuItem, type MenuItemProps, MenuLabel, type MenuLabelProps, MenuSeparator, type MenuSeparatorProps };

export const ContextMenu = Object.assign(ContextMenuRoot, {
    Trigger: ContextMenuTrigger,
    Content: ContextMenuContent,
    Item: MenuItem,
    Separator: MenuSeparator,
    Label: MenuLabel,
});
