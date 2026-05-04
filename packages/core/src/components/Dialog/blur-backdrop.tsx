'use client';

// Web variant of the dialog blur backdrop. On web, the overlay's CSS
// `backdrop-filter: blur(...)` (set directly on the DOM node by
// Dialog/AlertDialog) handles the frosted look — there's nothing extra
// to render here.
//
// Metro picks `blur-backdrop.native.tsx` for native bundles, which
// statically imports `expo-blur`. The split keeps the static import
// off the web bundle so web consumers don't drag a native module
// through their build.

import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';

export type BlurBackdropProps = {
    /** 0..100. Maps to expo-blur's `intensity`. */
    intensity?: number;
    /** Match the active color scheme so the blur tint reads naturally. */
    tint?: 'light' | 'dark' | 'default';
    /** Style passed straight through (typically StyleSheet.absoluteFill). */
    style?: ViewProps['style'];
};

export const BlurBackdrop = (_props: BlurBackdropProps): ReactElement | null => {
    return null;
};
