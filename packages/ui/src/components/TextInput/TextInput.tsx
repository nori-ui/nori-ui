import type { ReactNode } from 'react';
import { useId } from 'react';
import type { TextInputProps as RNTextInputProps } from 'react-native';
import { Text as RNText, TextInput as RNTextInput, View } from 'react-native';
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

/**
 * Single-line text input with label, helper, error, and leading/trailing slots.
 *
 * a11y: label is a <label for={id}>; the input is `aria-invalid=true` + labelled
 * by the error/helper text via aria-describedby when present.
 *
 * Notionally RSC-safe — uses only useId() which React 19 guarantees is safe on
 * the server. No "use client" required.
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

    return (
        <View className={cn('flex flex-col gap-1', containerClassName)}>
            {label !== undefined ? (
                <label htmlFor={inputId} className="text-sm font-medium text-semantic-text-default">
                    {label}
                </label>
            ) : null}
            <View
                className={cn(
                    'flex-row items-center rounded-md border px-3',
                    hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                    disabled ? 'opacity-60' : undefined
                )}
            >
                {leading ? <View className="mr-2">{leading}</View> : null}
                <RNTextInput
                    nativeID={inputId}
                    editable={!disabled}
                    className={cn('flex-1 py-2 text-md text-semantic-text-default outline-none', className)}
                    {...inputExtras}
                    {...rest}
                />
                {trailing ? <View className="ml-2">{trailing}</View> : null}
            </View>
            {error ? (
                <RNText nativeID={describeId} className="text-sm text-semantic-interactive-destructive">
                    {error}
                </RNText>
            ) : helperText ? (
                <RNText nativeID={describeId} className="text-sm text-semantic-text-muted">
                    {helperText}
                </RNText>
            ) : null}
        </View>
    );
}
