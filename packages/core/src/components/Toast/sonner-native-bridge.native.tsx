'use client';

// Native bridge for `sonner-native`. Statically imports the package so
// Metro bundles it deterministically (the dynamic-require approach we
// used for expo-blur was flaky in monorepo Metro setups). Consumers
// who ship Toast on native MUST install `sonner-native` plus its peer
// stack — `react-native-gesture-handler`, `react-native-svg`,
// `react-native-safe-area-context`, `react-native-screens`,
// `react-native-reanimated`. All of those are common Expo deps.
//
// `sonner-native` is declared as an optional peer of @nori-ui/core; if
// the consumer doesn't install it, this file fails to resolve at their
// Metro build step, which is the right signal — they wanted native
// toasts and forgot the dependency.
//
// IMPORTANT: sonner-native's internal Positioner already calls
// `useSafeAreaInsets()` and computes `top: insets.top + (offset || 16)`
// (or `bottom: insets.bottom + offset` for bottom-anchored toasts).
// So we only need a `<SafeAreaProvider>` ancestor — no manual padding
// here, otherwise the inset gets applied twice and the toast lands far
// below its visual hit-test region (which causes phantom passthrough
// taps on whatever sits underneath).

import type { ComponentType, ReactNode } from 'react';
import { Toaster as RawToaster, toast as sonnerToast } from 'sonner-native';

export type SonnerNativeToastOptions = Record<string, unknown>;
export type SonnerNativeToastFn = ((message: ReactNode, options?: SonnerNativeToastOptions) => string | number) & {
    success: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    error: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    info: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    warning: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    dismiss: (id?: string | number) => void;
};

export type SonnerNativeToaster = ComponentType<Record<string, unknown>>;

// Map our cross-platform 6-position type onto sonner-native's 3
// positions. Native sonner only supports `top-center | bottom-center
// | center`, which matches phone reality — left/right anchors are a
// tablet-and-up consideration we can revisit when sonner-native grows
// horizontal anchoring upstream. Anything starting with `top-` snaps
// to top-center; bottom-* to bottom-center.
function mapPosition(p: string | undefined): 'top-center' | 'bottom-center' | 'center' {
    if (typeof p !== 'string') {
        return 'top-center';
    }
    if (p.startsWith('bottom')) {
        return 'bottom-center';
    }
    if (p.startsWith('top')) {
        return 'top-center';
    }
    return 'center';
}

function NativeToaster(props: Record<string, unknown>) {
    // sonner-native's Positioner reads safe-area insets itself; we only
    // pass the position prop through after clamping to its 3-value type.
    const merged: Record<string, unknown> = {
        ...props,
        position: mapPosition(props.position as string | undefined),
    };
    return <RawToaster {...(merged as object)} />;
}

export const HAS_SONNER_NATIVE = true;
export function getSonnerNative(): { toast: SonnerNativeToastFn; Toaster: SonnerNativeToaster } {
    return {
        toast: sonnerToast as unknown as SonnerNativeToastFn,
        Toaster: NativeToaster as unknown as SonnerNativeToaster,
    };
}
