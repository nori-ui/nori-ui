'use client';

// Native variant of the dialog blur backdrop. Statically imports
// expo-blur's `BlurView` so Metro bundles it deterministically — the
// previous dynamic-require approach was flaky in monorepo setups
// (Metro's static analysis silently dropped the call site, so the
// frosted-glass effect never showed up and consumers only saw the
// fallback scrim tint).
//
// Consumers that ship Dialog/AlertDialog on native MUST install
// `expo-blur` (declared as an optional peer dep of @nori-ui/core).
// On web, Metro picks `blur-backdrop.tsx` instead, which is a no-op
// because the overlay's CSS `backdrop-filter` already does the work.

import { BlurView } from 'expo-blur';
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

export function BlurBackdrop({ intensity = 50, tint = 'default', style }: BlurBackdropProps): ReactElement {
    return <BlurView intensity={intensity} tint={tint} style={style} />;
}
