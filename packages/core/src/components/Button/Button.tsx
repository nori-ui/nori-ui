import { theme } from '@nori-ui/tokens';
import type { ComponentType, ReactNode } from 'react';
import { forwardRef } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';
import { Slot } from '../../slot';
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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        'bg-semantic-interactive-primary hover:bg-semantic-interactive-primaryHover active:bg-semantic-interactive-primaryPressed',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300',
    ghost: 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200',
    destructive: 'bg-semantic-interactive-destructive hover:opacity-90 active:opacity-80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-md',
    lg: 'h-12 px-5 text-lg',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 20 };

const BASE_CLASSES = 'inline-flex flex-row items-center justify-center gap-2 rounded-md select-none';

// Inline fallback styles mirror the NativeWind classes above. They ship so
// the component renders correctly when NativeWind is NOT active (e.g. Expo
// Snack's sandbox, or apps that don't configure NativeWind). When NativeWind
// IS active, its compiled className styles merge with and (where intended)
// override these defaults.
const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.color.primary['600'] },
    secondary: { backgroundColor: theme.color.neutral['100'] },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: theme.color.danger },
};

const VARIANT_TEXT_COLOR: Record<ButtonVariant, string> = {
    primary: '#ffffff',
    secondary: theme.color.neutral['900'],
    ghost: theme.color.neutral['900'],
    destructive: '#ffffff',
};

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
    const isInoperative = Boolean(disabled) || Boolean(loading);
    const classes = cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isInoperative ? 'opacity-60' : undefined,
        className
    );

    const baseInlineStyle: StyleProp<ViewStyle> = [
        BASE_STYLE,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size].container,
        isInoperative ? { opacity: 0.6 } : null,
    ];
    const pressableStyle: PressableProps['style'] =
        typeof style === 'function' ? (state) => [baseInlineStyle, style(state)] : [baseInlineStyle, style];
    const slotStyle: StyleProp<ViewStyle> = [baseInlineStyle, typeof style === 'function' ? null : style];

    const textColor = VARIANT_TEXT_COLOR[variant];
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
