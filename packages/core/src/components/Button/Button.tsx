'use client';

import type { ComponentType, ReactNode } from 'react';
import { forwardRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';
import { Slot } from '../../slot';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type IconSlot = ComponentType<{ size?: number; color?: string }>;

export type ButtonProps = Omit<PressableProps, 'disabled' | 'children'> & {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    leadingIcon?: IconSlot;
    trailingIcon?: IconSlot;
    /** If true, the single child becomes the interactive element (Slot pattern). */
    asChild?: boolean;
    className?: string;
    testID?: string;
};

// NativeWind classes — the `dark:` variants flip colors when <html> carries
// the `dark` class (or `data-theme="dark"`); see the tokens Tailwind preset.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        'bg-semantic-interactive-primary hover:bg-semantic-interactive-primaryHover active:bg-semantic-interactive-primaryPressed',
    secondary:
        'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600',
    ghost: 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
    destructive: 'bg-semantic-interactive-destructive hover:opacity-90 active:opacity-80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-md',
    lg: 'h-12 px-5 text-lg',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 20 };

const BASE_CLASSES = 'inline-flex flex-row items-center justify-center gap-2 rounded-md select-none';

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: { fontSize: number } }> = {
    sm: { container: { height: 32, paddingHorizontal: 12 }, text: { fontSize: 14 } },
    md: { container: { height: 40, paddingHorizontal: 16 }, text: { fontSize: 16 } },
    lg: { container: { height: 48, paddingHorizontal: 20 }, text: { fontSize: 18 } },
};

const BASE_STYLE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 6,
};

export const Button = forwardRef<unknown, ButtonProps>(function Button(
    {
        children,
        variant = 'primary',
        size = 'md',
        disabled,
        loading,
        leadingIcon: LeadingIcon,
        trailingIcon: TrailingIcon,
        asChild,
        className,
        onPress,
        testID,
        style,
        ...rest
    },
    forwardedRef
) {
    const colors = useThemeColors();
    const isInoperative = Boolean(disabled) || Boolean(loading);
    const classes = cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isInoperative ? 'opacity-60' : undefined,
        className
    );

    // Inline-style palette per (variant × interaction state). The hook is the
    // source of truth — dark mode and theme overrides flow through it.
    //
    // Why inline (not className): a class-based `:hover { background-color }`
    // can never beat an inline `style={{ backgroundColor }}` — inline wins
    // by CSS specificity. So if we want hover to actually flip the surface
    // color, hover has to be applied inline too. We use Pressable's `style`
    // callback (`{ hovered, pressed }`) which on web is wired up by
    // react-native-web and on native exposes only `pressed`. The className
    // path keeps the same Tailwind variants for the no-NativeWind fallback
    // case (Expo Snack rendering raw JSX without compilation).
    const variantStateColors: Record<ButtonVariant, { rest: string; hover: string; pressed: string }> = {
        primary: {
            rest: colors.semantic.interactive.primary,
            hover: colors.semantic.interactive.primaryHover,
            pressed: colors.semantic.interactive.primaryPressed,
        },
        secondary: {
            rest: colors.semantic.background.subtle,
            // semantic.background.elevated == subtle when applied on a hovered
            // chip, so we step up the neutral scale by one for visible contrast.
            hover: colors.color.neutral['200'],
            pressed: colors.color.neutral['300'],
        },
        ghost: {
            rest: 'transparent',
            hover: colors.semantic.background.subtle,
            pressed: colors.color.neutral['200'],
        },
        destructive: {
            rest: colors.semantic.interactive.destructive,
            // No darker tone token for destructive yet — fall back to a 90% /
            // 80% opacity wash by mixing through rgba. Matches the className
            // hover:opacity-90 / active:opacity-80 fallback.
            hover: colors.semantic.interactive.destructive,
            pressed: colors.semantic.interactive.destructive,
        },
    };
    const variantTextColor: Record<ButtonVariant, string> = {
        primary: colors.semantic.text.inverted,
        secondary: colors.semantic.text.default,
        ghost: colors.semantic.text.default,
        destructive: colors.semantic.text.inverted,
    };

    const stateColors = variantStateColors[variant];
    const computeStateBg = (hovered: boolean, pressed: boolean): string => {
        if (pressed) return stateColors.pressed;
        if (hovered) return stateColors.hover;
        return stateColors.rest;
    };
    // Destructive uses opacity dim instead of a separate color (matches
    // existing className behavior; keeps the red recognisable on press).
    const computeStateOpacity = (hovered: boolean, pressed: boolean): number => {
        if (variant !== 'destructive') return 1;
        if (pressed) return 0.8;
        if (hovered) return 0.9;
        return 1;
    };

    const buildInlineStyle = (state: { hovered?: boolean; pressed?: boolean }): ViewStyle[] => {
        const hovered = Boolean(state.hovered);
        const pressed = Boolean(state.pressed);
        return [
            BASE_STYLE,
            { backgroundColor: computeStateBg(hovered, pressed) },
            SIZE_STYLES[size].container,
            { opacity: isInoperative ? 0.6 : computeStateOpacity(hovered, pressed) },
        ];
    };
    const pressableStyle: PressableProps['style'] = (state) => {
        const inline = buildInlineStyle(state);
        return typeof style === 'function' ? [inline, style(state)] : [inline, style];
    };
    const slotStyle: StyleProp<ViewStyle> = [...buildInlineStyle({}), typeof style === 'function' ? null : style];

    const textColor = variantTextColor[variant];
    const textStyle = { color: textColor, fontSize: SIZE_STYLES[size].text.fontSize, fontWeight: '500' as const };

    const handlePress: NonNullable<PressableProps['onPress']> = (ev) => {
        if (isInoperative) return;
        onPress?.(ev);
    };

    if (asChild) {
        const slotProps: Record<string, unknown> = {
            ref: forwardedRef,
            className: classes,
            style: slotStyle,
            onClick: handlePress as unknown as (...args: unknown[]) => unknown,
            ...rest,
        };
        if (isInoperative) slotProps['aria-disabled'] = true;
        if (loading) slotProps['aria-busy'] = true;
        if (testID !== undefined) slotProps['data-testid'] = testID;
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const pressableExtra: Record<string, unknown> = {};
    if (isInoperative) pressableExtra['aria-disabled'] = true;
    if (loading) pressableExtra['aria-busy'] = true;

    return (
        <Pressable
            ref={forwardedRef as never}
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            accessibilityState={{ disabled: isInoperative, busy: Boolean(loading) }}
            disabled={isInoperative}
            onPress={handlePress}
            className={classes}
            style={pressableStyle}
            {...pressableExtra}
            {...rest}
        >
            {loading ? (
                <Spinner size={ICON_SIZE[size]} label="Loading" color={textColor} />
            ) : LeadingIcon ? (
                <LeadingIcon size={ICON_SIZE[size]} color={textColor} />
            ) : null}
            <RNText
                className={cn('font-medium', SIZE_CLASSES[size].includes('text-') ? undefined : 'text-md')}
                style={textStyle}
            >
                {children}
            </RNText>
            {TrailingIcon ? <TrailingIcon size={ICON_SIZE[size]} color={textColor} /> : null}
        </Pressable>
    );
});
Button.displayName = 'Button';
