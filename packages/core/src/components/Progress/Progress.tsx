'use client';

import { useEffect, useRef } from 'react';
import { Animated, Easing, Text as RNText, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type ProgressTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md' | 'lg';

export type ProgressProps = {
    /**
     * Current progress value (`0..max`). Omit to render the indeterminate
     * marquee variant (use this when you don't know how long the work
     * will take, e.g. an initial load before headers come back).
     */
    value?: number;
    /** Upper bound for `value`. @defaultValue 100 */
    max?: number;
    /**
     * Color of the fill / shuttle. `primary` follows the theme's interactive
     * color (matches buttons + sliders); the rest map to semantic status colors.
     * @defaultValue 'primary'
     */
    tone?: ProgressTone;
    /**
     * Bar height — `sm` 4px, `md` 8px (default), `lg` 12px. The track is
     * always pill-shaped (border-radius = height/2).
     * @defaultValue 'md'
     */
    size?: ProgressSize;
    /**
     * Optional label rendered above the bar. When set, also enables a
     * percentage readout on the right side for determinate progress.
     */
    label?: string;
    /**
     * Hide the auto-rendered percentage when a `label` is provided. Useful
     * when the label itself already conveys the number (e.g. "Step 3 of 5").
     * @defaultValue false
     */
    hidePercentage?: boolean;
    /** Accessibility label when no visible `label` is provided. */
    'aria-label'?: string;
    /** Reference to a labeling element by id. */
    'aria-labelledby'?: string;
    className?: string;
    testID?: string;
};

const SIZE_PX: Record<ProgressSize, number> = {
    sm: 4,
    md: 8,
    lg: 12,
};

const INDETERMINATE_DURATION_MS = 1500;
const SHUTTLE_WIDTH_PCT = 30;

/**
 * Linear progress indicator. Use the determinate form (`value` set) to
 * communicate "we're 42% done"; use the indeterminate form (`value`
 * omitted) for "we're working, no ETA". The track is always pill-shaped
 * and the fill animates smoothly between renders for the determinate
 * variant — keep updates throttled to ~10/s in the parent to avoid
 * jitter.
 *
 * Cross-platform: built on `View` + `Animated.View` so it renders
 * identically on web (rn-web) and native. Uses `useThemeColors()` to
 * pick up dark-mode flips automatically.
 *
 * Accessibility: maps to `role="progressbar"` with `aria-valuemin`,
 * `aria-valuemax`, and (for determinate) `aria-valuenow`. Provide an
 * `aria-label`, `aria-labelledby`, or visible `label` so the bar is
 * named.
 */
export function Progress({
    value,
    max = 100,
    tone = 'primary',
    size = 'md',
    label,
    hidePercentage = false,
    className,
    testID,
    ...rest
}: ProgressProps) {
    const colors = useThemeColors();
    const ariaLabel = rest['aria-label'];
    const ariaLabelledBy = rest['aria-labelledby'];

    const isIndeterminate = value === undefined;
    const safeMax = max <= 0 ? 100 : max;
    const clamped = isIndeterminate ? 0 : Math.min(safeMax, Math.max(0, value));
    const pct = isIndeterminate ? 0 : (clamped / safeMax) * 100;

    const height = SIZE_PX[size];

    const fillColor =
        tone === 'primary'
            ? colors.semantic.interactive.primary
            : tone === 'success'
              ? colors.color.success
              : tone === 'warning'
                ? colors.color.warning
                : tone === 'danger'
                  ? colors.color.danger
                  : colors.color.info;

    // Indeterminate marquee — a 30%-wide shuttle that slides from -30% to
    // 100% on a continuous loop. Driven by `Animated.Value` (0..1) which we
    // interpolate to a percent string for `left`. ease-in-out keeps the
    // motion subtle so the bar never feels frantic.
    const shuttle = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!isIndeterminate) return;
        const loop = Animated.loop(
            Animated.timing(shuttle, {
                toValue: 1,
                duration: INDETERMINATE_DURATION_MS,
                easing: Easing.inOut(Easing.ease),
                // We animate `left` (a layout property), so the native driver
                // can't be used. Web (rn-web) ignores `useNativeDriver`.
                useNativeDriver: false,
            })
        );
        loop.start();
        return () => {
            loop.stop();
        };
    }, [isIndeterminate, shuttle]);

    const trackStyle: ViewStyle = {
        width: '100%',
        height,
        backgroundColor: colors.semantic.background.subtle,
        borderRadius: height / 2,
        overflow: 'hidden',
        position: 'relative',
    };

    const determinateFillStyle: ViewStyle = {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        // Cast at the boundary — RN's typed DimensionValue is narrower than
        // the percentage strings rn-web actually accepts.
        width: `${pct}%` as unknown as number,
        backgroundColor: fillColor,
        borderRadius: height / 2,
    };

    // Build the indeterminate style only when needed — `Animated.Value.interpolate`
    // returns an animated node that RN reads at render; we keep the call inside
    // the branch so determinate renders never hit it (and so test envs that
    // stub `Animated.Value` don't choke on a missing `interpolate`).
    const buildIndeterminateStyle = () => {
        const left =
            typeof shuttle.interpolate === 'function'
                ? shuttle.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`-${SHUTTLE_WIDTH_PCT}%`, '100%'],
                  })
                : (`-${SHUTTLE_WIDTH_PCT}%` as unknown as number);
        return {
            position: 'absolute' as const,
            top: 0,
            bottom: 0,
            left: left as unknown as number,
            width: `${SHUTTLE_WIDTH_PCT}%` as unknown as number,
            backgroundColor: fillColor,
            borderRadius: height / 2,
        };
    };

    // ARIA: only emit aria-valuenow when determinate so AT announces
    // "in progress" rather than "0%" while indeterminate.
    const ariaProps: Record<string, unknown> = {
        role: 'progressbar',
        accessibilityRole: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': safeMax,
    };
    if (!isIndeterminate) {
        ariaProps['aria-valuenow'] = clamped;
        ariaProps.accessibilityValue = { min: 0, max: safeMax, now: clamped };
    }
    if (ariaLabel !== undefined) {
        ariaProps['aria-label'] = ariaLabel;
        ariaProps.accessibilityLabel = ariaLabel;
    } else if (label !== undefined) {
        ariaProps['aria-label'] = label;
        ariaProps.accessibilityLabel = label;
    }
    if (ariaLabelledBy !== undefined) {
        ariaProps['aria-labelledby'] = ariaLabelledBy;
    }

    const showHeader = label !== undefined;
    const showPercentage = showHeader && !hidePercentage && !isIndeterminate;

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('w-full', className)}
            style={{ width: '100%' }}
        >
            {showHeader ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                    }}
                >
                    <RNText
                        style={{
                            fontSize: 13,
                            color: colors.semantic.text.muted,
                        }}
                    >
                        {label}
                    </RNText>
                    {showPercentage ? (
                        <RNText
                            style={{
                                fontSize: 13,
                                color: colors.semantic.text.muted,
                                // Tabular numerals keep the percentage from
                                // jittering as digits change width.
                                fontVariant: ['tabular-nums'],
                            }}
                        >
                            {Math.round(pct)}%
                        </RNText>
                    ) : null}
                </View>
            ) : null}
            <View {...ariaProps} style={trackStyle}>
                {isIndeterminate ? (
                    <Animated.View style={buildIndeterminateStyle()} />
                ) : (
                    <View style={determinateFillStyle} />
                )}
            </View>
        </View>
    );
}
