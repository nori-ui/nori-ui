'use client';

// Web stub for the sonner-native bridge. Metro picks
// `sonner-native-bridge.native.tsx` for RN bundles; web bundles get
// this no-op so `react-native-gesture-handler` and friends don't end
// up in the web build. The web Toaster path uses `sonner-bridge.ts`
// instead.

import type { ComponentType, ReactNode } from 'react';

export type SonnerNativeToastOptions = Record<string, unknown>;
export type SonnerNativeToastFn = ((message: ReactNode, options?: SonnerNativeToastOptions) => string | number) & {
    success: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    error: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    info: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    warning: (message: ReactNode, options?: SonnerNativeToastOptions) => string | number;
    dismiss: (id?: string | number) => void;
};

export type SonnerNativeToaster = ComponentType<Record<string, unknown>>;

export const HAS_SONNER_NATIVE = false;
export function getSonnerNative(): { toast: SonnerNativeToastFn; Toaster: SonnerNativeToaster } | null {
    return null;
}
