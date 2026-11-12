'use client';

import type { ReactNode, Ref } from 'react';
import { isValidElement, useState } from 'react';
import type { GestureResponderEvent, StyleProp, TextStyle } from 'react-native';
import { Linking, Platform, Text as RNText, StyleSheet } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { Slot } from '../../slot';
import type { Theme } from '../../theme/generated-tokens';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type LinkVariant = 'default' | 'muted';
export type LinkUnderline = 'always' | 'hover' | 'none';
export type LinkSize = 'xs' | 'sm' | 'md' | 'lg' | 'inherit';

export type LinkProps = {
    /** Link content. Usually a string; any inline node works. */
    children?: ReactNode;
    /**
     * Destination URL. On web it becomes the `href` of a real `<a>` element.
     * On native it is opened with `Linking.openURL` when the link is pressed,
     * unless `onPress` is set.
     */
    href?: string;
    /**
     * Press handler. When set it replaces the default navigation on both
     * platforms: the web click is canceled (`preventDefault`) and native does
     * not call `Linking.openURL`. On web, modified clicks (Cmd, Ctrl, Shift,
     * Alt, middle button) on a link with `href` skip `onPress` so the browser
     * can open a new tab or window.
     */
    onPress?: (event: GestureResponderEvent) => void;
    /**
     * Marks the destination as external. On web: sets `target="_blank"` and
     * `rel="noopener noreferrer"`, and appends the translated
     * `link.opensInNewTab` hint to the accessible name. No effect on native,
     * where every `href` already opens outside the app.
     * @defaultValue false
     */
    external?: boolean;
    /**
     * Color treatment. `default` uses the primary interactive color; `muted`
     * uses the muted text color and darkens on hover.
     * @defaultValue 'default'
     */
    variant?: LinkVariant;
    /**
     * When the underline is drawn. `always`: permanently. `hover`: on pointer
     * hover and keyboard focus (web only; never on native). `none`: never.
     * @defaultValue 'always'
     */
    underline?: LinkUnderline;
    /**
     * Font size, on the same scale as `Text`'s `body-xs` … `body-lg`
     * variants. `inherit` sets no font size, so a link nested in a `Text`
     * takes the size of the surrounding text.
     * @defaultValue 'md'
     */
    size?: LinkSize;
    /**
     * Disables the link: it is not pressable, loses its `href` on web (so it
     * leaves the tab order and cannot be followed), and exposes
     * `aria-disabled`.
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * Render the single child element instead of the built-in anchor and
     * merge the link styling into it. Use it to wrap a router link such as
     * Next.js `Link` or expo-router `Link`. The child owns navigation.
     * @defaultValue false
     */
    asChild?: boolean;
    /** Tailwind / NativeWind classes merged onto the link element. */
    className?: string;
    /** Style override merged after the themed link style. */
    style?: StyleProp<TextStyle>;
    /** Test identifier. Maps to `data-testid` on web. */
    testID?: string;
    /** Ref to the underlying text element (the `<a>` on web). */
    ref?: Ref<RNText>;
};

type SizeKey = Exclude<LinkSize, 'inherit'>;
const FONT_SIZE_KEY: Record<SizeKey, keyof Theme['fontSize']> = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg' };

const SIZE_CLASSES: Record<LinkSize, string | undefined> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-lg',
    inherit: undefined,
};

const VARIANT_CLASSES: Record<LinkVariant, string> = {
    default: 'text-semantic-interactive-primary',
    muted: 'text-semantic-text-muted',
};

const UNDERLINE_CLASSES: Record<LinkUnderline, string> = {
    always: 'underline',
    hover: 'no-underline',
    none: 'no-underline',
};

// Keeps the "opens in a new tab" hint in the accessibility tree (and so in the
// link's accessible name) without painting it. `display: none` would remove
// it from the name computation.
const VISUALLY_HIDDEN = {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
} as unknown as TextStyle;

type WebClickEvent = {
    preventDefault?: () => void;
    button?: number;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
};

type WebFocusEvent = { target?: { matches?: (selector: string) => boolean } };

type WebKeyboardEvent = { key?: string; preventDefault?: () => void };

const isModifiedClick = (event: WebClickEvent): boolean =>
    Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) ||
    (event.button !== undefined && event.button !== 0);

// Pointer focus should not draw the ring; `:focus-visible` is the browser's
// own heuristic for "focus arrived by keyboard". Environments without it
// (old engines, test DOMs) fall back to always showing the ring, which errs
// on the accessible side.
const isKeyboardFocus = (event: WebFocusEvent): boolean => {
    try {
        return event.target?.matches?.(':focus-visible') ?? true;
    } catch {
        return true;
    }
};

/**
 * Inline or standalone text link.
 *
 * On web it renders a real `<a href>` (react-native-web turns a `Text` with
 * `href` into an anchor), so the browser's link behavior — open in new tab,
 * copy address, crawling — keeps working. On native it renders a pressable
 * `Text` with `role="link"` that opens `href` through `Linking.openURL`.
 *
 * ```tsx
 * <Text>
 *     Read the <Link href="https://example.com/docs">documentation</Link>.
 * </Text>
 * ```
 */
export const Link = ({
    children,
    href,
    onPress,
    external = false,
    variant = 'default',
    underline = 'always',
    size = 'md',
    disabled = false,
    asChild = false,
    className,
    style,
    testID,
    ref,
}: LinkProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);
    const [pressed, setPressed] = useState(false);

    const isWeb = Platform.OS === 'web';
    const isActive = !disabled && (hovered || focusVisible);

    const restColor = variant === 'muted' ? colors.semantic.text.muted : colors.semantic.interactive.primary;
    const activeColor = variant === 'muted' ? colors.semantic.text.default : colors.semantic.interactive.primaryHover;
    const underlined = underline === 'always' || (underline === 'hover' && isActive);

    // One plain object (no arrays, no `lineHeight`) so the same style is valid
    // on an RN `Text` and on a DOM element reached through `asChild`: React DOM
    // rejects style arrays and reads a numeric `lineHeight` as a multiplier.
    const themedStyle: TextStyle = {
        color: isActive ? activeColor : restColor,
        fontFamily: colors.fontFamily.body,
        ...(size === 'inherit' ? {} : { fontSize: px(colors.fontSize[FONT_SIZE_KEY[size]]) }),
        textDecorationLine: underlined ? 'underline' : 'none',
        ...(disabled ? { opacity: 0.6 } : pressed ? { opacity: 0.6 } : {}),
    };

    const classes = cn(
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        UNDERLINE_CLASSES[underline],
        disabled ? 'opacity-60' : undefined,
        className
    );

    const handleWebClick = (event: WebClickEvent) => {
        if (disabled) {
            event.preventDefault?.();
            return;
        }
        if (!onPress) {
            return;
        }
        if (href !== undefined && isModifiedClick(event)) {
            return;
        }
        event.preventDefault?.();
        onPress(event as unknown as GestureResponderEvent);
    };

    const handleNativePress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }
        if (onPress) {
            onPress(event);
            return;
        }
        if (href !== undefined) {
            Linking.openURL(href).catch((error: unknown) => {
                if (process.env.NODE_ENV !== 'production') {
                    // biome-ignore lint/suspicious/noConsole: intentional dev-mode warning
                    console.warn(`[Link] Could not open "${href}".`, error);
                }
            });
        }
    };

    if (asChild) {
        const slotProps: Record<string, unknown> = {
            ref,
            className: classes,
            style: style === undefined ? themedStyle : StyleSheet.flatten([themedStyle, style]),
        };
        if (href !== undefined && !disabled) {
            slotProps.href = href;
        }
        if (disabled) {
            slotProps['aria-disabled'] = true;
        }
        // Router links differ in which handler they honor: a DOM-rendering
        // link (Next.js) reacts to `onClick`, while expo-router replaces a
        // passed `onClick` with its own `onPress`. Both skip navigation when
        // the event's default is prevented, which is how `disabled` blocks it.
        const isDomChild = isValidElement(children) && typeof children.type === 'string';
        const blockPress = (event?: { preventDefault?: () => void }) => event?.preventDefault?.();
        if (isWeb) {
            slotProps.onClick = handleWebClick;
            if (!isDomChild) {
                if (disabled) {
                    slotProps.onPress = blockPress;
                } else if (onPress) {
                    slotProps.onPress = onPress;
                }
            }
            if (external) {
                slotProps.target = '_blank';
                slotProps.rel = 'noopener noreferrer';
            }
            if (testID !== undefined) {
                slotProps['data-testid'] = testID;
            }
        } else {
            // The child (a router link) navigates by itself on native, so only
            // forward a handler when the consumer supplied one.
            if (disabled) {
                slotProps.disabled = true;
                slotProps.onPress = blockPress;
            } else if (onPress) {
                slotProps.onPress = onPress;
            }
            if (testID !== undefined) {
                slotProps.testID = testID;
            }
        }
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const focusRing: TextStyle | null =
        focusVisible && !disabled
            ? {
                  outlineStyle: 'solid',
                  outlineWidth: 2,
                  outlineColor: colors.semantic.interactive.primary,
                  outlineOffset: 2,
                  borderRadius: px(colors.radius.sm),
              }
            : null;

    const platformProps: Record<string, unknown> = {};
    if (isWeb) {
        if (href !== undefined && !disabled) {
            platformProps.href = href;
            if (external) {
                platformProps.hrefAttrs = { target: '_blank', rel: 'noopener noreferrer' };
            }
        } else if (onPress && !disabled) {
            // Without `href` there is no anchor element, so the browser gives
            // the node neither a tab stop nor Enter activation.
            platformProps.tabIndex = 0;
            platformProps.onKeyDown = (event: WebKeyboardEvent) => {
                if (event.key === 'Enter') {
                    event.preventDefault?.();
                    onPress(event as unknown as GestureResponderEvent);
                }
            };
        }
        platformProps.onClick = handleWebClick;
        platformProps.onMouseEnter = () => setHovered(true);
        platformProps.onMouseLeave = () => setHovered(false);
        platformProps.onFocus = (event: WebFocusEvent) => setFocusVisible(isKeyboardFocus(event));
        platformProps.onBlur = () => setFocusVisible(false);
    } else {
        platformProps.accessibilityRole = 'link';
        platformProps.accessibilityState = { disabled };
        platformProps.disabled = disabled;
        platformProps.onPress = handleNativePress;
        platformProps.onPressIn = () => setPressed(true);
        platformProps.onPressOut = () => setPressed(false);
        // A 24px minimum target (WCAG 2.5.8) for links whose line box is
        // shorter than that, without changing the inline layout.
        platformProps.hitSlop = { top: 6, bottom: 6, left: 4, right: 4 };
    }

    const showNewTabHint = isWeb && external && href !== undefined && !disabled;

    return (
        <RNText
            ref={ref}
            {...(testID !== undefined ? { testID } : {})}
            role="link"
            {...(disabled ? { 'aria-disabled': true } : {})}
            className={classes}
            {...platformProps}
            style={[themedStyle, focusRing, style]}
        >
            {children}
            {showNewTabHint ? <RNText style={VISUALLY_HIDDEN}>{`, ${t('link.opensInNewTab')}`}</RNText> : null}
        </RNText>
    );
};
