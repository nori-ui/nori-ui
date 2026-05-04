'use client';

import { createElement } from 'react';
import { Platform } from 'react-native';
import { getSonner } from './sonner-bridge';
import { getSonnerNative } from './sonner-native-bridge';
import type { ToasterPosition, ToasterProps } from './types';

/**
 * Toast viewport. Mount once near the app root; the imperative
 * `toast(...)` function pushes to it.
 *
 * Implementation is platform-split:
 *
 * - Web: delegates to `sonner`'s `<Toaster>` (Emil Kowalski's original).
 *   Sonner already handles stacking, expand-on-hover, swipe-to-dismiss
 *   on touch screens, position, rich colors, etc.
 *
 * - Native: delegates to `sonner-native`'s `<Toaster>` (Gunnar Torfi's
 *   port, built on Reanimated 3 + Gesture Handler). Same behavior:
 *   stacked layering with the front toast in focus, tap-to-expand
 *   (since hover doesn't exist on touch), swipe up/down to dismiss,
 *   slide+fade in/out from the anchored edge. Six positions
 *   (top|bottom × left|center|right) align with sonner's positions.
 *
 * Both packages share the imperative `toast(...)` API, which keeps
 * userland identical across platforms.
 */
export const Toaster = (props: ToasterProps): ReturnType<typeof createElement> | null => {
    const {
        position = 'top-center',
        visibleToasts = 3,
        duration = 4000,
        closeButton = false,
        richColors = false,
        expand = false,
        offset = 24,
        gap = 14,
    } = props;

    if (Platform.OS === 'web') {
        const sonner = getSonner();
        if (!sonner) {
            return null;
        }
        // sonner's Toaster accepts the same prop names we expose. Pass
        // through verbatim — any drift is contained here.
        return createElement(sonner.Toaster as unknown as React.ComponentType<Record<string, unknown>>, {
            position: mapPositionForSonner(position),
            visibleToasts,
            duration,
            closeButton,
            richColors,
            expand,
            offset,
            gap,
        });
    }

    const native = getSonnerNative();
    if (!native) {
        return null;
    }
    // sonner-native's Toaster API matches sonner's almost 1:1. The same
    // position strings work, and `visibleToasts`/`expand`/`closeButton`
    // are already wired upstream.
    return createElement(native.Toaster as unknown as React.ComponentType<Record<string, unknown>>, {
        position: mapPositionForSonner(position),
        visibleToasts,
        duration,
        closeButton,
        richColors,
        // On touch the equivalent of hover-to-expand is tap-to-expand,
        // which sonner-native already implements when `expand` is set.
        expand,
        offset,
        gap,
    });
};

function mapPositionForSonner(p: ToasterPosition): string {
    return p;
}
