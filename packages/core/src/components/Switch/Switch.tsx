'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { AnimatedView } from '../../animation/animated-view';
import { useAnimatedNumber } from '../../animation/use-animated-number';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type SwitchProps = {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (next: boolean) => void;
    label?: string;
    className?: string;
    testID?: string;
    asChild?: boolean;
    children?: ReactNode;
};

// Layout-only base; row gap is theme-driven inside the component.
const ROW_LAYOUT_BASE: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
// Switch track + thumb are tightly coupled — width 40, height 24, thumb
// 20×20, travel 18px. Component-density literals — not from theme.
const TRACK_BASE: ViewStyle = {
    width: 40,
    height: 24,
    borderRadius: 12,
    // Relative so the absolutely-positioned thumb anchors against the
    // track (not the page). The thumb's `left` value transitions between
    // 2 (off) and 18 (on) — see thumb style below.
    position: 'relative',
};
const THUMB_BASE_STYLE: ViewStyle = {
    width: 20,
    height: 20,
    borderRadius: 10,
    // Web: boxShadow (the modern CSS-style replacement for the legacy RN
    // `shadow*` props that react-native-web has deprecated).
    // Native: elevation (Android) — RN ignores boxShadow there.
    ...({ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)' } as ViewStyle),
    elevation: 2,
};

/**
 * Switch — a toggle control with role="switch". Supports controlled + uncontrolled,
 * disabled state, asChild (via Slot), and a visible label that doubles as the
 * accessibility label.
 */
export function Switch({
    checked,
    defaultChecked = false,
    disabled,
    onChange,
    label,
    className,
    testID,
    asChild,
    children,
}: SwitchProps) {
    const colors = useThemeColors();
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? Boolean(checked) : inner;
    // Pulled up here (above the asChild early-return) so the hook is
    // called on every render path, not conditionally. The slide isn't
    // used in the asChild branch, but the wasted work is tiny.
    const slide = useAnimatedNumber('left', value ? 18 : 2);

    const toggle = useCallback(() => {
        if (disabled) return;
        const next = !value;
        if (!isControlled) setInner(next);
        onChange?.(next);
    }, [disabled, value, isControlled, onChange]);

    const ariaChecked: 'true' | 'false' = value ? 'true' : 'false';

    const commonProps: Record<string, unknown> = {
        role: 'switch',
        'aria-checked': ariaChecked,
        accessibilityRole: 'switch' as const,
        accessibilityState: { checked: value, disabled: Boolean(disabled) },
        testID,
    };
    if (disabled) commonProps['aria-disabled'] = true;
    if (label !== undefined) {
        commonProps['aria-label'] = label;
        commonProps.accessibilityLabel = label;
    }

    if (asChild) {
        const slotProps: Record<string, unknown> = {
            role: 'switch',
            'aria-checked': ariaChecked,
            onClick: toggle,
        };
        if (disabled) slotProps['aria-disabled'] = true;
        if (label !== undefined) slotProps['aria-label'] = label;
        if (testID !== undefined) slotProps['data-testid'] = testID;
        if (className !== undefined) slotProps.className = className;
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const trackClasses = cn(
        'w-10 h-6 rounded-full justify-center px-0.5 transition-colors',
        value ? 'bg-semantic-interactive-primary' : 'bg-neutral-300 dark:bg-neutral-700',
        disabled ? 'opacity-60' : undefined
    );
    // Position is set inline below (absolute + animated `left`), so no
    // self-start/self-end classes here — they'd fight the inline position.
    const thumbClasses = cn('w-5 h-5 rounded-full bg-white dark:bg-neutral-100 shadow-sm');

    const trackStyle = [
        TRACK_BASE,
        {
            backgroundColor: value ? colors.semantic.interactive.primary : colors.color.neutral['600'],
            // Subtle 180ms color transition between off → on. Web only;
            // native has no equivalent for the track tint in v1.
            ...({ transitionProperty: 'background-color', transitionDuration: '180ms' } as ViewStyle),
        },
        disabled ? { opacity: 0.6 } : null,
    ];
    // Thumb stays a near-white disc — we deliberately don't go to a dark
    // grey on dark mode because the thumb needs to read as the "moveable
    // puck" against the track in both schemes.
    //
    // Animation: thumb slides between left:2 (off) and left:18 (on) —
    // track width 40 - padding 2 - thumb 20 = 18 px travel. The
    // useAnimatedNumber hook picks the right engine per platform (web
    // CSS transition / reanimated spring / RN Animated). The hook is
    // called once at the top of the function — see the `slide` above.
    const thumbStyle = [
        THUMB_BASE_STYLE,
        {
            backgroundColor: colors.color.neutral['50'],
            position: 'absolute' as const,
            top: 2,
        } as ViewStyle,
        slide as ViewStyle,
    ];

    // Whole-row Pressable so clicking the label toggles the switch. The
    // visible track is a non-interactive View — one role="switch" per
    // logical control, not two competing hit-areas.
    const rowStyle: ViewStyle = { ...ROW_LAYOUT_BASE, gap: px(colors.spacing['2']) };

    return (
        <Pressable
            onPress={toggle}
            {...commonProps}
            className={cn('flex-row items-center gap-2', className)}
            style={rowStyle}
        >
            <View className={trackClasses} style={trackStyle}>
                {/*
                 * Animated.View — the slide style fragment from
                 * `useAnimatedNumber` contains an `Animated.Value` on
                 * native; a plain `View` would render the value as 0
                 * (no animation). On web, the same fragment is plain
                 * CSS and `Animated.View` falls through to a regular
                 * div via react-native-web.
                 */}
                <AnimatedView className={thumbClasses} style={thumbStyle} />
            </View>
            {label ? (
                <RNText
                    className="text-md text-semantic-text-default"
                    style={{
                        color: colors.semantic.text.default,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.md),
                    }}
                >
                    {label}
                </RNText>
            ) : null}
            {children}
        </Pressable>
    );
}
