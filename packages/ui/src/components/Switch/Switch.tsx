'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { Slot } from '../../slot';
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
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? Boolean(checked) : inner;

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
        value ? 'bg-semantic-interactive-primary' : 'bg-neutral-300',
        disabled ? 'opacity-60' : undefined
    );
    const thumbClasses = cn('w-5 h-5 rounded-full bg-white shadow-sm', value ? 'self-end' : 'self-start');

    return (
        <View className={cn('flex-row items-center gap-2', className)}>
            <Pressable onPress={toggle} {...commonProps} className={trackClasses}>
                <View className={thumbClasses} />
            </Pressable>
            {label ? <RNText className="text-md text-semantic-text-default">{label}</RNText> : null}
            {children}
        </View>
    );
}
