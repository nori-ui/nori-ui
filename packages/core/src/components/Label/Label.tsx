'use client';

import type { ReactNode } from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';

export type LabelProps = {
    htmlFor: string;
    required?: boolean;
    disabled?: boolean;
    children: ReactNode;
    className?: string;
    testID?: string;
};

export const Label = ({ htmlFor, required = false, disabled = false, children, className, testID }: LabelProps) => {
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

    return (
        <Pressable
            onPress={focusTarget}
            accessibilityRole="none"
            disabled={disabled}
            {...(testID !== undefined ? { testID } : {})}
            {...(className !== undefined ? { className } : {})}
        >
            <RNText
                {...({ htmlFor } as Record<string, unknown>)}
                accessibilityRole="text"
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: colors.fontWeight.medium as '500',
                    color: disabled ? colors.semantic.text.muted : colors.semantic.text.default,
                }}
            >
                {children}
                {required ? (
                    <RNText
                        accessibilityLabel={requiredLabel}
                        {...({ 'aria-label': requiredLabel } as Record<string, unknown>)}
                        style={{ color: colors.color.dangerText }}
                    >
                        {` ${requiredIndicator}`}
                    </RNText>
                ) : null}
            </RNText>
        </Pressable>
    );
};
