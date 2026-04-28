'use client';

import type { ReactNode } from 'react';
import { useId, useRef } from 'react';
import type { TextInputProps as RNTextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Pressable, Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { px } from '../../theme/px';
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

// Layout-only bases; theme-driven dimensions are merged inside the component.
const CONTAINER_LAYOUT_BASE: ViewStyle = { flexDirection: 'column' };
const FIELD_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
    const inputRef = useRef<RNTextInput | null>(null);
    // Tap on the label → focus the input. Cross-platform: Pressable's
    // onPress fires on web (click) and native (tap), and RNTextInput's
    // imperative `.focus()` works on both. This restores the
    // `<label htmlFor>` UX without resurrecting the host-element crash
    // we hit on native (see comment near the label render).
    const focusInput = () => {
        inputRef.current?.focus();
    };
    const describeId = `${inputId}-describe`;
    const hasError = Boolean(error);
    const describedBy = error || helperText ? describeId : undefined;

    const inputExtras: Record<string, unknown> = {};
    if (testID !== undefined) {
        inputExtras.testID = testID;
    }
    if (label !== undefined) {
        inputExtras.accessibilityLabel = label;
    }
    if (hasError) {
        inputExtras['aria-invalid'] = true;
    }
    if (describedBy !== undefined) {
        inputExtras['aria-describedby'] = describedBy;
    }
    if (multiline !== undefined) {
        inputExtras.multiline = multiline;
    }
    if (numberOfLines !== undefined) {
        inputExtras.numberOfLines = numberOfLines;
    }
    if (onChangeText !== undefined) {
        inputExtras.onChangeText = onChangeText;
    }

    const labelStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        fontWeight: colors.fontWeight.medium as '500',
        color: colors.semantic.text.default,
    };
    const inputStyle: TextStyle = {
        flex: 1,
        paddingVertical: px(colors.spacing['2']),
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.md),
        color: colors.semantic.text.default,
    };
    const helperStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        color: colors.semantic.text.muted,
    };
    const errorStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        color: colors.color.danger,
    };
    const containerStyle: ViewStyle = { ...CONTAINER_LAYOUT_BASE, gap: px(colors.spacing['1']) };
    const fieldStyle = [
        FIELD_LAYOUT_BASE,
        {
            borderRadius: px(colors.radius.md),
            paddingHorizontal: px(colors.spacing['3']),
            backgroundColor: colors.semantic.background.elevated,
            borderColor: hasError ? colors.color.danger : colors.semantic.border.default,
        },
        disabled ? { opacity: 0.6 } : null,
    ];

    return (
        <View className={cn('flex flex-col gap-1', containerClassName)} style={containerStyle}>
            {/*
             * Use RNText for the label so the component renders on both
             * platforms. The previous `<label htmlFor>` worked only on
             * the web (rn-web compiled it through), but on native RN
             * tries to look up `label` as a host component and crashes
             * with "View config getter callback for component `label`
             * must be a function". Click-to-focus on web is a small
             * cost we accept; the underlying RNTextInput still gets
             * `accessibilityLabel={label}` (above) for screen readers.
             */}
            {label !== undefined ? (
                <Pressable onPress={focusInput} accessibilityRole="none" disabled={disabled}>
                    <RNText
                        nativeID={`${inputId}-label`}
                        accessibilityRole="text"
                        className="text-sm font-medium text-semantic-text-default"
                        style={labelStyle}
                    >
                        {label}
                    </RNText>
                </Pressable>
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
                    <View className="mr-2" style={{ marginRight: px(colors.spacing['2']) }}>
                        {leading}
                    </View>
                ) : null}
                <RNTextInput
                    ref={inputRef}
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
                    <View className="ml-2" style={{ marginLeft: px(colors.spacing['2']) }}>
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
