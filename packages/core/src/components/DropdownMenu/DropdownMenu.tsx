'use client';

import {
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Popover, usePopoverContext } from '../Popover/Popover';

// ---------------------------------------------------------------------------
// Internal menu context — carries open state + toggle/close for sub-components
// ---------------------------------------------------------------------------

type MenuContextValue = {
    open: boolean;
    toggle: () => void;
    close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

/**
 * @internal — provides MenuContext; exported so ContextMenu can reuse it
 * without re-implementing the provider.
 */
export const MenuContextProvider = ({
    open,
    toggle,
    close,
    children,
}: {
    open: boolean;
    /** Optional — DropdownMenu passes it; ContextMenu items only need close. */
    toggle?: () => void;
    close: () => void;
    children: ReactNode;
}) => <MenuContext.Provider value={{ open, toggle: toggle ?? close, close }}>{children}</MenuContext.Provider>;

/** @internal */
export function useMenuContext(caller: string): MenuContextValue {
    const ctx = useContext(MenuContext);
    if (!ctx) {
        throw new Error(`<${caller}> must be rendered inside a <DropdownMenu> or <ContextMenu>.`);
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Shared menu surface sub-components
// ---------------------------------------------------------------------------

export type MenuContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    'aria-label'?: string;
};

/**
 * The floating menu surface. Wraps `Popover.Content` and applies
 * `role="menu"` so assistive tech announces the list of items.
 *
 * Web keyboard navigation:
 *  - ArrowDown / ArrowUp — cycle focus between enabled items.
 *  - Home / End — jump to first / last enabled item.
 *  - Escape — closes the menu (handled by Popover.Content already).
 *  - Enter / Space — activates the focused item.
 */
export const MenuContent = ({
    children,
    className,
    testID,
    side = 'bottom',
    align = 'start',
    'aria-label': ariaLabel,
}: MenuContentProps) => {
    const colors = useThemeColors();
    const containerRef = useRef<View | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        if (typeof document === 'undefined') {
            return;
        }

        const container = containerRef.current as unknown as HTMLElement | null;
        if (!container) {
            return;
        }

        const getItems = (): HTMLElement[] =>
            Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));

        const onKeyDown = (e: KeyboardEvent) => {
            const items = getItems();
            if (items.length === 0) {
                return;
            }
            const focused = document.activeElement as HTMLElement | null;
            const idx = focused ? items.indexOf(focused) : -1;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    items[idx < items.length - 1 ? idx + 1 : 0]?.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    items[idx > 0 ? idx - 1 : items.length - 1]?.focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    items[0]?.focus();
                    break;
                case 'End':
                    e.preventDefault();
                    items[items.length - 1]?.focus();
                    break;
                default:
                    break;
            }
        };

        container.addEventListener('keydown', onKeyDown);
        return () => container.removeEventListener('keydown', onKeyDown);
    });

    return (
        <Popover.Content
            side={side}
            align={align}
            {...(testID !== undefined ? { testID } : {})}
            {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            <View
                ref={containerRef}
                {...({
                    role: 'menu',
                    ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
                } as Record<string, unknown>)}
                style={{
                    minWidth: 160,
                    paddingVertical: px(colors.spacing['1']),
                    margin: -px(colors.spacing['4']),
                    borderRadius: px(colors.radius.lg),
                    overflow: 'hidden',
                }}
            >
                {children}
            </View>
        </Popover.Content>
    );
};
MenuContent.displayName = 'MenuContent';

// ---- MenuItem --------------------------------------------------------------

export type MenuItemProps = {
    /** Fired when the item is selected. Also closes the menu. */
    onSelect?: () => void;
    /** Prevents interaction and dims the item visually. */
    disabled?: boolean;
    /** Renders the item in a danger/destructive tone. */
    destructive?: boolean;
    /** Leading icon node. */
    icon?: ReactNode;
    /**
     * Keyboard shortcut hint shown on the trailing edge.
     * Purely presentational — web only, no function key binding.
     */
    shortcut?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export const MenuItem = ({
    onSelect,
    disabled = false,
    destructive = false,
    icon,
    shortcut,
    children,
    className,
    testID,
}: MenuItemProps) => {
    const colors = useThemeColors();
    const menu = useMenuContext('MenuItem');

    const handlePress = useCallback(() => {
        if (disabled) {
            return;
        }
        onSelect?.();
        menu.close();
    }, [disabled, onSelect, menu]);

    const textColor = destructive
        ? colors.color.dangerText
        : disabled
          ? colors.semantic.text.muted
          : colors.semantic.text.default;

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            {...({
                role: 'menuitem',
                'aria-disabled': disabled ? 'true' : undefined,
                tabIndex: disabled ? -1 : 0,
                onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePress();
                    }
                },
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            className={cn('flex-row items-center gap-2 px-3 py-2', className)}
            style={{ opacity: disabled ? 0.4 : 1 }}
            accessibilityRole="menuitem"
            accessibilityState={{ disabled }}
        >
            {icon !== undefined && (
                <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
            )}
            <RNText
                style={{
                    flex: 1,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: textColor,
                }}
            >
                {children}
            </RNText>
            {shortcut !== undefined && Platform.OS === 'web' && (
                <RNText
                    {...({ 'aria-hidden': 'true' } as Record<string, unknown>)}
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.xs),
                        color: colors.semantic.text.muted,
                    }}
                >
                    {shortcut}
                </RNText>
            )}
        </Pressable>
    );
};
MenuItem.displayName = 'MenuItem';

// ---- MenuSeparator ---------------------------------------------------------

export type MenuSeparatorProps = {
    className?: string;
    testID?: string;
};

export const MenuSeparator = ({ className, testID }: MenuSeparatorProps) => {
    const colors = useThemeColors();
    return (
        <View
            {...({ role: 'separator' } as Record<string, unknown>)}
            accessibilityRole="none"
            {...(testID !== undefined ? { testID } : {})}
            className={cn('mx-1 my-1', className)}
            style={{
                height: 1,
                marginVertical: 4,
                marginHorizontal: 4,
                backgroundColor: colors.semantic.border.default,
            }}
        />
    );
};
MenuSeparator.displayName = 'MenuSeparator';

// ---- MenuLabel -------------------------------------------------------------

export type MenuLabelProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

export const MenuLabel = ({ children, className, testID }: MenuLabelProps) => {
    const colors = useThemeColors();
    return (
        <View
            {...({ role: 'presentation' } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            className={cn('px-3 pt-2 pb-1', className)}
        >
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.xs),
                    color: colors.semantic.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontWeight: '600',
                }}
            >
                {children}
            </RNText>
        </View>
    );
};
MenuLabel.displayName = 'MenuLabel';

// ---------------------------------------------------------------------------
// DropdownMenu root
// ---------------------------------------------------------------------------

export type DropdownMenuProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state (uncontrolled). @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Click-triggered dropdown menu.
 *
 * Compound parts:
 * - `DropdownMenu.Trigger` — wraps any element; click opens the menu.
 * - `DropdownMenu.Content` — the floating menu surface.
 * - `DropdownMenu.Item` — interactive menu item.
 * - `DropdownMenu.Separator` — visual divider.
 * - `DropdownMenu.Label` — non-interactive section heading.
 *
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenu.Trigger>
 *     <Button>Options</Button>
 *   </DropdownMenu.Trigger>
 *   <DropdownMenu.Content>
 *     <DropdownMenu.Item onSelect={() => console.log('edit')}>Edit</DropdownMenu.Item>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item destructive onSelect={() => console.log('delete')}>Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu>
 * ```
 */
const DropdownMenuRoot = ({ open, defaultOpen = false, onOpenChange, children }: DropdownMenuProps) => {
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

    const toggle = useCallback(() => setOpen(!current), [setOpen, current]);
    const close = useCallback(() => setOpen(false), [setOpen]);

    return (
        <MenuContextProvider open={current} toggle={toggle} close={close}>
            <Popover open={current} onOpenChange={setOpen}>
                {children}
            </Popover>
        </MenuContextProvider>
    );
};

// ---------------------------------------------------------------------------
// DropdownMenu.Trigger
// ---------------------------------------------------------------------------

export type DropdownMenuTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Element that toggles the dropdown menu on click/press. Uses asChild by
 * default — the wrapped child becomes the trigger. Gets `aria-haspopup="menu"`
 * and `aria-expanded`.
 *
 * Internally uses the Popover context to measure the trigger rect (needed for
 * positioning) and set the triggerRef — same as PopoverTrigger, but with
 * `aria-haspopup="menu"` instead of `"dialog"`.
 */
const DropdownMenuTrigger = ({ children, className, testID }: DropdownMenuTriggerProps) => {
    const menu = useMenuContext('DropdownMenu.Trigger');
    const popover = usePopoverContext('DropdownMenu.Trigger');

    const onPress = useCallback(() => {
        popover.measureTrigger();
        popover.setOpen(!popover.open);
    }, [popover]);

    if (isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        const fire = (existing: ((e: unknown) => void) | undefined) => (event: unknown) => {
            existing?.(event);
            popover.measureTrigger();
            popover.setOpen(!popover.open);
        };

        return (
            <Slot
                ref={(node: HTMLElement | null) => {
                    popover.triggerRef.current = node;
                }}
                onClick={fire(child.props.onClick as ((e: unknown) => void) | undefined)}
                onPress={fire(child.props.onPress as ((e: unknown) => void) | undefined)}
                {...({
                    'aria-haspopup': 'menu',
                    'aria-expanded': menu.open,
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
            onPress={onPress}
            {...({
                'aria-haspopup': 'menu',
                'aria-expanded': menu.open,
                'aria-controls': popover.contentId,
            } as Record<string, unknown>)}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            {typeof children === 'string' || typeof children === 'number' ? <RNText>{children}</RNText> : children}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// DropdownMenu.Content
// ---------------------------------------------------------------------------

export type DropdownMenuContentProps = MenuContentProps;

const DropdownMenuContent = (props: DropdownMenuContentProps) => <MenuContent {...props} />;

// ---------------------------------------------------------------------------
// Public compound export
// ---------------------------------------------------------------------------

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
    Trigger: DropdownMenuTrigger,
    Content: DropdownMenuContent,
    Item: MenuItem,
    Separator: MenuSeparator,
    Label: MenuLabel,
});
