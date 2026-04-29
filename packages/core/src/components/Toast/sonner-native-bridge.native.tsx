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

import type { ComponentType, ReactNode } from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner-native';

export type SonnerNativeToastOptions = Record<string, unknown>;
export type SonnerNativeToastFn = ((message: ReactNode, options?: SonnerNativeToastOptions) => string | number) & {
    success: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    error: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    info: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    warning: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    dismiss: (id?: string | number) => void;
};

export type SonnerNativeToaster = ComponentType<Record<string, unknown>>;

export const HAS_SONNER_NATIVE = true;
export function getSonnerNative(): { toast: SonnerNativeToastFn; Toaster: SonnerNativeToaster } {
    return {
        toast: sonnerToast as unknown as SonnerNativeToastFn,
        Toaster: SonnerToaster as unknown as SonnerNativeToaster,
    };
}
