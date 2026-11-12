'use client';

/**
 * Command — cmdk-style command palette (compound component).
 *
 * Anatomy:
 *   Command                   Root — owns open state and filter query.
 *   Command.Trigger           Element that opens the palette. Default asChild.
 *   Command.Dialog            The modal surface (search input + item list).
 *   Command.Empty             Shown when no items match the current query.
 *   Command.Group             Labelled section of items.
 *   Command.Item              Selectable action/navigation entry.
 *   Command.Shortcut          Inline keyboard shortcut hint (right-aligned).
 *
 * Web behaviour:
 *   - Global ⌘K / Ctrl+K shortcut opens the palette.
 *   - Search input filters items by substring (case-insensitive).
 *   - ArrowUp / ArrowDown move the active item from the search input, Enter
 *     selects it. Focus stays in the input (`aria-activedescendant`).
 *   - Escape closes (inherited from Dialog).
 *
 * Native behaviour:
 *   - Trigger tap opens the palette (no global keyboard shortcut).
 *   - Same filtering logic; scrollable list.
 *
 * Implementation note:
 *   Reuses the Dialog primitive as the modal surface so we inherit focus
 *   trap, scroll lock, backdrop blur, and Escape-to-close for free.
 */

import {
    Children,
    cloneElement,
    createContext,
    Fragment,
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
import { Platform, Pressable, Text as RNText, TextInput as RNTextInput, ScrollView, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Dialog } from '../Dialog/Dialog';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CommandContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
    query: string;
    setQuery: (q: string) => void;
    /** DOM id of the keyboard-active item, or `null` when none is active. */
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    /** DOM id of the item list — the search input's `aria-controls` target. */
    listId: string;
};

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommandContext(caller: string): CommandContextValue {
    const ctx = useContext(CommandContext);
    if (!ctx) {
        throw new Error(`<${caller}> must be rendered inside <Command>.`);
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type CommandProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
};

/**
 * Root of the Command compound. Owns open state and filter query.
 * Registers the global ⌘K / Ctrl+K shortcut on web.
 */
const CommandRoot = ({ open, defaultOpen = false, onOpenChange, children }: CommandProps) => {
    const [inner, setInner] = useState<boolean>(defaultOpen);
    const isControlled = open !== undefined;
    const current = isControlled ? (open as boolean) : inner;
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const listId = useId();

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInner(next);
            }
            if (!next) {
                // Reset query on close so the palette starts fresh next time.
                setQuery('');
            }
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    // Global ⌘K / Ctrl+K on web only
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(!current);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [current, setOpen]);

    const ctxValue: CommandContextValue = {
        open: current,
        setOpen,
        query,
        setQuery,
        activeId,
        setActiveId,
        listId,
    };

    return <CommandContext.Provider value={ctxValue}>{children}</CommandContext.Provider>;
};

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export type CommandTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

type TriggerChildProps = {
    onClick?: (e: unknown) => void;
    onPress?: (e: unknown) => void;
};

/**
 * Element that opens the command palette when activated.
 * On web it also receives aria-haspopup="dialog" and aria-expanded.
 */
const CommandTrigger = ({ children, className, testID }: CommandTriggerProps) => {
    const ctx = useCommandContext('Command.Trigger');

    const open = () => ctx.setOpen(true);

    const child = isValidElement(children) ? (children as ReactElement<TriggerChildProps>) : null;
    const pressAndOpen = (e: unknown) => {
        child?.props.onPress?.(e);
        open();
    };
    const clickAndOpen = (e: unknown) => {
        child?.props.onClick?.(e);
        open();
    };

    if (Platform.OS === 'web') {
        if (child) {
            const extraProps: Record<string, unknown> = {
                onClick: clickAndOpen,
                'aria-haspopup': 'dialog',
                'aria-expanded': ctx.open ? 'true' : 'false',
            };
            // Components such as <Button> activate through `onPress` and
            // discard a foreign `onClick`, while a plain <View> only forwards
            // `onClick` — so a component child gets both. DOM elements get
            // `onClick` alone because React DOM warns about `onPress`.
            if (typeof child.type !== 'string') {
                extraProps.onPress = pressAndOpen;
            }
            return cloneElement(child, extraProps as Parameters<typeof cloneElement>[1]);
        }
        return (
            <button
                type="button"
                data-testid={testID}
                className={cn('nori-command-trigger', className)}
                aria-haspopup="dialog"
                aria-expanded={ctx.open}
                onClick={open}
            >
                {children}
            </button>
        );
    }

    // Native: a pressable child (e.g. <Button>) claims the touch, so the
    // wrapper below never sees it — the child needs the handler itself. The
    // wrapper still covers children that are not pressable (<View>, text).
    return (
        <Pressable testID={testID} onPress={open} accessibilityRole="button">
            {child ? (
                cloneElement(child, { onPress: pressAndOpen })
            ) : typeof children === 'string' || typeof children === 'number' ? (
                <RNText>{children}</RNText>
            ) : (
                children
            )}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// Dialog (modal surface)
// ---------------------------------------------------------------------------

export type CommandDialogProps = {
    /** Placeholder text for the search input. @defaultValue the `command.placeholder` translation ('Type a command or search…') */
    placeholder?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * The modal surface of the command palette.
 *
 * Wraps Dialog.Content and adds a search TextInput above the item list.
 * Children are typically Command.Empty and Command.Group elements.
 */
const CommandDialogInner = ({ placeholder: placeholderProp, children, className, testID }: CommandDialogProps) => {
    const ctx = useCommandContext('Command.Dialog');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const placeholder = placeholderProp ?? t('command.placeholder');
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const { open: isOpen, query, setActiveId } = ctx;

    // The first match is the active item whenever the result set changes, so
    // Enter runs the top result without an arrow press first.
    // biome-ignore lint/correctness/useExhaustiveDependencies: `query` is the trigger — the rendered options change with it
    useEffect(() => {
        if (!isOpen || Platform.OS !== 'web') {
            return;
        }
        setActiveId(getEnabledOptions(listRef.current)[0]?.id ?? null);
    }, [isOpen, query, setActiveId]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const isArrow = e.key === 'ArrowDown' || e.key === 'ArrowUp';
        // Enter while an IME composition is open confirms the composition.
        if ((!isArrow && e.key !== 'Enter') || e.nativeEvent.isComposing) {
            return;
        }
        const options = getEnabledOptions(listRef.current);
        if (options.length === 0) {
            return;
        }
        e.preventDefault();
        const currentIndex = options.findIndex((option) => option.id === ctx.activeId);
        if (e.key === 'Enter') {
            (options[currentIndex] ?? options[0])?.click();
            return;
        }
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex =
            currentIndex === -1
                ? delta === 1
                    ? 0
                    : options.length - 1
                : (currentIndex + delta + options.length) % options.length;
        const next = options[nextIndex];
        if (!next) {
            return;
        }
        setActiveId(next.id);
        if (typeof next.scrollIntoView === 'function') {
            next.scrollIntoView({ block: 'nearest' });
        }
    };

    // Auto-focus search input when the dialog opens
    useEffect(() => {
        if (!ctx.open) {
            return;
        }
        if (Platform.OS !== 'web') {
            return;
        }
        const id = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(id);
    }, [ctx.open]);

    const contentProps =
        testID !== undefined
            ? { testID, className: cn('nori-command-dialog', className) }
            : { className: cn('nori-command-dialog', className) };

    return (
        <Dialog open={ctx.open} onOpenChange={ctx.setOpen}>
            <Dialog.Content {...contentProps}>
                {Platform.OS === 'web' ? (
                    <div
                        style={{
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            minWidth: 360,
                        }}
                    >
                        {/* Search bar */}
                        <div
                            style={{
                                padding: `${colors.spacing['3']}px ${colors.spacing['4']}px`,
                                borderBottom: `1px solid ${colors.semantic.border.default}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: colors.spacing['2'],
                            }}
                        >
                            {/* Magnifier icon — inline SVG; no extra dep */}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                                style={{ color: colors.semantic.text.muted, flexShrink: 0 }}
                            >
                                <path
                                    d="M6.5 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM14 14l-3-3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                role="combobox"
                                aria-expanded={true}
                                aria-autocomplete="list"
                                aria-controls={ctx.listId}
                                aria-activedescendant={ctx.activeId ?? undefined}
                                onKeyDown={handleInputKeyDown}
                                autoComplete="off"
                                spellCheck={false}
                                placeholder={placeholder}
                                value={ctx.query}
                                onChange={(e) => ctx.setQuery(e.target.value)}
                                style={
                                    {
                                        flex: 1,
                                        fontSize: 15,
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: colors.semantic.text.default,
                                        width: '100%',
                                    } as React.CSSProperties
                                }
                            />
                        </div>
                        {/* Items list */}
                        <div
                            ref={listRef}
                            id={ctx.listId}
                            role="listbox"
                            style={{ overflowY: 'auto', flex: 1, maxHeight: 400 }}
                        >
                            {children}
                        </div>
                    </div>
                ) : (
                    <View style={{ flex: 1 }}>
                        <RNTextInput
                            placeholder={placeholder}
                            placeholderTextColor={colors.semantic.text.muted}
                            value={ctx.query}
                            onChangeText={ctx.setQuery}
                            autoFocus={ctx.open}
                            style={{
                                fontSize: 15,
                                color: colors.semantic.text.default,
                                paddingHorizontal: px(colors.spacing['4']),
                                paddingVertical: px(colors.spacing['3']),
                                borderBottomWidth: 1,
                                borderBottomColor: colors.semantic.border.default,
                            }}
                        />
                        <ScrollView style={{ maxHeight: 400 }}>{children}</ScrollView>
                    </View>
                )}
            </Dialog.Content>
        </Dialog>
    );
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export type CommandEmptyProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Shown when the current query has no matching Command.Item descendants.
 */
const CommandEmpty = ({ children, className, testID }: CommandEmptyProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();

    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                role="status"
                aria-live="polite"
                className={cn('nori-command-empty', className)}
                style={
                    {
                        paddingTop: colors.spacing['6'],
                        paddingBottom: colors.spacing['6'],
                        paddingLeft: colors.spacing['4'],
                        paddingRight: colors.spacing['4'],
                        textAlign: 'center',
                        color: colors.semantic.text.muted,
                        fontSize: 14,
                    } as React.CSSProperties
                }
            >
                {children ?? t('command.empty')}
            </div>
        );
    }
    return (
        <View
            testID={testID}
            style={{
                paddingVertical: px(colors.spacing['6']),
                paddingHorizontal: px(colors.spacing['4']),
                alignItems: 'center',
            }}
        >
            <RNText style={{ color: colors.semantic.text.muted, fontSize: 14 }}>
                {typeof children === 'string' ? children : t('command.empty')}
            </RNText>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export type CommandGroupProps = {
    /** Section heading. */
    heading?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Labelled group of Command.Item elements.
 * Hides itself when all its items are filtered out.
 */
const CommandGroup = ({ heading, children, className, testID }: CommandGroupProps) => {
    const ctx = useCommandContext('Command.Group');
    const groupId = useId();
    const colors = useThemeColors();

    const visibleCount = countVisibleItems(children, ctx.query);

    if (visibleCount === 0) {
        return null;
    }

    if (Platform.OS === 'web') {
        return (
            <section
                data-testid={testID}
                aria-labelledby={heading ? `${groupId}-heading` : undefined}
                className={cn('nori-command-group', className)}
            >
                {heading && (
                    <div
                        id={`${groupId}-heading`}
                        style={
                            {
                                padding: `${colors.spacing['2']}px ${colors.spacing['4']}px ${colors.spacing['1']}px`,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: colors.semantic.text.muted,
                            } as React.CSSProperties
                        }
                    >
                        {heading}
                    </div>
                )}
                <div style={{ paddingBottom: colors.spacing['2'] }}>{children}</div>
            </section>
        );
    }

    return (
        <View testID={testID}>
            {heading && (
                <View
                    style={{
                        paddingHorizontal: px(colors.spacing['4']),
                        paddingTop: px(colors.spacing['2']),
                        paddingBottom: px(colors.spacing['1']),
                    }}
                >
                    <RNText
                        style={{
                            fontSize: 11,
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: colors.semantic.text.muted,
                            letterSpacing: 0.5,
                        }}
                    >
                        {heading}
                    </RNText>
                </View>
            )}
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export type CommandItemProps = {
    /** Fires when the item is selected (click or Enter). */
    onSelect?: () => void;
    /** Disable the item. @defaultValue false */
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Selectable command item. Filters itself out when the current query does
 * not match its text content.
 */
const CommandItem = ({ onSelect, disabled = false, children, className, testID }: CommandItemProps) => {
    const ctx = useCommandContext('Command.Item');
    const colors = useThemeColors();
    const itemId = useId();
    const active = ctx.activeId === itemId;

    const text = extractText(children);
    const visible = matchesQuery(text, ctx.query);

    if (!visible) {
        return null;
    }

    const handleSelect = () => {
        if (disabled) {
            return;
        }
        onSelect?.();
        ctx.setOpen(false);
    };

    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                id={itemId}
                role="option"
                aria-selected={active}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                className={cn('nori-command-item', className)}
                onClick={handleSelect}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSelect();
                    }
                }}
                // Pointer, focus, and arrow keys all move the same active
                // item, so exactly one row is highlighted at a time.
                onMouseEnter={() => {
                    if (!disabled) {
                        ctx.setActiveId(itemId);
                    }
                }}
                onFocus={() => {
                    if (!disabled) {
                        ctx.setActiveId(itemId);
                    }
                }}
                style={
                    {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${colors.spacing['2']}px ${colors.spacing['4']}px`,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: active ? `${colors.semantic.interactive.primary}14` : 'transparent',
                        opacity: disabled ? 0.5 : 1,
                        fontSize: 14,
                        color: colors.semantic.text.default,
                        borderRadius: colors.radius.sm,
                        margin: `0 ${colors.spacing['1']}px`,
                        outline: 'none',
                    } as React.CSSProperties
                }
            >
                {children}
            </div>
        );
    }

    return (
        <Pressable
            testID={testID}
            onPress={handleSelect}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }: { pressed: boolean }) => ({
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                justifyContent: 'space-between' as const,
                paddingHorizontal: px(colors.spacing['4']),
                paddingVertical: px(colors.spacing['3']),
                opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            })}
        >
            {typeof children === 'string' ? (
                <RNText style={{ fontSize: 14, color: colors.semantic.text.default }}>{children}</RNText>
            ) : (
                children
            )}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// Shortcut
// ---------------------------------------------------------------------------

export type CommandShortcutProps = {
    children?: ReactNode;
    className?: string;
};

/**
 * Keyboard shortcut hint rendered right-aligned inside a Command.Item.
 */
const CommandShortcut = ({ children, className }: CommandShortcutProps) => {
    const colors = useThemeColors();

    if (Platform.OS === 'web') {
        return (
            <span
                aria-hidden="true"
                className={cn('nori-command-shortcut', className)}
                style={{
                    marginLeft: 'auto',
                    fontSize: 12,
                    color: colors.semantic.text.muted,
                    letterSpacing: '0.05em',
                    opacity: 0.7,
                }}
            >
                {children}
            </span>
        );
    }

    return (
        <RNText
            style={{
                fontSize: 12,
                color: colors.semantic.text.muted,
                opacity: 0.7,
            }}
        >
            {typeof children === 'string' ? children : null}
        </RNText>
    );
};

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/** Extract concatenated text from a ReactNode tree for query matching. */
function extractText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(extractText).join(' ');
    }
    if (isValidElement(node)) {
        const el = node as ReactElement<{ children?: ReactNode }>;
        return extractText(el.props.children);
    }
    return '';
}

/** Case-insensitive substring match. Empty query matches everything. */
function matchesQuery(text: string, query: string): boolean {
    if (!query.trim()) {
        return true;
    }
    return text.toLowerCase().includes(query.toLowerCase().trim());
}

/**
 * Count how many items under `children` are visible for the given query.
 *
 * Children are classified by component identity: `Command.Empty` never
 * counts, `Command.Group` and fragments are looked through, and anything else
 * (a `Command.Item` or a consumer's own item wrapper) counts when its text
 * matches.
 */
function countVisibleItems(children: ReactNode, query: string): number {
    let count = 0;
    Children.forEach(children, (child) => {
        if (!isValidElement(child) || child.type === CommandEmpty) {
            return;
        }
        const childChildren = (child.props as { children?: ReactNode }).children;
        if (child.type === CommandGroup || child.type === Fragment) {
            count += countVisibleItems(childChildren, query);
            return;
        }
        if (matchesQuery(extractText(childChildren), query)) {
            count++;
        }
    });
    return count;
}

/** Selectable option elements inside the list, in DOM (visual) order. */
function getEnabledOptions(list: HTMLElement | null): HTMLElement[] {
    if (!list) {
        return [];
    }
    return Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).filter(
        (option) => option.getAttribute('aria-disabled') !== 'true'
    );
}

// ---------------------------------------------------------------------------
// Public Dialog wrapper: auto-show Empty when no item is visible
// ---------------------------------------------------------------------------

/**
 * Wraps CommandDialogInner to surface Command.Empty only when every item is
 * filtered away. This is what is exposed as `Command.Dialog`.
 */
const CommandDialogWrapper = (props: CommandDialogProps) => {
    const ctx = useCommandContext('Command.Dialog');
    const { children, ...rest } = props;

    const childList = Children.toArray(children);
    const isEmptyElement = (child: ReactNode) => isValidElement(child) && child.type === CommandEmpty;
    const emptyNode = childList.find(isEmptyElement);
    const anyVisible = countVisibleItems(children, ctx.query) > 0;

    return (
        <CommandDialogInner {...rest}>
            {anyVisible ? childList.filter((child) => !isEmptyElement(child)) : (emptyNode ?? <CommandEmpty />)}
        </CommandDialogInner>
    );
};

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

/**
 * cmdk-style command palette.
 *
 * ```tsx
 * <Command>
 *   <Command.Trigger>
 *     <Button>Search<Kbd>⌘K</Kbd></Button>
 *   </Command.Trigger>
 *   <Command.Dialog placeholder="Type a command or search…">
 *     <Command.Empty>No results found.</Command.Empty>
 *     <Command.Group heading="Suggestions">
 *       <Command.Item onSelect={() => navigate('/calendar')}>Calendar</Command.Item>
 *       <Command.Item onSelect={() => navigate('/emoji')}>Search Emoji</Command.Item>
 *     </Command.Group>
 *     <Command.Group heading="Settings">
 *       <Command.Item onSelect={() => navigate('/profile')}>
 *         Profile<Command.Shortcut>⌘P</Command.Shortcut>
 *       </Command.Item>
 *     </Command.Group>
 *   </Command.Dialog>
 * </Command>
 * ```
 */
export const Command = Object.assign(CommandRoot, {
    Trigger: CommandTrigger,
    Dialog: CommandDialogWrapper,
    Empty: CommandEmpty,
    Group: CommandGroup,
    Item: CommandItem,
    Shortcut: CommandShortcut,
});

// Re-export context hook for advanced use.
export { useCommandContext };

import type React from 'react';
