'use client';

// =============================================================================
// FloatButton — cross-platform Floating Action Button (FAB)
//
// Two-component public surface:
//   <FloatButton>             — standalone FAB
//   <FloatButton.Group>       — cluster with click/long-press expansion
//   <FloatButton.BackToTop>   — preset that scrolls a target ref to top
//
// Design direction: restrained-editorial (Linear/Stripe energy). Two-layer
// brand-tinted shadows, subtle hover lift, snappy press scale, no bouncy
// physics. Cross-platform via the same Pressable + inline style pattern
// used in Pagination.
// =============================================================================

import {
    type ComponentProps,
    cloneElement,
    createContext,
    type FC,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { GestureResponderEvent, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, type ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTranslation } from '../../i18n/use-translation';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Badge, type BadgeProps } from '../Badge';

// =============================================================================
// Types
// =============================================================================

export type FloatButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';
export type FloatButtonShape = 'circle' | 'square' | 'extended';
export type FloatButtonSize = 'small' | 'medium' | 'large';
export type FloatButtonPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type FloatButtonGroupTrigger = 'click' | 'longPress' | 'manual';
export type FloatButtonGroupDirection = 'up' | 'down' | 'left' | 'right';

/** Badge passthrough — same shape as our `<Badge>` accepts. */
export type FloatButtonBadge = {
    /** Numeric badge — render the number inside a small pill. */
    count?: number;
    /** Show a dot instead of a count (overrides `count`). */
    dot?: boolean;
    /** Badge tone — defaults to `'danger'` (the canonical "unread" red). */
    tone?: BadgeProps['tone'];
};

type FloatButtonBaseProps = {
    /** Required unless `label` is set. */
    icon?: ReactNode;
    /** Inline label — turns the button extended (auto-sets `shape='extended'`). */
    label?: string;
    /** A11y label — falls back to `label`; required when icon-only. */
    accessibilityLabel?: string;
    /** Visual shape. @defaultValue 'circle' (or 'extended' when both icon + label are set) */
    shape?: FloatButtonShape;
    /** Size — sm=40, md=56, lg=72. @defaultValue 'medium' */
    size?: FloatButtonSize;
    /** Color/tone variant. @defaultValue 'primary' */
    variant?: FloatButtonVariant;
    /** Tooltip — web: hover/focus tooltip; native (in a group): always-visible label chip. */
    tooltip?: string;
    /** Badge — count, dot, or tone passthrough. */
    badge?: FloatButtonBadge;
    /** Disable interaction. */
    disabled?: boolean;
    /** Show a spinner in place of the icon. */
    loading?: boolean;
    /** Animate in/out. @defaultValue true */
    visible?: boolean;
    /** Where to anchor the FAB on the screen. @defaultValue 'bottom-right' */
    placement?: FloatButtonPlacement;
    /**
     * Positioning strategy. `'fixed'` pins to the viewport (web `position: fixed`,
     * native absolute-on-root); `'absolute'` pins to the nearest positioned
     * ancestor — useful for docs previews and any contained-canvas layout.
     * @defaultValue 'fixed'
     */
    positioning?: 'fixed' | 'absolute';
    /** Additional offset from the placement corner (px). @defaultValue { x: 24, y: 24 } web; { x: 16, y: 16 } native */
    offset?: { x?: number; y?: number };
    /**
     * On native, auto-add the device's bottom safe-area inset to the offset.
     * **Default is `false`** because RN has no `position: 'fixed'` — every
     * `FloatButton` is parent-relative, and adding the screen-bottom inset
     * to a card-relative offset pushes the button up by ~34pt for no reason.
     * Set this to `true` only when you're certain the FAB's parent reaches
     * the screen edge (e.g. a root-level container without `SafeAreaView`).
     * @defaultValue false
     */
    respectSafeArea?: boolean;
    /** Anchor link — renders as an `<a>` on web. */
    href?: string;
    /** RTL flips left/right placements. @defaultValue 'ltr' */
    dir?: 'ltr' | 'rtl';
    /** Long-press handler — native first-class, web maps to contextmenu. */
    onLongPress?: (event: GestureResponderEvent) => void;
    /** Forward ARIA attributes (used internally by Group for `aria-haspopup`/`aria-expanded`). */
    'aria-haspopup'?: 'menu' | 'true' | boolean;
    'aria-expanded'?: boolean;
    /**
     * Press handler. We're React-Native-first, so `onPress` is the primary
     * surface and works on both platforms. `onClick` is also accepted for
     * web-mental-model consumers; if BOTH are defined, `onPress` wins (and
     * a dev-only warning fires).
     */
    onPress?: (event: GestureResponderEvent) => void;
    /** Web-y alias for `onPress` — same handler, mapped at the call site. */
    onClick?: (event: { preventDefault?: () => void }) => void;
    className?: string;
    testID?: string;
    /** Set internally when the button lives inside a `<FloatButton.Group>`. */
    children?: ReactNode;
};

export type FloatButtonProps = FloatButtonBaseProps;

// =============================================================================
// Context — shared by Group and its children
// =============================================================================

type FloatButtonGroupContextValue = {
    /** Whether the group is expanded. */
    open: boolean;
    /** Close the group programmatically (used by action items after press). */
    close: () => void;
    /** Direction of expansion. */
    direction: FloatButtonGroupDirection;
    /** Whether items are inside a group — used to skip per-item positioning. */
    insideGroup: true;
    /** Index of the action item, used for staggered animation. */
    indexRef: { next: number };
};

const FloatButtonGroupContext = createContext<FloatButtonGroupContextValue | null>(null);

// =============================================================================
// Constants
// =============================================================================

const SIZE_MAP: Record<FloatButtonSize, { diameter: number; iconSize: number; fontSize: number; padX: number }> = {
    small: { diameter: 40, iconSize: 18, fontSize: 14, padX: 16 },
    medium: { diameter: 56, iconSize: 22, fontSize: 14, padX: 20 },
    large: { diameter: 72, iconSize: 28, fontSize: 16, padX: 28 },
};

const DEFAULT_OFFSET_WEB = 24;
const DEFAULT_OFFSET_NATIVE = 16;

// =============================================================================
// Standalone FloatButton
// =============================================================================

/**
 * Floating Action Button — a fixed-position button that hovers above page
 * content. Cross-platform (web + native), badge-aware, link-capable, and
 * safe-area-aware on native.
 *
 * @example
 * <FloatButton icon={<Plus />} accessibilityLabel="New item" onPress={...} />
 *
 * @example
 * <FloatButton icon={<Help />} label="Help" shape="extended" />
 */
// Defined here as a plain function; the Group / BackToTop static properties
// are attached at the bottom of the file via `Object.assign` so the dist
// `.d.ts` surface preserves them (a bare type cast on the const doesn't
// propagate through tsup's declaration emitter).
const FloatButtonRoot = (props: FloatButtonProps) => {
    const groupCtx = useContext(FloatButtonGroupContext);
    const colors = useThemeColors();
    // Read the context directly (instead of `useSafeAreaInsets()`) so the
    // component degrades silently when no `<SafeAreaProvider>` is mounted —
    // the canonical case on web. With a provider, real insets flow through;
    // without one, we get zeros and no console warning.
    const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const { width: viewportWidth } = useWindowDimensions();

    const {
        icon,
        label,
        accessibilityLabel,
        shape: shapeProp,
        size = groupCtx ? 'small' : 'medium',
        variant = 'primary',
        tooltip,
        badge,
        disabled = false,
        loading = false,
        visible = true,
        placement = 'bottom-right',
        positioning = 'fixed',
        offset,
        respectSafeArea = false,
        href,
        dir = 'ltr',
        onLongPress,
        className,
        testID,
        children,
        onPress,
        onClick,
        'aria-haspopup': ariaHasPopup,
        'aria-expanded': ariaExpanded,
    } = props;

    // `onPress` wins when both are defined — emit a dev-only warning so the
    // intent is unambiguous. (We can't make this a TS error because
    // exactOptionalPropertyTypes + spread in FloatButton.Group fights
    // discriminated unions.)
    if (process.env.NODE_ENV !== 'production' && onPress && onClick) {
        console.warn('<FloatButton>: both `onPress` and `onClick` defined — `onPress` will be used. Pick one.');
    }
    const onPressFn = onPress ?? onClick;

    // Auto-extend when both icon + label are present and shape is unset.
    const shape: FloatButtonShape = shapeProp ?? (label && icon ? 'extended' : 'circle');
    const sizeTokens = SIZE_MAP[size];

    // Tooltip visibility (web: hover/focus; native-in-group: always when group open)
    const [tooltipVisible, setTooltipVisible] = useState(false);

    // Track press-tap separately so we don't run onLongPress -> onPress.
    const longPressFiredRef = useRef(false);

    const handlePress = useCallback(
        (event: GestureResponderEvent) => {
            if (disabled || loading) {
                return;
            }
            if (longPressFiredRef.current) {
                longPressFiredRef.current = false;
                return;
            }
            // If we're inside a Group, close it after a press (unless this IS the
            // group's trigger — group trigger is rendered from inside Group itself,
            // not by a child FloatButton).
            if (groupCtx) {
                groupCtx.close();
            }
            (onPressFn as ((e: GestureResponderEvent) => void) | undefined)?.(event);
        },
        [disabled, loading, groupCtx, onPressFn]
    );

    const handleLongPress = useCallback(
        (event: GestureResponderEvent) => {
            if (disabled || loading) {
                return;
            }
            longPressFiredRef.current = true;
            onLongPress?.(event);
        },
        [disabled, loading, onLongPress]
    );

    // ----- variant resolution -----
    const variantStyle = useMemo(() => resolveVariantStyle(variant, colors), [variant, colors]);

    // ----- positioning -----
    const positionStyle: ViewStyle | null = groupCtx
        ? null // children of a group don't position themselves; the group handles layout
        : resolvePositionStyle({
              placement,
              positioning,
              offset: offset ?? {},
              dir,
              insets,
              viewportWidth,
              respectSafeArea,
          });

    // ----- visibility / disabled opacity -----
    const containerOpacity = visible ? (disabled ? 0.4 : 1) : 0;

    // ----- shape dimensions -----
    const isExtended = shape === 'extended' && Boolean(label);
    const containerDimensions: ViewStyle = isExtended
        ? {
              minWidth: sizeTokens.diameter,
              height: sizeTokens.diameter,
              paddingHorizontal: sizeTokens.padX,
              borderRadius: sizeTokens.diameter / 2,
          }
        : {
              width: sizeTokens.diameter,
              height: sizeTokens.diameter,
              borderRadius: shape === 'square' ? px(colors.radius.lg) : sizeTokens.diameter / 2,
          };

    const a11yLabel = accessibilityLabel ?? label ?? tooltip;

    if (process.env.NODE_ENV !== 'production' && !a11yLabel && icon) {
        console.warn('<FloatButton>: provide `accessibilityLabel` or `label` for icon-only buttons (WCAG 2.2).');
    }

    // ----- shadow tokens (brand-tinted on primary) -----
    const shadowStyle = useMemo(() => resolveShadowStyle(variant, colors), [variant, colors]);

    // ----- inner content (icon + optional label) -----
    const contentNode = (
        <>
            {loading ? (
                <SmallSpinner color={variantStyle.fg} size={sizeTokens.iconSize} />
            ) : (
                <View
                    style={
                        {
                            width: sizeTokens.iconSize,
                            height: sizeTokens.iconSize,
                            alignItems: 'center',
                            justifyContent: 'center',
                            // Sets CSS `color` on the wrapper div under RN-Web
                            // so any nested SVG using `stroke="currentColor"`
                            // or `fill="currentColor"` inherits the variant fg.
                            // RN ignores `color` on a View (it's only valid on
                            // Text) — silently dropped on native.
                            color: variantStyle.fg,
                        } as unknown as ViewStyle
                    }
                >
                    {tintIcon(icon, variantStyle.fg)}
                </View>
            )}
            {isExtended ? (
                <RNText
                    style={{
                        marginLeft: px(colors.spacing['2']),
                        color: variantStyle.fg,
                        fontFamily: colors.fontFamily.body,
                        fontSize: sizeTokens.fontSize,
                        fontWeight: colors.fontWeight.medium as '500',
                        letterSpacing: -0.1,
                        fontVariant: ['tabular-nums'],
                    }}
                    numberOfLines={1}
                >
                    {label}
                </RNText>
            ) : null}
        </>
    );

    // ----- wrapper: positioning + opacity transitions -----
    const wrapperStyle: ViewStyle = {
        ...(positionStyle ?? {}),
        opacity: containerOpacity,
        // Web-only transitions for visibility/scale (silently dropped on native).
        ...(Platform.OS === 'web'
            ? ({
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '180ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: visible ? 'auto' : 'none',
              } as ViewStyle)
            : null),
    };

    // ----- the button itself (Pressable + visual style) -----
    const buttonNode = (
        <Pressable
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
            aria-label={a11yLabel}
            disabled={disabled || loading}
            aria-disabled={disabled || undefined}
            aria-busy={loading || undefined}
            {...(ariaHasPopup !== undefined ? { 'aria-haspopup': ariaHasPopup } : {})}
            {...(ariaExpanded !== undefined ? { 'aria-expanded': ariaExpanded } : {})}
            onPress={handlePress}
            onLongPress={onLongPress ? handleLongPress : undefined}
            // Web hover/focus reveals the tooltip; rely on Pressable's hover state.
            onHoverIn={() => setTooltipVisible(true)}
            onHoverOut={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            // Pre-compute the static style; iOS's Pressable renderer was
            // observed to drop properties from function-form `style` returns
            // intermittently — same bug we hit on the Pagination selected pill.
            // The function form is web-only (where it reads `hovered`); on
            // native we pass a plain object that always renders.
            style={
                Platform.OS === 'web'
                    ? (state) => {
                          const { pressed, hovered } = state as { pressed: boolean; hovered?: boolean };
                          return {
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: pressed
                                  ? variantStyle.bgPressed
                                  : hovered
                                    ? variantStyle.bgHover
                                    : variantStyle.bg,
                              ...(variantStyle.borderColor
                                  ? { borderWidth: 1, borderColor: variantStyle.borderColor }
                                  : null),
                              ...containerDimensions,
                              ...shadowStyle.resting,
                              ...(pressed ? { transform: [{ scale: 0.96 }], ...shadowStyle.pressed } : null),
                              ...(hovered && !pressed
                                  ? { transform: [{ translateY: -1 }], ...shadowStyle.hover }
                                  : null),
                              ...({
                                  transitionProperty: 'background-color, box-shadow, transform',
                                  transitionDuration: '150ms',
                                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                                  cursor: disabled || loading ? 'not-allowed' : 'pointer',
                                  outlineWidth: 0,
                              } as object),
                          } as ViewStyle;
                      }
                    : ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: variantStyle.bg,
                          ...(variantStyle.borderColor
                              ? { borderWidth: 1, borderColor: variantStyle.borderColor }
                              : null),
                          ...containerDimensions,
                          ...shadowStyle.resting,
                      } as ViewStyle)
            }
        >
            {contentNode}
        </Pressable>
    );

    // Web `<a>` wrapper for href integration. Non-anchor on native.
    const linkedButton =
        href && Platform.OS === 'web' ? (
            <a
                href={href}
                aria-label={a11yLabel}
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
                onClick={(e) => {
                    if (onPressFn) {
                        // Let consumer's handler decide; if they call preventDefault we honor it.
                        (onPressFn as (e: { preventDefault?: () => void }) => void)({
                            preventDefault: () => e.preventDefault(),
                        });
                    }
                }}
            >
                {buttonNode}
            </a>
        ) : (
            buttonNode
        );

    // Tooltip chip — always visible on native when inside an open group;
    // hover/focus on web. Skipped if no tooltip text.
    const showTooltip = tooltip && (Platform.OS === 'web' ? tooltipVisible : (groupCtx?.open ?? false));

    return (
        <View className={cn(className)} style={wrapperStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: px(colors.spacing['2']) }}>
                {showTooltip ? <TooltipChip text={tooltip!} /> : null}
                <View style={{ position: 'relative' }}>
                    {linkedButton}
                    {badge ? <BadgeOverlay badge={badge} size={size} /> : null}
                </View>
            </View>
            {children}
        </View>
    );
};

// =============================================================================
// FloatButton.Group
// =============================================================================

export type FloatButtonGroupProps = Omit<FloatButtonProps, 'onPress' | 'onClick' | 'onLongPress'> & {
    /** Trigger mode — `manual` requires `open` to be controlled. @defaultValue 'click' */
    trigger?: FloatButtonGroupTrigger;
    /** Controlled open state. */
    open?: boolean;
    /** Initial open state when uncontrolled. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires whenever the group opens or closes. */
    onOpenChange?: (open: boolean) => void;
    /** Direction the action items expand. @defaultValue 'up' */
    direction?: FloatButtonGroupDirection;
    /** Render a scrim/backdrop behind the open group. @defaultValue false */
    backdrop?: boolean;
    /** Override the trigger icon when collapsed. */
    expandIcon?: ReactNode;
    /** Override the trigger icon when expanded. @defaultValue rotated `expandIcon` (or `icon`) */
    collapseIcon?: ReactNode;
    /** Action items declared as data — alternative to children. */
    actions?: ReadonlyArray<FloatButtonProps>;
};

const FloatButtonGroup: FC<FloatButtonGroupProps> = ({
    trigger = 'click',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    direction = 'up',
    backdrop = false,
    expandIcon,
    collapseIcon,
    actions,
    children,
    ...buttonProps
}) => {
    const isControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const open = isControlled ? (openProp as boolean) : innerOpen;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInnerOpen(next);
            }
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    const close = useCallback(() => setOpen(false), [setOpen]);
    const toggle = useCallback(() => setOpen(!open), [setOpen, open]);

    // Action items: flatten `actions` array into FloatButton children if given.
    const actionItems: ReactNode = actions
        ? actions.map((action, idx) => {
              // biome-ignore lint/suspicious/noArrayIndexKey: deterministic order from caller's array
              return <FloatButton key={`fab-action-${idx}`} {...(action as FloatButtonProps)} />;
          })
        : children;

    // The group's outer container handles positioning; children render inline.
    const groupCtxValue = useMemo<FloatButtonGroupContextValue>(
        () => ({
            open,
            close,
            direction,
            insideGroup: true as const,
            indexRef: { next: 0 },
        }),
        [open, close, direction]
    );

    // Trigger button (uses the same FloatButton render path but without
    // group-context positioning so it stays in the corner).
    const triggerIcon = open
        ? (collapseIcon ?? <RotatedIcon node={expandIcon ?? buttonProps.icon} />)
        : (expandIcon ?? buttonProps.icon);

    return (
        <FloatButtonGroupContext.Provider value={groupCtxValue}>
            {backdrop && open ? <Backdrop onPress={close} positioning={buttonProps.positioning ?? 'fixed'} /> : null}
            <GroupLayout
                direction={direction}
                placement={buttonProps.placement ?? 'bottom-right'}
                positioning={buttonProps.positioning ?? 'fixed'}
                offset={buttonProps.offset ?? {}}
                dir={buttonProps.dir ?? 'ltr'}
            >
                {open ? <View style={groupActionsLayoutStyle(direction)}>{actionItems}</View> : null}
                <FloatButton
                    {...(buttonProps as FloatButtonProps)}
                    icon={triggerIcon}
                    {...(trigger === 'click' ? { onPress: toggle } : {})}
                    {...(trigger === 'longPress' ? { onLongPress: toggle } : {})}
                    aria-haspopup="menu"
                    aria-expanded={open}
                />
            </GroupLayout>
        </FloatButtonGroupContext.Provider>
    );
};

// (assignment moved to the bottom-of-file Object.assign)

// =============================================================================
// FloatButton.BackToTop
// =============================================================================

export type FloatButtonBackToTopProps = Omit<FloatButtonProps, 'icon' | 'onPress' | 'onClick' | 'visible'> & {
    /** Scroll target ref — RN ScrollView. Defaults to window on web. */
    scrollRef?: { current: ScrollView | null };
    /** Show only when the scroll target is past this many px from the top. @defaultValue 400 */
    visibilityThreshold?: number;
};

const FloatButtonBackToTop: FC<FloatButtonBackToTopProps> = ({
    scrollRef,
    visibilityThreshold = 400,
    variant = 'surface',
    ...rest
}) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    // Web: bind to window scroll. Native: caller wires onScroll on their
    // ScrollView and updates an external state — we expose a passive read here.
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
            return;
        }
        const onScroll = () => setVisible(window.scrollY > visibilityThreshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [visibilityThreshold]);

    const onPress = useCallback(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        scrollRef?.current?.scrollTo?.({ y: 0, animated: true });
    }, [scrollRef]);

    return (
        <FloatButton
            {...(rest as FloatButtonProps)}
            variant={variant}
            visible={visible}
            icon={<defaultSemanticIcons.chevronUp size={20} />}
            accessibilityLabel={rest.accessibilityLabel ?? t('floatButton.backToTop', { defaultValue: 'Back to top' })}
            onPress={onPress}
        />
    );
};

// (assignment moved to the bottom-of-file Object.assign)

/**
 * Public `FloatButton` value — the root function plus its `.Group` and
 * `.BackToTop` static members. `Object.assign` produces a value whose
 * inferred type carries the static properties, so `.d.ts` consumers can
 * write `<FloatButton.Group>` without a separate import.
 */
export const FloatButton = Object.assign(FloatButtonRoot, {
    Group: FloatButtonGroup,
    BackToTop: FloatButtonBackToTop,
});

// =============================================================================
// Subcomponents
// =============================================================================

const TooltipChip = ({ text }: { text: string }) => {
    const colors = useThemeColors();
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                backgroundColor: colors.semantic.background.elevated,
                borderRadius: px(colors.radius.sm) + 2,
                borderWidth: 1,
                borderColor: colors.semantic.border.default,
                paddingHorizontal: px(colors.spacing['2']),
                paddingVertical: 4,
                ...(Platform.OS === 'web' ? ({ boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } as object) : null),
            }}
        >
            <RNText
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: 13,
                    lineHeight: 16,
                }}
            >
                {text}
            </RNText>
        </View>
    );
};

const BadgeOverlay = ({ badge, size }: { badge: FloatButtonBadge; size: FloatButtonSize }) => {
    const offsetTop = size === 'large' ? -6 : -4;
    const offsetRight = size === 'large' ? -6 : -4;
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: offsetTop,
                right: offsetRight,
                zIndex: 1,
            }}
        >
            {badge.dot ? (
                <Badge tone={badge.tone ?? 'danger'} appearance="solid">
                    {' '}
                </Badge>
            ) : (
                <Badge tone={badge.tone ?? 'danger'} appearance="solid">
                    {String(badge.count ?? 0)}
                </Badge>
            )}
        </View>
    );
};

const SmallSpinner = ({ color, size }: { color: string; size: number }) => {
    // Tiny CSS spinner on web; on native, defer to an opacity pulse for v1
    // (avoids importing the spinner component into the FloatButton bundle).
    if (Platform.OS === 'web') {
        return (
            <View
                style={
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: 2,
                        borderColor: 'transparent',
                        borderTopColor: color,
                        animationName: 'fb-spin',
                        animationDuration: '700ms',
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'linear',
                    } as unknown as ViewStyle
                }
            />
        );
    }
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: color,
                opacity: 0.6,
            }}
        />
    );
};

const Backdrop = ({ onPress, positioning }: { onPress: () => void; positioning: 'fixed' | 'absolute' }) => {
    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel="Close"
            style={{
                position:
                    Platform.OS === 'web' && positioning === 'fixed' ? ('fixed' as unknown as 'absolute') : 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.32)',
                zIndex: 49,
            }}
        />
    );
};

const RotatedIcon = ({ node, color }: { node: ReactNode; color?: string }) => {
    // Forward the color from the outer `tintIcon` clone down to the inner
    // node — otherwise the morph-to-X icon stays at its default tint while
    // the surrounding FAB icons inherit the variant fg.
    const tintedNode =
        color && isValidElement(node) ? cloneElement(node as ReactElement<{ color?: string }>, { color }) : node;
    return (
        <View
            style={
                {
                    transform: [{ rotate: '45deg' }],
                    // CSS `color` cascades to nested `currentColor` SVGs on web.
                    ...(color ? { color } : null),
                    ...(Platform.OS === 'web'
                        ? {
                              transitionProperty: 'transform',
                              transitionDuration: '200ms',
                              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                          }
                        : null),
                } as unknown as ViewStyle
            }
        >
            {tintedNode}
        </View>
    );
};

const GroupLayout = ({
    direction,
    placement,
    positioning,
    offset,
    dir,
    children,
}: {
    direction: FloatButtonGroupDirection;
    placement: FloatButtonPlacement;
    positioning: 'fixed' | 'absolute';
    offset: { x?: number; y?: number };
    dir: 'ltr' | 'rtl';
    children: ReactNode;
}) => {
    // Read the context directly (instead of `useSafeAreaInsets()`) so the
    // component degrades silently when no `<SafeAreaProvider>` is mounted —
    // the canonical case on web. With a provider, real insets flow through;
    // without one, we get zeros and no console warning.
    const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const { width: viewportWidth } = useWindowDimensions();
    const positionStyle = resolvePositionStyle({
        placement,
        positioning,
        offset,
        dir,
        insets,
        viewportWidth,
        respectSafeArea: false,
    });
    return (
        <View
            style={{
                ...positionStyle,
                flexDirection: direction === 'left' || direction === 'right' ? 'row' : 'column',
                alignItems: direction === 'left' || direction === 'right' ? 'center' : 'flex-end',
                justifyContent: direction === 'up' ? 'flex-end' : 'flex-start',
            }}
        >
            {direction === 'up' || direction === 'left'
                ? children
                : Array.isArray(children)
                  ? [...children].reverse()
                  : children}
        </View>
    );
};

function groupActionsLayoutStyle(direction: FloatButtonGroupDirection): ViewStyle {
    const isVertical = direction === 'up' || direction === 'down';
    return {
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: direction === 'up' ? 12 : 0,
        marginTop: direction === 'down' ? 12 : 0,
        marginRight: direction === 'left' ? 12 : 0,
        marginLeft: direction === 'right' ? 12 : 0,
    };
}

// =============================================================================
// Style resolvers
// =============================================================================

function resolveVariantStyle(
    variant: FloatButtonVariant,
    colors: ReturnType<typeof useThemeColors>
): { bg: string; bgHover: string; bgPressed: string; fg: string; borderColor?: string } {
    switch (variant) {
        case 'primary':
            return {
                bg: colors.semantic.interactive.primary,
                bgHover: colors.semantic.interactive.primaryHover,
                bgPressed: colors.semantic.interactive.primaryPressed,
                fg: colors.semantic.text.inverted,
            };
        case 'secondary':
            return {
                bg: colors.semantic.background.subtle,
                bgHover: colors.semantic.background.elevated,
                bgPressed: colors.semantic.background.subtle,
                fg: colors.semantic.text.default,
                borderColor: colors.semantic.border.default,
            };
        case 'tertiary':
            return {
                bg: 'transparent',
                bgHover: withAlpha(colors.semantic.interactive.primary, 0.08),
                bgPressed: withAlpha(colors.semantic.interactive.primary, 0.12),
                fg: colors.semantic.interactive.primary,
                borderColor: colors.semantic.interactive.primary,
            };
        case 'surface':
            return {
                bg: colors.semantic.background.elevated,
                bgHover: colors.semantic.background.subtle,
                bgPressed: colors.semantic.background.subtle,
                fg: colors.semantic.text.default,
                borderColor: colors.semantic.border.default,
            };
    }
}

function resolveShadowStyle(
    variant: FloatButtonVariant,
    colors: ReturnType<typeof useThemeColors>
): { resting: ViewStyle; hover: ViewStyle; pressed: ViewStyle } {
    if (Platform.OS !== 'web') {
        // RN's elevation prop on Android maps via boxShadow polyfill; keep
        // it minimal to avoid the chunky M3 look. On iOS we rely on RN's
        // native shadow* props.
        return {
            resting: {
                shadowColor: variant === 'primary' ? colors.semantic.interactive.primary : '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: variant === 'primary' ? 0.25 : 0.12,
                shadowRadius: 16,
                elevation: 6,
            } as unknown as ViewStyle,
            hover: {} as ViewStyle,
            pressed: {
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 2,
            } as unknown as ViewStyle,
        };
    }
    const tint = variant === 'primary' ? colors.semantic.interactive.primary : '#000';
    return {
        resting: {
            ...({
                boxShadow: `0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -6px ${withAlpha(tint, variant === 'primary' ? 0.32 : 0.08)}`,
            } as unknown as ViewStyle),
        },
        hover: {
            ...({
                boxShadow: `0 2px 4px rgba(0,0,0,0.08), 0 12px 28px -6px ${withAlpha(tint, variant === 'primary' ? 0.4 : 0.12)}`,
            } as unknown as ViewStyle),
        },
        pressed: {
            ...({ boxShadow: `0 1px 2px rgba(0,0,0,0.06)` } as unknown as ViewStyle),
        },
    };
}

function resolvePositionStyle({
    placement,
    positioning = 'fixed',
    offset,
    dir,
    insets,
    viewportWidth,
    respectSafeArea,
}: {
    placement: FloatButtonPlacement;
    positioning?: 'fixed' | 'absolute';
    offset: { x?: number; y?: number };
    dir: 'ltr' | 'rtl';
    insets: { top: number; right: number; bottom: number; left: number };
    viewportWidth: number;
    respectSafeArea: boolean;
}): ViewStyle {
    const defaultOffset = Platform.OS === 'web' ? DEFAULT_OFFSET_WEB : DEFAULT_OFFSET_NATIVE;
    const x = offset.x ?? defaultOffset;
    const y = offset.y ?? defaultOffset;
    const safeBottom = Platform.OS !== 'web' && respectSafeArea ? insets.bottom : 0;
    const safeTop = Platform.OS !== 'web' && respectSafeArea ? insets.top : 0;

    // RTL flips left/right placements.
    const flippedPlacement: FloatButtonPlacement =
        dir === 'rtl'
            ? placement === 'bottom-right'
                ? 'bottom-left'
                : placement === 'bottom-left'
                  ? 'bottom-right'
                  : placement === 'top-right'
                    ? 'top-left'
                    : 'top-right'
            : placement;

    // RN doesn't have `position: 'fixed'` — only `'absolute'`. On web RN-Web
    // accepts the cast. The `positioning` prop also lets consumers force
    // `'absolute'` so the FAB pins to a positioned ancestor (docs previews).
    const cssPosition: ViewStyle['position'] =
        Platform.OS === 'web' && positioning === 'fixed' ? ('fixed' as unknown as 'absolute') : 'absolute';
    const base: ViewStyle = {
        position: cssPosition,
        zIndex: 50,
    };

    switch (flippedPlacement) {
        case 'bottom-right':
            return { ...base, bottom: y + safeBottom, right: x };
        case 'bottom-left':
            return { ...base, bottom: y + safeBottom, left: x };
        case 'top-right':
            return { ...base, top: y + safeTop, right: x };
        case 'top-left':
            return { ...base, top: y + safeTop, left: x };
    }
    // Suppress viewportWidth warning — reserved for future RTL/horizontal logic.
    void viewportWidth;
    return base;
}

/**
 * Force the icon's color to match the FAB's variant fg. Works for our
 * `IconComponentProps`-shaped icons (which accept `{ size, color }`) by
 * cloning the element with the resolved color; raw nodes pass through
 * unchanged and rely on the wrapper's CSS `color` for `currentColor`-based
 * SVGs. Consumer-supplied colors are intentionally overridden — inside a
 * primary FAB the icon should always read against the primary surface.
 */
function tintIcon(icon: ReactNode, color: string): ReactNode {
    if (!isValidElement(icon)) {
        return icon;
    }
    return cloneElement(icon as ReactElement<{ color?: string }>, { color });
}

function withAlpha(color: string, alpha: number): string {
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
        const expanded =
            color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
        const r = Number.parseInt(expanded.slice(1, 3), 16);
        const g = Number.parseInt(expanded.slice(3, 5), 16);
        const b = Number.parseInt(expanded.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
}

// Suppress unused — ComponentProps reserved for future href-prop polymorphism.
type _Unused = ComponentProps<'button'>;
