'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
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

// Layout-only base; theme-driven dimensions are merged inside the component.
const ROW_LAYOUT_BASE: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
const BOX_LAYOUT_BASE: ViewStyle = {
    // 20×20 box — component-density literal — not from theme
    width: 20,
    height: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    const colors = useThemeColors();
    const [inner, setInner] = useState<boolean>(defaultChecked);
    const isControlled = checked !== undefined;
    const value = isControlled ? Boolean(checked) : inner;

    const ariaChecked: 'true' | 'false' | 'mixed' = indeterminate ? 'mixed' : value ? 'true' : 'false';
    const isMarked = value || Boolean(indeterminate);

    const toggle = useCallback(() => {
        if (disabled) {
            return;
        }
        const next = !value;
        if (!isControlled) {
            setInner(next);
        }
        onChange?.(next);
    }, [disabled, value, isControlled, onChange]);

    const Check = useSemanticIcon('checkmark');

    const rowStyle: ViewStyle = { ...ROW_LAYOUT_BASE, gap: px(colors.spacing['2']) };
    const boxBaseStyle: ViewStyle = { ...BOX_LAYOUT_BASE, borderRadius: px(colors.radius.sm) };

    const commonProps: Record<string, unknown> = {
        role: 'checkbox',
        'aria-checked': ariaChecked,
        accessibilityRole: 'checkbox' as const,
        accessibilityState: { checked: value, disabled: Boolean(disabled) },
        testID,
    };
    if (disabled) {
        commonProps['aria-disabled'] = true;
    }
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
        if (disabled) {
            slotProps['aria-disabled'] = true;
        }
        if (label !== undefined) {
            slotProps['aria-label'] = label;
        }
        if (testID !== undefined) {
            slotProps['data-testid'] = testID;
        }
        if (className !== undefined) {
            slotProps.className = className;
        }
        return <Slot {...slotProps}>{children}</Slot>;
    }

    const boxClasses = cn(
        'w-5 h-5 rounded-sm border items-center justify-center',
        isMarked && !disabled
            ? 'bg-semantic-interactive-primary border-semantic-interactive-primary'
            : 'bg-semantic-background-elevated border-semantic-border-strong'
    );
    const boxFill: ViewStyle =
        isMarked && !disabled
            ? {
                  backgroundColor: colors.semantic.interactive.primary,
                  borderColor: colors.semantic.interactive.primary,
              }
            : {
                  backgroundColor: colors.semantic.background.elevated,
                  borderColor: colors.semantic.border.strong,
              };

    // The whole row is the interactive element so clicking the label text
    // toggles the checkbox. The visual box is a non-interactive View — one
    // role="checkbox" per logical control, not two competing hit-areas.
    // Indeterminate uses a horizontal dash (the W3C convention) rather than
    // a checkmark, so the user can tell at a glance that the state is
    // "partial / mixed", not "fully checked." Clicking still fires onChange
    // — consumers typically toggle indeterminate off and set checked=true
    // in their handler.
    const inverted = colors.semantic.text.inverted;
    return (
        <Pressable
            onPress={toggle}
            {...commonProps}
            className={cn('flex-row items-center gap-2', disabled ? 'opacity-60' : undefined, className)}
            style={[rowStyle, disabled ? { opacity: 0.6 } : null]}
        >
            <View className={boxClasses} style={[boxBaseStyle, boxFill]}>
                {indeterminate && !disabled ? (
                    <View style={{ width: 10, height: 2, borderRadius: 1, backgroundColor: inverted }} />
                ) : value && !disabled ? (
                    <Check size={14} color={inverted} />
                ) : null}
            </View>
            {children ??
                (label !== undefined ? (
                    <RNText
                        style={{
                            color: colors.semantic.text.default,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.md),
                        }}
                    >
                        {label}
                    </RNText>
                ) : null)}
        </Pressable>
    );
}
