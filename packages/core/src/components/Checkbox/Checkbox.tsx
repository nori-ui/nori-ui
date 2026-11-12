'use client';

import type { ReactNode } from 'react';
import { isValidElement, useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
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
    /** DOM id / nativeID forwarded to the Pressable — used by Field.Control */
    id?: string;
    /**
     * Form field name (web only). While checked and enabled, the control
     * submits `name=on` with an enclosing HTML `<form>`, like a native
     * checkbox.
     */
    name?: string;
    /**
     * Accessible name for screen readers when there is no visible `label`.
     * `Field.Control` sets this on iOS, where `aria-labelledby` has no effect.
     */
    accessibilityLabel?: string;
    /** aria-labelledby forwarded to the Pressable */
    'aria-labelledby'?: string;
    /** React Native accessibilityLabelledBy forwarded to the Pressable */
    accessibilityLabelledBy?: string;
    /** aria-describedby forwarded to the Pressable */
    'aria-describedby'?: string;
    /** React Native accessibilityDescribedBy forwarded to the Pressable */
    accessibilityDescribedBy?: string;
    /** Marks the control as invalid — set by Field.Control when there is an error */
    'aria-invalid'?: boolean;
    /** Marks the control as required — set by Field.Control */
    'aria-required'?: boolean;
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
export const Checkbox = ({
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
    id,
    name,
    accessibilityLabel,
    'aria-labelledby': ariaLabelledBy,
    accessibilityLabelledBy,
    'aria-describedby': ariaDescribedBy,
    accessibilityDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
}: CheckboxProps) => {
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
    if (id !== undefined) {
        commonProps.id = id;
        commonProps.nativeID = id;
    }
    if (disabled) {
        commonProps['aria-disabled'] = true;
    }
    if (label !== undefined) {
        commonProps['aria-label'] = label;
        commonProps.accessibilityLabel = label;
    }
    if (accessibilityLabel !== undefined) {
        commonProps.accessibilityLabel = accessibilityLabel;
    }
    if (ariaLabelledBy !== undefined) {
        commonProps['aria-labelledby'] = ariaLabelledBy;
        commonProps.accessibilityLabelledBy = ariaLabelledBy;
    }
    if (accessibilityLabelledBy !== undefined) {
        commonProps.accessibilityLabelledBy = accessibilityLabelledBy;
    }
    if (ariaDescribedBy !== undefined) {
        commonProps['aria-describedby'] = ariaDescribedBy;
        commonProps.accessibilityDescribedBy = ariaDescribedBy;
    }
    if (accessibilityDescribedBy !== undefined) {
        commonProps.accessibilityDescribedBy = accessibilityDescribedBy;
    }
    if (ariaInvalid) {
        commonProps['aria-invalid'] = true;
    }
    if (ariaRequired) {
        commonProps['aria-required'] = true;
    }

    // react-native-web drops `name`, so on web a hidden input carries the
    // value into an enclosing HTML form. Like a native checkbox, nothing is
    // submitted while unchecked or disabled.
    const formInput =
        Platform.OS === 'web' && name !== undefined && value && !disabled ? (
            <input type="hidden" name={name} value="on" />
        ) : null;

    if (asChild) {
        // A DOM child only understands `onClick` and DOM attributes. Any
        // other child is built on RN's press system, which needs `onPress`
        // and the RN accessibility props.
        const isDomChild = isValidElement(children) && typeof children.type === 'string';
        const slotProps: Record<string, unknown> = {};
        if (isDomChild) {
            for (const [key, propValue] of Object.entries(commonProps)) {
                if (key === 'role' || key === 'id' || key.startsWith('aria-')) {
                    slotProps[key] = propValue;
                }
            }
            if (accessibilityLabel !== undefined && label === undefined) {
                slotProps['aria-label'] = accessibilityLabel;
            }
            if (testID !== undefined) {
                slotProps['data-testid'] = testID;
            }
            slotProps.onClick = toggle;
        } else {
            Object.assign(slotProps, commonProps);
            // Both handlers: RN's press system uses `onPress` and replaces a
            // passed `onClick` with its own; a plain View on web only reacts
            // to `onClick`. Exactly one of them fires.
            slotProps.onPress = toggle;
            slotProps.onClick = toggle;
            if (disabled) {
                slotProps.disabled = true;
            }
        }
        if (className !== undefined) {
            slotProps.className = className;
        }
        return (
            <>
                <Slot {...slotProps}>{children}</Slot>
                {formInput}
            </>
        );
    }

    const boxClasses = cn(
        'w-5 h-5 rounded-sm border items-center justify-center',
        isMarked
            ? 'bg-semantic-interactive-primary border-semantic-interactive-primary'
            : 'bg-semantic-background-elevated border-semantic-border-strong'
    );
    const boxFill: ViewStyle = isMarked
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
                {indeterminate ? (
                    <View style={{ width: 10, height: 2, borderRadius: 1, backgroundColor: inverted }} />
                ) : value ? (
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
            {formInput}
        </Pressable>
    );
};
