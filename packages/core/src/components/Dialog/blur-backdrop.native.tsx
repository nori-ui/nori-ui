'use client';

// Native variant of the dialog blur backdrop.
//
// expo-blur's `BlurView` is a NATIVE module — it requires the iOS/Android
// view to be compiled into the dev client (or Expo Go). When a consumer
// installs `expo-blur` but hasn't rebuilt the dev client yet, the JS side
// of the package is present but the native ViewManager is missing, and
// `<BlurView>` renders into a "Unable to get the view config for
// ExpoBlurView" warning + an empty fallback view.
//
// We detect that case at module load via `UIManager.hasViewManagerConfig`
// and route to a translucent scrim instead. Result: no warning, dialog
// still renders with a sensible dim, and consumers who DO rebuild get
// true frosted glass without changing any code.

import { BlurView } from 'expo-blur';
import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';
import { UIManager, View } from 'react-native';

export type BlurBackdropProps = {
    /** 0..100. Maps to expo-blur's `intensity`. */
    intensity?: number;
    /** Match the active color scheme so the blur tint reads naturally. */
    tint?: 'light' | 'dark' | 'default';
    /** Style passed straight through (typically StyleSheet.absoluteFill). */
    style?: ViewProps['style'];
};

// Module-level probe: did the host app actually compile the ExpoBlurView
// native module in? `hasViewManagerConfig` is non-throwing and quiet
// (unlike `getViewManagerConfig`, which logs a warning on miss).
const HAS_NATIVE_BLUR: boolean = (() => {
    try {
        const fn = (UIManager as unknown as { hasViewManagerConfig?: (name: string) => boolean }).hasViewManagerConfig;
        if (typeof fn === 'function') {
            return Boolean(fn.call(UIManager, 'ExpoBlurView'));
        }
        return false;
    } catch {
        return false;
    }
})();

function tintToScrim(tint: BlurBackdropProps['tint']): string {
    // Approximate the dim part of expo-blur's tint without the actual
    // glass effect. `dark` darkens; `light` is a translucent white that
    // softens the underlying content; `default` is neutral.
    if (tint === 'dark') {
        return 'rgba(0, 0, 0, 0.5)';
    }
    if (tint === 'light') {
        return 'rgba(255, 255, 255, 0.6)';
    }
    return 'rgba(0, 0, 0, 0.32)';
}

export function BlurBackdrop({ intensity = 50, tint = 'default', style }: BlurBackdropProps): ReactElement {
    if (HAS_NATIVE_BLUR) {
        return <BlurView intensity={intensity} tint={tint} style={style} />;
    }
    return <View style={[style, { backgroundColor: tintToScrim(tint) }]} />;
}
