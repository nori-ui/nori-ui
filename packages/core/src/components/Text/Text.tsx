'use client';

import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type TextVariant = 'body-xs' | 'body-sm' | 'body-md' | 'body-lg' | 'heading-1' | 'heading-2' | 'heading-3';

export type TextProps = RNTextProps & {
    variant?: TextVariant;
    className?: string;
    testID?: string;
};

const VARIANT_CLASSES: Record<TextVariant, string> = {
    'body-xs': 'text-xs leading-normal',
    'body-sm': 'text-sm leading-normal',
    'body-md': 'text-md leading-normal',
    'body-lg': 'text-lg leading-relaxed',
    'heading-1': 'text-4xl leading-tight font-bold',
    'heading-2': 'text-3xl leading-tight font-semibold',
    'heading-3': 'text-2xl leading-tight font-semibold',
};

const HEADING_VARIANTS: Readonly<Set<TextVariant>> = new Set(['heading-1', 'heading-2', 'heading-3']);

// Per-variant resolution from the active theme. Keys here name the
// fontSize / fontWeight / lineHeight tokens the variant pulls from. The
// fontFamily is picked separately (display for headings, body otherwise).
type VariantKeys = {
    fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    fontWeight: 'regular' | 'medium' | 'semibold' | 'bold';
    lineHeight: 'tight' | 'normal' | 'relaxed';
};
const VARIANT_KEYS: Record<TextVariant, VariantKeys> = {
    'body-xs': { fontSize: 'xs', fontWeight: 'regular', lineHeight: 'normal' },
    'body-sm': { fontSize: 'sm', fontWeight: 'regular', lineHeight: 'normal' },
    'body-md': { fontSize: 'md', fontWeight: 'regular', lineHeight: 'normal' },
    'body-lg': { fontSize: 'lg', fontWeight: 'regular', lineHeight: 'relaxed' },
    'heading-1': { fontSize: '4xl', fontWeight: 'bold', lineHeight: 'tight' },
    'heading-2': { fontSize: '3xl', fontWeight: 'semibold', lineHeight: 'tight' },
    'heading-3': { fontSize: '2xl', fontWeight: 'semibold', lineHeight: 'tight' },
};

/**
 * Typography primitive. Renders a react-native <Text>; on web via RN-Web
 * it becomes a <div role="..."> with the appropriate className.
 *
 * Inline style is sourced from the active `<NoriProvider theme={...}>`:
 * font family (display for headings, body for body variants), fontSize,
 * fontWeight, lineHeight all flow through. Override the whole variant by
 * passing a custom theme; override a single instance by passing `style`.
 *
 * The `className` path keeps the Tailwind dark-mode color flip — inline
 * style provides the typographic substance, className provides the color.
 */
export function Text({ variant = 'body-md', className, testID, children, ...rest }: TextProps) {
    const colors = useThemeColors();
    const isHeading = HEADING_VARIANTS.has(variant);
    const role = isHeading ? 'header' : rest.accessibilityRole;

    const keys = VARIANT_KEYS[variant];
    const sizePx = px(colors.fontSize[keys.fontSize]);
    const lhMultiplier = Number(colors.lineHeight[keys.lineHeight]);
    const themedStyle: TextStyle = {
        // Inline color is the source of truth — NativeWind's `dark:`
        // class variants don't reliably apply on native at runtime, and
        // even on web inline styles win on CSS specificity. Sourcing
        // from `useThemeColors()` means light/dark + theme overrides
        // flow through every <Text> automatically. The Tailwind classes
        // below are kept as a no-NativeWind fallback (Expo Snack etc.)
        // and as a hint for class-name-based tooling.
        color: colors.semantic.text.default,
        fontFamily: isHeading ? colors.fontFamily.display : colors.fontFamily.body,
        fontSize: sizePx,
        // RN expects lineHeight in px, not unitless. Tokens carry it as a
        // ratio (1.2 / 1.4 / 1.6) — multiply against the variant fontSize.
        lineHeight: sizePx * lhMultiplier,
        // The fontWeight token returns string literals like "500" / "700"
        // which match RN's TextStyle.fontWeight enum.
        fontWeight: colors.fontWeight[keys.fontWeight] as TextStyle['fontWeight'],
    };

    // Caller-provided style wins (last in the array). The themed style is
    // the source of truth, the user's `style` prop the override.
    const styleProp = (rest as { style?: TextStyle | TextStyle[] }).style;

    return (
        <RNText
            testID={testID}
            {...rest}
            {...(role !== undefined ? { accessibilityRole: role } : {})}
            className={cn(
                'text-semantic-text-default dark:text-dark-semantic-text-default',
                VARIANT_CLASSES[variant],
                className
            )}
            style={[themedStyle, styleProp]}
        >
            {children}
        </RNText>
    );
}
