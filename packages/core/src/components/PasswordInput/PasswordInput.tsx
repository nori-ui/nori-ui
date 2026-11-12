'use client';

import type { Ref } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import { composeRefs } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { TextInput, type TextInputProps } from '../TextInput';

export type PasswordInputProps = Omit<
    TextInputProps,
    'secureTextEntry' | 'trailing' | 'multiline' | 'numberOfLines'
> & {
    /**
     * Controlled visibility. `true` shows the password as plain text, `false`
     * masks it. Pair with `onVisibleChange`. Leave undefined for uncontrolled
     * usage.
     */
    visible?: boolean;
    /**
     * Initial visibility for uncontrolled usage.
     * @defaultValue false
     */
    defaultVisible?: boolean;
    /** Called with the next visibility when the show/hide toggle is pressed. */
    onVisibleChange?: (visible: boolean) => void;
    /** Ref to the underlying text input, for `focus()` / `blur()`. */
    ref?: Ref<RNTextInput>;
};

const TOGGLE_SIZE = 28;
const ICON_SIZE = 16;

type WebFocusEvent = { target?: { matches?: (selector: string) => boolean } };

// Pointer focus should not draw the ring; `:focus-visible` is the browser's
// heuristic for keyboard focus. Without it, show the ring (the accessible
// fallback).
const isKeyboardFocus = (event: WebFocusEvent): boolean => {
    try {
        return event.target?.matches?.(':focus-visible') ?? true;
    } catch {
        return true;
    }
};

/**
 * Password field with a show/hide toggle button.
 *
 * Built on `TextInput`: it takes every `TextInput` prop and works inside
 * `<Field>` the same way. The value is masked (`secureTextEntry`) until the
 * toggle is pressed. Visibility is uncontrolled by default
 * (`defaultVisible`) or controlled through `visible` + `onVisibleChange`.
 *
 * ```tsx
 * <Field label="Password">
 *     <PasswordInput autoComplete="new-password" />
 * </Field>
 * ```
 */
export const PasswordInput = ({
    visible: visibleProp,
    defaultVisible = false,
    onVisibleChange,
    disabled,
    ref,
    ...rest
}: PasswordInputProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const EyeIcon = useSemanticIcon('eye');
    const EyeOffIcon = useSemanticIcon('eyeOff');

    const [internalVisible, setInternalVisible] = useState(defaultVisible);
    const visible = visibleProp ?? internalVisible;

    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);

    const inputRef = useRef<RNTextInput | null>(null);
    const inputHadFocusRef = useRef(false);
    const composedRef = useMemo(() => composeRefs<RNTextInput>(inputRef, ref), [ref]);

    const isWeb = Platform.OS === 'web';
    const isDisabled = Boolean(disabled);

    const handleToggle = () => {
        const next = !visible;
        if (visibleProp === undefined) {
            setInternalVisible(next);
        }
        onVisibleChange?.(next);
        // Native: a tap on the toggle can dismiss the keyboard (for example
        // inside a ScrollView that does not persist taps). Typing should
        // continue where it stopped, so give focus back to the input.
        if (!isWeb && inputHadFocusRef.current) {
            inputRef.current?.focus();
        }
    };

    const showLabel = t('input.passwordShow');
    const hideLabel = t('input.passwordHide');
    // Web exposes the state through `aria-pressed`, so the name must stay
    // constant: a name that also flips ("Hide password, pressed") reads as a
    // double negative. Native has no pressed state, so there the name itself
    // carries the action.
    const toggleLabel = isWeb ? showLabel : visible ? hideLabel : showLabel;

    const toggleStyle: ViewStyle = {
        width: TOGGLE_SIZE,
        height: TOGGLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px(colors.radius.sm),
        backgroundColor: isDisabled
            ? 'transparent'
            : pressed
              ? colors.semantic.border.default
              : hovered
                ? colors.semantic.background.subtle
                : 'transparent',
        ...(focusVisible
            ? {
                  outlineStyle: 'solid',
                  outlineWidth: 2,
                  outlineColor: colors.semantic.interactive.primary,
                  outlineOffset: 1,
              }
            : {}),
    };

    const webToggleProps: Record<string, unknown> = isWeb
        ? {
              'aria-pressed': visible,
              // Keeps focus (and the caret) in the input when the toggle is
              // clicked or tapped. Keyboard users who tab to the toggle keep
              // focus on it, so they can toggle again.
              onMouseDown: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
              onFocus: (event: WebFocusEvent) => setFocusVisible(isKeyboardFocus(event)),
              onBlur: () => setFocusVisible(false),
          }
        : {};

    const Icon = visible ? EyeOffIcon : EyeIcon;

    const toggle = (
        <Pressable
            role="button"
            accessibilityRole="button"
            aria-label={toggleLabel}
            accessibilityLabel={toggleLabel}
            accessibilityState={{ disabled: isDisabled }}
            disabled={isDisabled}
            onPress={handleToggle}
            onPressIn={() => {
                inputHadFocusRef.current = inputRef.current?.isFocused?.() ?? false;
                setPressed(true);
            }}
            onPressOut={() => setPressed(false)}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            // The 28px box plus the slop gives a 44px touch target on native.
            hitSlop={8}
            style={toggleStyle}
            {...webToggleProps}
        >
            <Icon size={ICON_SIZE} color={colors.semantic.text.muted} />
        </Pressable>
    );

    return (
        <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            spellCheck={false}
            {...rest}
            ref={composedRef}
            {...(disabled !== undefined ? { disabled } : {})}
            secureTextEntry={!visible}
            trailing={toggle}
        />
    );
};
