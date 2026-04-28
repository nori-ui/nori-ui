'use client';

// Optional native blur layer for dialog/alert-dialog overlays. On web
// the overlay uses CSS `backdrop-filter: blur(...)` directly on the DOM
// node (handled in Dialog/AlertDialog), so this component renders
// nothing there.
//
// On native, the equivalent is `expo-blur`'s `BlurView` — a native module
// (iOS/Android) that requires a dev-client rebuild after install. To
// avoid making `expo-blur` a hard peer dep of `@nori-ui/core`, we
// dynamically require it: if the consumer has installed it, we render a
// real blur layer; if not, we fall back to a slightly darker scrim so
// the overlay still reads, just without the frosted-glass effect.

import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';
import { Platform } from 'react-native';

type BlurViewModule = {
    BlurView: (props: ViewProps & { intensity?: number; tint?: 'light' | 'dark' | 'default' }) => ReactElement;
};

let cachedModule: BlurViewModule | null | undefined;

function loadBlurModule(): BlurViewModule | null {
    if (cachedModule !== undefined) {
        return cachedModule;
    }
    try {
        // Dynamic require — avoids a static dependency. Metro will throw
        // if `expo-blur` isn't resolvable, which we swallow and treat as
        // "not installed".
        // biome-ignore lint/security/noDangerouslySetInnerHtml: not applicable
        // biome-ignore lint/style/useNodejsImportProtocol: dynamic optional require
        const mod = require('expo-blur') as BlurViewModule;
        cachedModule = mod && typeof mod.BlurView === 'function' ? mod : null;
    } catch {
        cachedModule = null;
    }
    return cachedModule;
}

export type BlurBackdropProps = {
    /** 0..100. Maps to expo-blur's `intensity`. */
    intensity?: number;
    /** Match the active color scheme so the blur tint reads naturally. */
    tint?: 'light' | 'dark' | 'default';
    /** Style passed straight through (typically StyleSheet.absoluteFill). */
    style?: ViewProps['style'];
};

/**
 * Frosted-glass backdrop. Renders nothing on web (the overlay's CSS
 * `backdrop-filter` already covers it) and renders nothing on native
 * when `expo-blur` isn't installed. When it IS installed, renders a
 * native `BlurView` filling its parent.
 */
export function BlurBackdrop({ intensity = 30, tint = 'default', style }: BlurBackdropProps): ReactElement | null {
    if (Platform.OS === 'web') {
        return null;
    }
    const mod = loadBlurModule();
    if (!mod) {
        return null;
    }
    return <mod.BlurView intensity={intensity} tint={tint} style={style} />;
}
