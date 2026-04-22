import type { ComponentType, ReactNode } from 'react';
import { forwardRef } from 'react';
import type { PressableProps } from 'react-native';
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

    const handlePress: NonNullable<PressableProps['onPress']> = (ev) => {
        if (isInoperative) return;
        onPress?.(ev);
    };

    if (asChild) {
        const slotProps: Record<string, unknown> = {
            ref: forwardedRef,
            className: classes,
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
            {...pressableExtra}
            {...rest}
        >
            {loading ? (
                <Spinner size={ICON_SIZE[size]} label="Loading" />
            ) : LeadingIcon ? (
                <LeadingIcon size={ICON_SIZE[size]} />
            ) : null}
            <RNText className={cn('font-medium', SIZE_CLASSES[size].includes('text-') ? undefined : 'text-md')}>
                {children}
            </RNText>
            {TrailingIcon ? <TrailingIcon size={ICON_SIZE[size]} /> : null}
        </Pressable>
    );
});
Button.displayName = 'Button';
