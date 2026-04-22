'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import { Slot } from '../../slot';
import { cn } from '../../utils/cn';

export type CheckboxProps = {
    checked?: boolean;
    defaultChecked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange?: (next: boolean) => void;
    label?: string;
    className?: string;
    testID?: string;
    asChild?: boolean;
    children?: ReactNode;
};

/**
 * Checkbox — supports controlled + uncontrolled state, indeterminate (aria-checked="mixed"),
 * asChild (via Slot), and a visible label that doubles as the accessibility label.
 */
export function Checkbox({
    checked,
    defaultChecked = false,
    indeterminate,
    disabled,
    onChange,
    label,
    className,
    testID,
    asChild,
    children,
}: CheckboxProps) {
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? Boolean(checked) : inner;

    const ariaChecked: 'true' | 'false' | 'mixed' = indeterminate ? 'mixed' : value ? 'true' : 'false';

    const toggle = useCallback(() => {
        if (disabled) return;
        const next = !value;
        if (!isControlled) setInner(next);
        onChange?.(next);
    }, [disabled, value, isControlled, onChange]);

    const Check = useSemanticIcon('checkmark');

    const commonProps: Record<string, unknown> = {
        role: 'checkbox',
        'aria-checked': ariaChecked,
        accessibilityRole: 'checkbox' as const,
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
            role: 'checkbox',
            'aria-checked': ariaChecked,
            onClick: toggle,
        };
        if (disabled) slotProps['aria-disabled'] = true;
        if (label !== undefined) slotProps['aria-label'] = label;
        if (testID !== undefined) slotProps['data-testid'] = testID;
        if (className !== undefined) slotProps.className = className;
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const boxClasses = cn('w-5 h-5 rounded-sm border border-semantic-border-strong items-center justify-center');
    // Inline style mirrors the Tailwind box size so RNW renders a visible hit-target even when
    // NativeWind's className transform is not active (e.g. the playground-web Vite build).
    const boxStyle = {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#52525b',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    };
    const rowStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        opacity: disabled ? 0.6 : 1,
    };

    return (
        <View
            className={cn('flex-row items-center gap-2', disabled ? 'opacity-60' : undefined, className)}
            style={rowStyle}
        >
            <Pressable onPress={toggle} {...commonProps} className={boxClasses} style={boxStyle}>
                {(value || indeterminate) && !disabled ? <Check size={14} color="currentColor" /> : null}
            </Pressable>
            {children ?? (label !== undefined ? <View>{label}</View> : null)}
        </View>
    );
}
