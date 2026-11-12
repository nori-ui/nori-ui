'use client';

import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { Platform, Pressable, Text as RNText } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';

export type LabelProps = {
    /** `id` of the control this label names. */
    htmlFor: string;
    /**
     * `id` (web) / `nativeID` (native) of the label itself, so a control can
     * point back at it with `aria-labelledby`.
     */
    id?: string;
    required?: boolean;
    disabled?: boolean;
    children: ReactNode;
    className?: string;
    testID?: string;
};

export const Label = ({ htmlFor, id, required = false, disabled = false, children, className, testID }: LabelProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const requiredIndicator = t('field.requiredIndicator');
    const requiredLabel = t('field.requiredLabel');

    const focusTarget = () => {
        if (typeof document !== 'undefined') {
            const el = document.getElementById(htmlFor);
            if (el && typeof (el as HTMLElement).focus === 'function') {
                (el as HTMLElement).focus();
            }
        }
    };

    const textStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        fontWeight: colors.fontWeight.medium as '500',
        color: disabled ? colors.semantic.text.muted : colors.semantic.text.default,
    };

    // react-native-web's Text renders a <div> and drops `htmlFor`, which
    // leaves the control without an accessible name. Only a real
    // <label for> names the control and focuses it on click. Native has no
    // <label> host component, so this branch must never render there.
    if (Platform.OS === 'web') {
        return (
            <label
                htmlFor={htmlFor}
                // A native <label for> only focuses labelable elements
                // (<input>, <textarea>, ...). Switch, Checkbox and friends
                // render a <div role>, so those are focused by hand.
                {...(disabled ? {} : { onClick: focusTarget })}
                {...(id !== undefined ? { id } : {})}
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                {...(className !== undefined ? { className } : {})}
                // Block-level like the react-native-web Text it replaces, so
                // a label stacked above its control keeps its own line.
                style={{ display: 'block', ...(textStyle as object) }}
            >
                {children}
                {required ? (
                    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: reads the "*" marker as "required", matching the native branch.
                    <span aria-label={requiredLabel} style={{ color: colors.color.dangerText }}>
                        {` ${requiredIndicator}`}
                    </span>
                ) : null}
            </label>
        );
    }

    return (
        <Pressable
            onPress={focusTarget}
            accessibilityRole="none"
            disabled={disabled}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            <RNText {...(id !== undefined ? { nativeID: id } : {})} accessibilityRole="text" style={textStyle}>
                {children}
                {required ? (
                    <RNText accessibilityLabel={requiredLabel} style={{ color: colors.color.dangerText }}>
                        {` ${requiredIndicator}`}
                    </RNText>
                ) : null}
            </RNText>
        </Pressable>
    );
};
