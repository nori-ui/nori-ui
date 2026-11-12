'use client';

/**
 * Sidebar — collapsible side-panel navigation (compound component).
 *
 * Anatomy:
 *   Sidebar                   Root — owns collapsed state and provides context.
 *   Sidebar.Header            Top area of the panel (logo, workspace switcher, etc.).
 *   Sidebar.Content           Scrollable middle zone containing Groups.
 *   Sidebar.Footer            Pinned bottom area (user row, logout, etc.).
 *   Sidebar.Group             Logical section inside Content.
 *   Sidebar.GroupLabel        Section heading text.
 *   Sidebar.Menu              Ordered list of navigation items.
 *   Sidebar.MenuItem          Single tappable/clickable nav entry with optional icon.
 *
 * Web behaviour:
 *   - Fixed `<aside>` with width transition between collapsed and expanded.
 *   - When collapsed, text labels are hidden; only icons are shown.
 *   - Collapsed label surfaced via `title` attribute (native browser tooltip on web).
 *
 * Native behaviour (v1):
 *   - Always-visible View. Slide-in drawer is a v2 follow-up.
 *   - No collapse — the panel is always expanded on native v1.
 *
 * Accessibility:
 *   - Navigation landmark with a translated label on both platforms.
 *   - Each MenuItem is a button; `aria-current="page"` (web) or the
 *     selected state (native) marks the active one.
 *   - A collapsed, icon-only MenuItem keeps its label as the accessible name.
 */

import { createContext, type ReactNode, useCallback, useContext, useId, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, ScrollView, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SidebarContextValue = {
    collapsed: boolean;
    setCollapsed: (next: boolean) => void;
    toggleCollapsed: () => void;
    navId: string;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext(caller: string): SidebarContextValue {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error(`<${caller}> must be rendered inside <Sidebar>.`);
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SidebarVariant = 'standard' | 'inset' | 'floating';
export type SidebarSide = 'left' | 'right';

export type SidebarProps = {
    /** Controlled collapsed state. */
    collapsed?: boolean;
    /** Uncontrolled initial collapsed state. @defaultValue false */
    defaultCollapsed?: boolean;
    /** Fires with the new collapsed state. */
    onCollapsedChange?: (collapsed: boolean) => void;
    /** Which edge the panel is attached to. @defaultValue 'left' */
    side?: SidebarSide;
    /** Visual variant. @defaultValue 'standard' */
    variant?: SidebarVariant;
    /** Override the navigation landmark's label. @defaultValue translated "Sidebar" */
    ariaLabel?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// ---------------------------------------------------------------------------
// Widths
// ---------------------------------------------------------------------------

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 56;

/**
 * Translucent tint of a theme color. Appending a hex alpha suffix only works
 * for `#rrggbb`, so hex is converted explicitly; any other format goes
 * through `color-mix` on web. Native has no equivalent, so `undefined` there
 * means "no tint".
 */
function tint(color: string, alpha: number): string | undefined {
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
    if (hex) {
        const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
        const r = Number.parseInt(full.slice(0, 2), 16);
        const g = Number.parseInt(full.slice(2, 4), 16);
        const b = Number.parseInt(full.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (Platform.OS === 'web') {
        return `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`;
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

/**
 * Root of the Sidebar compound. Owns collapsed state and provides context
 * to all sub-components.
 */
const SidebarRoot = ({
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    side = 'left',
    variant = 'standard',
    ariaLabel,
    children,
    className,
    testID,
}: SidebarProps) => {
    const { t } = useTranslation();
    const label = ariaLabel ?? t('sidebar.ariaLabel', { defaultValue: 'Sidebar' });
    const [inner, setInner] = useState<boolean>(defaultCollapsed);
    const isControlled = collapsed !== undefined;
    const current = isControlled ? (collapsed as boolean) : inner;
    const navId = useId();
    const colors = useThemeColors();

    const setCollapsed = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInner(next);
            }
            onCollapsedChange?.(next);
        },
        [isControlled, onCollapsedChange]
    );

    const toggleCollapsed = useCallback(() => {
        setCollapsed(!current);
    }, [current, setCollapsed]);

    const ctxValue: SidebarContextValue = {
        collapsed: current,
        setCollapsed,
        toggleCollapsed,
        navId,
    };

    const width = current ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

    const containerStyle: ViewStyle =
        Platform.OS === 'web'
            ? ({
                  position: 'fixed' as unknown as 'absolute',
                  top: 0,
                  bottom: 0,
                  [side]: 0,
                  width,
                  transitionProperty: 'width',
                  transitionDuration: '200ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex' as unknown as undefined,
                  flexDirection: 'column',
                  overflow: 'hidden',
                  zIndex: 40,
              } as ViewStyle)
            : {
                  width,
                  flexDirection: 'column',
                  overflow: 'hidden',
              };

    const variantStyle: ViewStyle =
        Platform.OS === 'web'
            ? variant === 'floating'
                ? ({
                      margin: 8,
                      borderRadius: colors.radius.lg,
                      top: 8,
                      bottom: 8,
                      height: 'auto' as unknown as undefined,
                  } as ViewStyle)
                : variant === 'inset'
                  ? ({
                        boxShadow: '4px 0 16px rgba(0,0,0,0.08)',
                    } as ViewStyle)
                  : {}
            : {};

    const rootStyle: ViewStyle = {
        ...containerStyle,
        ...variantStyle,
        backgroundColor: colors.semantic.background.elevated,
        // The divider sits on the edge that faces the page content.
        ...(side === 'right'
            ? { borderLeftWidth: variant !== 'floating' ? 1 : 0, borderLeftColor: colors.semantic.border.default }
            : { borderRightWidth: variant !== 'floating' ? 1 : 0, borderRightColor: colors.semantic.border.default }),
    };

    if (Platform.OS === 'web') {
        return (
            <SidebarContext.Provider value={ctxValue}>
                <nav
                    id={navId}
                    aria-label={label}
                    data-collapsed={current}
                    data-side={side}
                    data-variant={variant}
                    data-testid={testID}
                    className={cn(
                        'nori-sidebar flex flex-col overflow-hidden transition-[width] duration-200',
                        className
                    )}
                    style={rootStyle as React.CSSProperties}
                >
                    {children}
                </nav>
            </SidebarContext.Provider>
        );
    }

    return (
        <SidebarContext.Provider value={ctxValue}>
            <View style={rootStyle} testID={testID} role="navigation" accessibilityLabel={label}>
                {children}
            </View>
        </SidebarContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export type SidebarHeaderProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Top section of the sidebar — logos, workspace switchers.
 * Fixed at the top; does not scroll.
 */
const SidebarHeader = ({ children, className, testID }: SidebarHeaderProps) => {
    const colors = useThemeColors();
    const style: ViewStyle = {
        padding: px(colors.spacing['4']),
        borderBottomWidth: 1,
        borderBottomColor: colors.semantic.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        gap: px(colors.spacing['2']),
        overflow: 'hidden',
    };
    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                className={cn('nori-sidebar-header', className)}
                style={style as React.CSSProperties}
            >
                {children}
            </div>
        );
    }
    return (
        <View style={style} testID={testID}>
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type SidebarContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Scrollable middle zone containing Group components.
 */
const SidebarContent = ({ children, className, testID }: SidebarContentProps) => {
    const style: ViewStyle = { flex: 1, overflow: 'hidden' };
    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                className={cn('nori-sidebar-content', className)}
                style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
            >
                {children}
            </div>
        );
    }
    return (
        <ScrollView style={style} testID={testID} contentContainerStyle={{ flexGrow: 1 }}>
            {children}
        </ScrollView>
    );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export type SidebarFooterProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Pinned bottom area — user row, logout button, etc.
 */
const SidebarFooter = ({ children, className, testID }: SidebarFooterProps) => {
    const colors = useThemeColors();
    const style: ViewStyle = {
        padding: px(colors.spacing['4']),
        borderTopWidth: 1,
        borderTopColor: colors.semantic.border.default,
        overflow: 'hidden',
    };
    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                className={cn('nori-sidebar-footer', className)}
                style={style as React.CSSProperties}
            >
                {children}
            </div>
        );
    }
    return (
        <View style={style} testID={testID}>
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export type SidebarGroupProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Logical section within Sidebar.Content — wraps a GroupLabel + Menu.
 */
const SidebarGroup = ({ children, className, testID }: SidebarGroupProps) => {
    const colors = useThemeColors();
    const style: ViewStyle = {
        paddingTop: px(colors.spacing['2']),
        paddingBottom: px(colors.spacing['2']),
    };
    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                className={cn('nori-sidebar-group', className)}
                style={style as React.CSSProperties}
            >
                {children}
            </div>
        );
    }
    return (
        <View style={style} testID={testID}>
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// GroupLabel
// ---------------------------------------------------------------------------

export type SidebarGroupLabelProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Section heading inside a Group. Hidden when the sidebar is collapsed.
 */
const SidebarGroupLabel = ({ children, className, testID }: SidebarGroupLabelProps) => {
    const ctx = useSidebarContext('Sidebar.GroupLabel');
    const colors = useThemeColors();

    if (ctx.collapsed) {
        return null;
    }

    const paddingHorizontal = px(colors.spacing['4']);
    const paddingVertical = px(colors.spacing['1']);

    const textStyle = {
        fontSize: 11,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
        color: colors.semantic.text.muted,
    };

    if (Platform.OS === 'web') {
        return (
            <div
                data-testid={testID}
                className={cn('nori-sidebar-group-label', className)}
                style={{ padding: `${paddingVertical}px ${paddingHorizontal}px` }}
            >
                <span style={textStyle as React.CSSProperties}>{children}</span>
            </div>
        );
    }

    return (
        <View style={{ paddingHorizontal, paddingVertical }} testID={testID}>
            <RNText style={textStyle}>{children}</RNText>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export type SidebarMenuProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Ordered list wrapper for MenuItem components.
 */
const SidebarMenu = ({ children, className, testID }: SidebarMenuProps) => {
    const colors = useThemeColors();
    const style: ViewStyle = {
        paddingHorizontal: px(colors.spacing['2']),
        gap: px(colors.spacing['1']),
    };
    if (Platform.OS === 'web') {
        return (
            <ul
                data-testid={testID}
                className={cn('nori-sidebar-menu', className)}
                style={{
                    // `gap` only applies to a flex container.
                    display: 'flex',
                    flexDirection: 'column',
                    gap: px(colors.spacing['1']),
                    listStyle: 'none',
                    margin: 0,
                    padding: `0 ${px(colors.spacing['2'])}px`,
                }}
            >
                {children}
            </ul>
        );
    }
    return (
        <View style={style} testID={testID}>
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

export type SidebarMenuItemProps = {
    /** Optional leading icon. Hidden text when collapsed; icon always shown. */
    icon?: ReactNode;
    /** Mark this item as the current page. Adds aria-current="page". @defaultValue false */
    active?: boolean;
    /** Disable the item. @defaultValue false */
    disabled?: boolean;
    /** Press handler. */
    onPress?: () => void;
    /**
     * Accessible name for the collapsed, icon-only state. Only needed when
     * `children` is not a plain string (a string is used automatically).
     */
    label?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/**
 * Single navigation entry.
 *
 * - Shows icon + label when expanded.
 * - Shows icon only when collapsed (web: label surfaced as title tooltip).
 * - aria-current="page" when active.
 */
const SidebarMenuItem = ({
    icon,
    active = false,
    disabled = false,
    onPress,
    label,
    children,
    className,
    testID,
}: SidebarMenuItemProps) => {
    const ctx = useSidebarContext('Sidebar.MenuItem');
    const colors = useThemeColors();

    const itemStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: px(colors.radius.md),
        paddingHorizontal: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['2']),
        gap: px(colors.spacing['3']),
        opacity: disabled ? 0.5 : 1,
        ...(ctx.collapsed ? { justifyContent: 'center', paddingHorizontal: px(colors.spacing['2']) } : {}),
    };

    const activeBg = active ? tint(colors.semantic.interactive.primary, 0.1) : undefined;
    const labelStr = label ?? (typeof children === 'string' ? children : undefined);
    // Collapsed, the visible text is gone, so the name has to be set explicitly.
    const collapsedLabel = ctx.collapsed ? labelStr : undefined;

    const labelTextStyle = {
        fontSize: 14,
        fontWeight: active ? ('600' as const) : ('400' as const),
        color: active ? colors.semantic.text.default : colors.semantic.text.muted,
        flex: 1,
    };

    if (Platform.OS === 'web') {
        return (
            <li style={{ listStyle: 'none' }}>
                <button
                    type="button"
                    data-testid={testID}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={disabled}
                    title={collapsedLabel}
                    aria-label={collapsedLabel}
                    disabled={disabled}
                    onClick={disabled ? undefined : onPress}
                    className={cn('nori-sidebar-menu-item', className)}
                    style={
                        {
                            display: 'flex',
                            alignItems: 'center',
                            gap: colors.spacing['3'],
                            width: '100%',
                            textAlign: 'left',
                            border: 'none',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            borderRadius: colors.radius.md,
                            padding: ctx.collapsed
                                ? `${px(colors.spacing['2'])}px`
                                : `${px(colors.spacing['2'])}px ${px(colors.spacing['3'])}px`,
                            justifyContent: ctx.collapsed ? 'center' : 'flex-start',
                            background: activeBg ?? 'transparent',
                            opacity: disabled ? 0.5 : 1,
                        } as React.CSSProperties
                    }
                >
                    {icon && (
                        <span className="nori-sidebar-menu-item-icon" aria-hidden="true">
                            {icon}
                        </span>
                    )}
                    {!ctx.collapsed && (
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: active ? 600 : 400,
                                color: active ? colors.semantic.text.default : colors.semantic.text.muted,
                                flex: 1,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {children}
                        </span>
                    )}
                </button>
            </li>
        );
    }

    return (
        <Pressable
            testID={testID}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            accessibilityRole="button"
            {...(collapsedLabel !== undefined ? { accessibilityLabel: collapsedLabel } : {})}
            accessibilityState={{ selected: active, disabled }}
            style={({ pressed }: { pressed: boolean }) => [
                itemStyle,
                activeBg !== undefined ? { backgroundColor: activeBg } : {},
                pressed && { opacity: 0.7 },
            ]}
        >
            {icon && <View>{icon}</View>}
            {!ctx.collapsed && (
                <RNText style={labelTextStyle} numberOfLines={1}>
                    {children}
                </RNText>
            )}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

/**
 * Collapsible side-panel navigation surface.
 *
 * Web: fixed `<aside>` that transitions width between expanded (240px) and
 * collapsed (56px — icons only).
 *
 * Native v1: always-visible View. Slide-in drawer is a v2 follow-up.
 *
 * ```tsx
 * <Sidebar defaultCollapsed={false}>
 *   <Sidebar.Header>
 *     <Text>Acme Inc.</Text>
 *   </Sidebar.Header>
 *   <Sidebar.Content>
 *     <Sidebar.Group>
 *       <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
 *       <Sidebar.Menu>
 *         <Sidebar.MenuItem icon={<HomeIcon />} onPress={goHome}>Home</Sidebar.MenuItem>
 *         <Sidebar.MenuItem icon={<UsersIcon />} active>Team</Sidebar.MenuItem>
 *       </Sidebar.Menu>
 *     </Sidebar.Group>
 *   </Sidebar.Content>
 *   <Sidebar.Footer>
 *     <Button onPress={logout}>Logout</Button>
 *   </Sidebar.Footer>
 * </Sidebar>
 * ```
 */
export const Sidebar = Object.assign(SidebarRoot, {
    Header: SidebarHeader,
    Content: SidebarContent,
    Footer: SidebarFooter,
    Group: SidebarGroup,
    GroupLabel: SidebarGroupLabel,
    Menu: SidebarMenu,
    MenuItem: SidebarMenuItem,
});

// Re-export context hook for advanced use (e.g. a custom collapse toggle).
export { useSidebarContext };

import type React from 'react';
