import type { ActivityIndicatorProps } from 'react-native';
import { ActivityIndicator, Platform, View } from 'react-native';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type SpinnerProps = Omit<ActivityIndicatorProps, 'size'> & {
    /**
     * Accessible label. Defaults to the English "Loading"; pass a translated
     * string (for example `t('common.loading')`) in localized apps. The default
     * is not translated here because that needs a hook, and Spinner stays
     * usable from React Server Components.
     */
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

// Point sizes of the two indicators UIKit offers.
const IOS_SMALL = 20;
const IOS_LARGE = 36;

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
export const Spinner = ({
    label,
    size = 'md',
    testID,
    color,
    style,
    animating,
    hidesWhenStopped,
    ...rest
}: SpinnerProps) => {
    const accessibilityLabel = label ?? 'Loading';
    const px = typeof size === 'number' ? size : SIZE_MAP[size];
    const indicatorProps = {
        ...(color !== undefined ? { color } : {}),
        ...(animating !== undefined ? { animating } : {}),
        ...(hidesWhenStopped !== undefined ? { hidesWhenStopped } : {}),
    };

    if (Platform.OS === 'ios') {
        // iOS ignores a numeric `size` and only knows 'small' and 'large', so the
        // nearest one is scaled to the requested size. The scale does not change
        // layout, hence the wrapper that reserves the real footprint.
        const base = px > IOS_SMALL ? 'large' : 'small';
        const scale = px / (base === 'large' ? IOS_LARGE : IOS_SMALL);
        return (
            <View
                {...rest}
                {...(testID !== undefined ? { testID } : {})}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={accessibilityLabel}
                style={[{ width: px, height: px, alignItems: 'center', justifyContent: 'center' }, style]}
            >
                <ActivityIndicator {...indicatorProps} size={base} style={{ transform: [{ scale }] }} />
            </View>
        );
    }

    return (
        <ActivityIndicator
            {...rest}
            {...indicatorProps}
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="progressbar"
            accessibilityLabel={accessibilityLabel}
            size={px}
            style={[{ width: px, height: px }, style]}
        />
    );
};
