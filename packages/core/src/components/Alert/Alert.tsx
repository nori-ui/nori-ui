'use client';

import type { ComponentType, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = {
    /**
     * Severity of the alert. Drives the color tone and the default icon.
     * @defaultValue 'info'
     */
    tone?: AlertTone;
    /** Bolded heading line. Optional — provide one of title or description. */
    title?: string;
    /** Body text below the title. */
    description?: string;
    /**
     * When provided, renders a close button in the top-right that calls back
     * when pressed. The Alert itself doesn't track dismissed state — the
     * parent decides whether to keep rendering.
     */
    onDismiss?: () => void;
    /**
     * Override the tone's default icon. Pass `null` to render no icon at
     * all (rare — the icon doubles as the visual severity cue).
     */
    icon?: ReactNode;
    /** Additional content below title/description. */
    children?: ReactNode;
    className?: string;
    testID?: string;
};

type IconType = ComponentType<{ size?: number; color?: string }>;
type TonePalette = { bg: string; border: string; fg: string; iconBg: string; defaultIcon: IconType };

// Light/dark soft palettes per tone. Light variants use the familiar
// pastel scale (Tailwind 50/200/800); dark variants use the deep 950/700/100
// scale so the alert reads as a calm, on-tone surface against either
// background — never a harsh white card on a dark page.
function tonePalettes(
    scheme: 'light' | 'dark',
    primary: { '50': string; '200': string; '700': string; '800': string; '900': string; '100': string },
    success: string,
    warning: string,
    danger: string
): Record<AlertTone, TonePalette> {
    if (scheme === 'dark') {
        return {
            info: {
                bg: primary['900'],
                border: primary['700'],
                fg: primary['100'],
                iconBg: primary['200'],
                defaultIcon: defaultSemanticIcons.info,
            },
            success: {
                bg: '#052e16',
                border: '#14532d',
                fg: '#bbf7d0',
                iconBg: success,
                defaultIcon: defaultSemanticIcons.checkmark,
            },
            warning: {
                bg: '#422006',
                border: '#78350f',
                fg: '#fef3c7',
                iconBg: warning,
                defaultIcon: defaultSemanticIcons.alertTriangle,
            },
            danger: {
                bg: '#450a0a',
                border: '#7f1d1d',
                fg: '#fecaca',
                iconBg: danger,
                defaultIcon: defaultSemanticIcons.alertTriangle,
            },
        };
    }
    return {
        info: {
            bg: primary['50'],
            border: primary['200'],
            fg: primary['800'],
            iconBg: primary['700'],
            defaultIcon: defaultSemanticIcons.info,
        },
        success: {
            bg: '#f0fdf4',
            border: '#bbf7d0',
            fg: '#166534',
            iconBg: success,
            defaultIcon: defaultSemanticIcons.checkmark,
        },
        warning: {
            bg: '#fefce8',
            border: '#fde68a',
            fg: '#92400e',
            iconBg: warning,
            defaultIcon: defaultSemanticIcons.alertTriangle,
        },
        danger: {
            bg: '#fef2f2',
            border: '#fecaca',
            fg: '#991b1b',
            iconBg: danger,
            defaultIcon: defaultSemanticIcons.alertTriangle,
        },
    };
}

const CONTAINER_STYLE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
};

/**
 * Status banner with an icon, title, optional description, optional dismiss.
 * Use for inline messages that the reader should notice but doesn't need to
 * action immediately (use a Dialog when you need a forced acknowledgement).
 *
 * Color tone flips automatically with the active color scheme — light
 * pastel surface in light mode, deep on-tone surface in dark.
 */
export function Alert({ tone = 'info', title, description, onDismiss, icon, children, className, testID }: AlertProps) {
    const colors = useThemeColors();
    const scheme = useColorScheme();
    const palette = tonePalettes(
        scheme,
        colors.color.primary,
        colors.color.success,
        colors.color.warning,
        colors.color.danger
    )[tone];
    const IconComponent = palette.defaultIcon;
    const containerStyle: ViewStyle = {
        ...CONTAINER_STYLE,
        backgroundColor: palette.bg,
        borderColor: palette.border,
    };
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="alert"
            accessibilityRole="alert"
            className={cn('flex-row items-start gap-3 rounded-md border p-3.5', className)}
            style={containerStyle}
        >
            {icon === null ? null : icon !== undefined ? (
                icon
            ) : (
                <View
                    aria-hidden={true}
                    style={{
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                    }}
                >
                    <IconComponent size={20} color={palette.iconBg} />
                </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
                {title !== undefined ? (
                    <RNText style={{ color: palette.fg, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                        {title}
                    </RNText>
                ) : null}
                {description !== undefined ? (
                    <RNText style={{ color: palette.fg, fontSize: 14, lineHeight: 20, opacity: 0.85 }}>
                        {description}
                    </RNText>
                ) : null}
                {children}
            </View>
            {onDismiss !== undefined ? (
                <Pressable
                    onPress={onDismiss}
                    role="button"
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                    aria-label="Dismiss"
                    style={{
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        marginTop: -2,
                    }}
                >
                    <defaultSemanticIcons.close size={16} color={palette.fg} />
                </Pressable>
            ) : null}
        </View>
    );
}
