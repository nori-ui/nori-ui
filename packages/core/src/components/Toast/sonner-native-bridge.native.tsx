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
// IMPORTANT: sonner-native's internal Positioner uses an OR-fallback:
//   top: offset || insets.top || 40
// — meaning ANY non-zero `offset` we pass SUPPRESSES the safe-area
// fallback. So if we pass `offset=24`, the toast lands flush at 24px
// from the screen edge regardless of the notch. To honor insets we
// either skip `offset` entirely (insets-only) or compute it ourselves
// as `insets.top + buffer`. We do the latter so consumers still get a
// consistent visual buffer below the status bar.

import type { ComponentType, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const NativeToaster = (props: Record<string, unknown>) => {
    const insets = useSafeAreaInsets();
    const position = mapPosition(props.position as string | undefined);
    // Compose offset = insets + buffer so the toast clears the notch
    // (top) or home indicator (bottom). We override whatever offset
    // came in via props because the upstream `||` semantics make a
    // raw pixel offset suppress the inset fallback entirely. Center
    // position needs no offset.
    const buffer = 8;
    const offset =
        position === 'top-center' ? insets.top + buffer : position === 'bottom-center' ? insets.bottom + buffer : 0;
    const merged: Record<string, unknown> = {
        ...props,
        position,
        offset,
    };
    return <RawToaster {...(merged as object)} />;
};

export const HAS_SONNER_NATIVE = true;
export function getSonnerNative(): { toast: SonnerNativeToastFn; Toaster: SonnerNativeToaster } {
    return {
        toast: sonnerToast as unknown as SonnerNativeToastFn,
        Toaster: NativeToaster as unknown as SonnerNativeToaster,
    };
}
