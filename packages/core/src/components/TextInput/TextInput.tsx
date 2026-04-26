'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';
import type { TextInputProps as RNTextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type TextInputProps = Omit<RNTextInputProps, 'editable'> & {
    label?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    /** Pass through a custom wrapper className */
    containerClassName?: string;
    className?: string;
    testID?: string;
    /** Controlled text handler. Optional so uncontrolled usage works too. */
    onChangeText?: (text: string) => void;
    /** Multi-line mode — flipped by TextArea. Default false. */
    multiline?: boolean;
    numberOfLines?: number;
};

const CONTAINER_STYLE: ViewStyle = { flexDirection: 'column', gap: 4 };
const FIELD_BASE_STYLE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    // Clip the textarea's browser-drawn resize grippy inside the rounded
    // border. Without this, the grippy escapes the corner and looks like
    // it belongs to the page, not the input.
    overflow: 'hidden',
};

/**
 * Single-line text input with label, helper, error, and leading/trailing slots.
 *
 * a11y: label is a <label for={id}>; the input is `aria-invalid=true` + labelled
 * by the error/helper text via aria-describedby when present.
 *
 * Color flips with the active scheme — the field surface, border, label, and
 * placeholder all read from the resolved palette via `useThemeColors`.
 */
export function TextInput({
    label,
    helperText,
    error,
    disabled,
    leading,
    trailing,
    containerClassName,
    className,
    testID,
    onChangeText,
    multiline,
    numberOfLines,
    ...rest
}: TextInputProps) {
    const colors = useThemeColors();
    const reactId = useId();
    const inputId = testID ?? `nori-ui-input-${reactId}`;
    const describeId = `${inputId}-describe`;
    const hasError = Boolean(error);
    const describedBy = error || helperText ? describeId : undefined;

    const inputExtras: Record<string, unknown> = {};
    if (testID !== undefined) inputExtras.testID = testID;
    if (label !== undefined) inputExtras.accessibilityLabel = label;
    if (hasError) inputExtras['aria-invalid'] = true;
    if (describedBy !== undefined) inputExtras['aria-describedby'] = describedBy;
    if (multiline !== undefined) inputExtras.multiline = multiline;
    if (numberOfLines !== undefined) inputExtras.numberOfLines = numberOfLines;
    if (onChangeText !== undefined) inputExtras.onChangeText = onChangeText;

    const labelStyle: TextStyle = { fontSize: 14, fontWeight: '500', color: colors.semantic.text.default };
    const inputStyle: TextStyle = {
        flex: 1,
        paddingVertical: 8,
        fontSize: 16,
        color: colors.semantic.text.default,
    };
    const helperStyle: TextStyle = { fontSize: 14, color: colors.semantic.text.muted };
    const errorStyle: TextStyle = { fontSize: 14, color: colors.color.danger };
    const fieldStyle = [
        FIELD_BASE_STYLE,
        {
            backgroundColor: colors.semantic.background.elevated,
            borderColor: hasError ? colors.color.danger : colors.semantic.border.default,
        },
        disabled ? { opacity: 0.6 } : null,
    ];

    return (
        <View className={cn('flex flex-col gap-1', containerClassName)} style={CONTAINER_STYLE}>
            {label !== undefined ? (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-semantic-text-default"
                    style={labelStyle as object}
                >
                    {label}
                </label>
            ) : null}
            <View
                className={cn(
                    'flex-row items-center rounded-md border px-3',
                    hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                    disabled ? 'opacity-60' : undefined
                )}
                style={fieldStyle}
            >
                {leading ? (
                    <View className="mr-2" style={{ marginRight: 8 }}>
                        {leading}
                    </View>
                ) : null}
                <RNTextInput
                    nativeID={inputId}
                    editable={!disabled}
                    className={cn('flex-1 py-2 text-md text-semantic-text-default outline-none', className)}
                    placeholderTextColor={colors.semantic.text.muted}
                    {...inputExtras}
                    {...rest}
                    // Spread `rest` first so callers can extend the input style without
                    // losing inputStyle — RN merges array styles in order, last wins.
                    style={[inputStyle, rest.style]}
                />
                {trailing ? (
                    <View className="ml-2" style={{ marginLeft: 8 }}>
                        {trailing}
                    </View>
                ) : null}
            </View>
            {error ? (
                <RNText
                    nativeID={describeId}
                    className="text-sm text-semantic-interactive-destructive"
                    style={errorStyle}
                >
                    {error}
                </RNText>
            ) : helperText ? (
                <RNText nativeID={describeId} className="text-sm text-semantic-text-muted" style={helperStyle}>
                    {helperText}
                </RNText>
            ) : null}
        </View>
    );
}
