'use client';

import type { Theme } from '@nori-ui/tokens';
import type { ComponentType, ReactNode } from 'react';
import { forwardRef, useCallback, useState } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
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
//
// These act as the no-NativeWind fallback (e.g. raw JSX in Expo Snack
// without a compile step) and the dark-mode bridge. The dimensional
// utilities (`rounded-md`, `h-10`, `px-4`, `gap-2`, `text-*`) are kept
// because the inline `style` array always overrides them — so when a
// `<ThemeProvider>` widens spacing/radius/fontSize, the inline values
// win on CSS specificity and the Tailwind class is harmless.
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

// Heights are intentionally hardcoded — they're tightly coupled to the
// button's overall density (a 48px target on lg, 32px on sm). Padding and
// fontSize are pulled from the active theme so a custom theme that scales
// the spacing/fontSize ramps also scales the button. If you want a
// genuinely smaller / taller button, override `theme.spacing` /
// `theme.fontSize` rather than reach for new size literals here.
const HEIGHT_BY_SIZE: Record<ButtonSize, number> = {
    sm: 32,
    md: 40,
    lg: 48,
};
type SizeKeys = { padX: keyof Theme['spacing']; font: keyof Theme['fontSize'] };
const SIZE_KEYS: Record<ButtonSize, SizeKeys> = {
    sm: { padX: '3', font: 'sm' },
    md: { padX: '4', font: 'md' },
    lg: { padX: '5', font: 'lg' },
};

// gap and borderRadius come from the theme inside the component.
const BASE_STYLE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    // rn-web's `Pressable` does not reliably apply a `style` callback's
    // returned values to the rendered DOM (the static portions get
    // dropped). We track hover/press via state and pass `style` as a
    // plain array — that path produces an inline `style="…"` attribute
    // on the button, which beats the dimensional Tailwind utilities on
    // CSS specificity and lets a custom `<ThemeProvider>` flow padding,
    // radius, fontSize, fontFamily, and fontWeight all the way through.
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const handleHoverIn = useCallback(() => setHovered(true), []);
    const handleHoverOut = useCallback(() => {
        setHovered(false);
        setPressed(false);
    }, []);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);
    // When disabled, drop the variant's hover/active class fragments and
    // append `pointer-events-none cursor-not-allowed` so the className
    // path matches the inline-style path: no hover tint, no press tint,
    // and the cursor signals the control is inert. We still keep the
    // base variant bg class so the resting color is right.
    const variantClasses = isInoperative
        ? VARIANT_CLASSES[variant]
              .split(' ')
              .filter((cls) => !cls.startsWith('hover:') && !cls.startsWith('active:'))
              .join(' ')
        : VARIANT_CLASSES[variant];
    const classes = cn(
        BASE_CLASSES,
        variantClasses,
        SIZE_CLASSES[size],
        isInoperative ? 'opacity-60 pointer-events-none cursor-not-allowed' : undefined,
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
            // hover / pressed must be theme-aware. The previous version
            // pulled directly from `color.neutral.{200,300}`, which are
            // raw tokens that DON'T flip per scheme — in dark mode the
            // hovered state ended up light-gray on dark, ruining contrast.
            // `border.default` / `border.strong` invert correctly: in
            // light they read as light-gray washes (next step from
            // `background.subtle`); in dark they read as the darker grays
            // expected for hover/pressed on a dark surface.
            hover: colors.semantic.border.default,
            pressed: colors.semantic.border.strong,
        },
        ghost: {
            rest: 'transparent',
            hover: colors.semantic.background.subtle,
            pressed: colors.semantic.border.default,
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
    // When disabled (or loading), force the rest state — disabled means
    // disabled. The control should NOT visually respond to hover/press,
    // even though the OS still fires those events. Pressable also gets
    // `disabled={true}` on the Pressable below which blocks onPress, but
    // the visual treatment is owned here.
    const stateBg = isInoperative
        ? stateColors.rest
        : pressed
          ? stateColors.pressed
          : hovered
            ? stateColors.hover
            : stateColors.rest;
    // Destructive uses opacity dim instead of a separate color (matches
    // existing className behavior; keeps the red recognisable on press).
    // Same disabled rule as bg: hover/press dim is suppressed when
    // disabled — the static 0.6 opacity below handles the disabled look.
    const stateInteractionOpacity = isInoperative || variant !== 'destructive' ? 1 : pressed ? 0.8 : hovered ? 0.9 : 1;

    // Resolve all dimensional + typographic values from the active theme
    // so a custom theme that scales spacing / fontSize / radius / fontWeight
    // also reshapes every Button on the page.
    const sizeKeys = SIZE_KEYS[size];
    const sizeContainer: ViewStyle = {
        height: HEIGHT_BY_SIZE[size],
        paddingHorizontal: px(colors.spacing[sizeKeys.padX]),
        gap: px(colors.spacing['2']),
        borderRadius: px(colors.radius.md),
    };
    const sizeFontSize = px(colors.fontSize[sizeKeys.font]);

    const inlineBase: ViewStyle[] = [
        BASE_STYLE,
        { backgroundColor: stateBg },
        sizeContainer,
        { opacity: isInoperative ? 0.6 : stateInteractionOpacity },
    ];
    // Resolve the consumer's `style` against the same hover/press state
    // we just computed — this preserves the historical contract where a
    // callback `style` receives the live interaction flags. The RN
    // upstream type only declares `pressed`; rn-web also passes
    // `hovered`. Cast through `unknown` to ship both without a type
    // assertion battle.
    const consumerStyle: StyleProp<ViewStyle> =
        typeof style === 'function' ? style({ pressed, ...({ hovered } as Record<string, unknown>) } as never) : style;
    const pressableStyle: StyleProp<ViewStyle> = [...inlineBase, consumerStyle];
    const slotStyle: StyleProp<ViewStyle> = [...inlineBase, consumerStyle];

    const textColor = variantTextColor[variant];
    const textStyle = {
        color: textColor,
        fontFamily: colors.fontFamily.body,
        fontSize: sizeFontSize,
        fontWeight: colors.fontWeight.medium as '500',
    };

    const handlePress: NonNullable<PressableProps['onPress']> = (ev) => {
        if (isInoperative) {
            return;
        }
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
        if (isInoperative) {
            slotProps['aria-disabled'] = true;
        }
        if (loading) {
            slotProps['aria-busy'] = true;
        }
        if (testID !== undefined) {
            slotProps['data-testid'] = testID;
        }
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const pressableExtra: Record<string, unknown> = {};
    if (isInoperative) {
        pressableExtra['aria-disabled'] = true;
    }
    if (loading) {
        pressableExtra['aria-busy'] = true;
    }

    return (
        <Pressable
            ref={forwardedRef as never}
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            accessibilityState={{ disabled: isInoperative, busy: Boolean(loading) }}
            disabled={isInoperative}
            onPress={handlePress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
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
