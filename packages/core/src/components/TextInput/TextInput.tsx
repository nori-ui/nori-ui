'use client';

import type { ReactNode, Ref } from 'react';
import { useMemo } from 'react';
import type { TextInputProps as RNTextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Platform, TextInput as RNTextInput, View } from 'react-native';
import { composeRefs } from '../../slot/compose-refs';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type TextInputProps = Omit<RNTextInputProps, 'editable'> & {
    disabled?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    /** Pass through a custom wrapper className */
    containerClassName?: string;
    className?: string;
    testID?: string;
    id?: string;
    /**
     * Form field name (web only). Set on the underlying `<input>` /
     * `<textarea>` so an enclosing HTML `<form>` submits the value.
     */
    name?: string;
    /** Ref to the underlying input, e.g. to call `.focus()` or `.blur()`. */
    ref?: Ref<RNTextInput>;
    /** Controlled text handler. Optional so uncontrolled usage works too. */
    onChangeText?: (text: string) => void;
    /** Multi-line mode — flipped by TextArea. Default false. */
    multiline?: boolean;
    numberOfLines?: number;
};

// Layout-only bases; theme-driven dimensions are merged inside the component.
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
 * Single-line text input with leading/trailing slots.
 *
 * Wrap in <Field> + <Field.Control> to get label, description, error, and
 * full a11y wiring (aria-labelledby, aria-describedby, aria-invalid).
 *
 * Color flips with the active scheme — the field surface, border, and
 * placeholder all read from the resolved palette via `useThemeColors`.
 */
export const TextInput = ({
    disabled,
    leading,
    trailing,
    containerClassName,
    className,
    testID,
    id,
    name,
    onChangeText,
    multiline,
    numberOfLines,
    ref,
    ...rest
}: TextInputProps) => {
    const colors = useThemeColors();

    // react-native-web's TextInput does not forward `name`, so on web it is
    // written onto the DOM node directly. That makes the real input take
    // part in HTML form submission, controlled or not.
    const inputRef = useMemo(() => {
        const applyName = (node: RNTextInput | null) => {
            if (Platform.OS !== 'web' || node === null) {
                return;
            }
            const element = node as unknown as Partial<Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>>;
            if (name !== undefined) {
                element.setAttribute?.('name', name);
            } else {
                element.removeAttribute?.('name');
            }
        };
        return composeRefs<RNTextInput>(applyName, ref);
    }, [name, ref]);

    const restAny = rest as Record<string, unknown>;
    const hasError = restAny['aria-invalid'] === true || restAny['aria-invalid'] === 'true';

    const inputExtras: Record<string, unknown> = {};
    if (testID !== undefined) {
        inputExtras.testID = testID;
    }
    if (id !== undefined) {
        inputExtras.id = id;
        inputExtras.nativeID = id;
    }
    if (disabled) {
        // `editable={false}` alone renders a focusable `readonly` input on
        // web that is not announced as disabled.
        inputExtras['aria-disabled'] = true;
        if (Platform.OS === 'web') {
            inputExtras.disabled = true;
        }
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

    const inputStyle: TextStyle = {
        flex: 1,
        paddingVertical: px(colors.spacing['2']),
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.md),
        color: colors.semantic.text.default,
    };

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
        <View className={cn(containerClassName)} style={{ flexDirection: 'column' }}>
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
        </View>
    );
};
