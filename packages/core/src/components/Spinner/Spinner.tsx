import type { ActivityIndicatorProps } from 'react-native';
import { ActivityIndicator } from 'react-native';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type SpinnerProps = Omit<ActivityIndicatorProps, 'size'> & {
    /** Visible (a11y) label. Defaults to the i18n "common.loading" default ("Loading"). */
    label?: string;
    size?: SpinnerSize;
    testID?: string;
    className?: string;
};

const SIZE_MAP: Record<Exclude<SpinnerSize, number>, number> = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
};

/**
 * Loading indicator.
 *
 * a11y: rendered with `role="progressbar"` and an `aria-label` so screen
 * readers announce it. Respects `prefers-reduced-motion` — on web, react-native-web's
 * ActivityIndicator will render without animation when the media query matches;
 * on native, React Native's ActivityIndicator honors the OS reduce-motion setting
 * automatically.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Spinner({ label = 'Loading', size = 'md', testID, color, style, ...rest }: SpinnerProps) {
    const px = typeof size === 'number' ? size : SIZE_MAP[size];
    return (
        <ActivityIndicator
            {...rest}
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="progressbar"
            accessibilityLabel={label}
            {...(color !== undefined ? { color } : {})}
            size={px}
            style={[{ width: px, height: px }, style]}
        />
    );
}
