'use client';

import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { getSonner, HAS_SONNER } from './sonner-bridge';
import { getSonnerNative } from './sonner-native-bridge';
import type { ToastOptions, ToastTone } from './types';

/**
 * Imperative toast API.
 *
 * - Web → delegates to `sonner` (Emil Kowalski).
 * - Native → delegates to `sonner-native` (Gunnar Torfi's port).
 *
 * Userland never branches on `Platform.OS` — `toast(...)`, `toast.success(...)`
 * and friends call the right package transparently.
 *
 * Example:
 *   ```tsx
 *   import { toast, Toaster } from '@nori-ui/core';
 *
 *   function App() {
 *     return (
 *       <>
 *         <Button onPress={() => toast.success('Saved')}>Save</Button>
 *         <Toaster position="top-right" richColors />
 *       </>
 *     );
 *   }
 *   ```
 */

type ToastId = string | number;
// Both sonner and sonner-native expose the same callable shape on
// their `toast` export — default callable plus `success` / `error` /
// `warning` / `info` / `dismiss` / `promise`. The exact types differ
// upstream (sonner ships ExternalToast options; sonner-native ships its
// own option shape), but the runtime contract is identical for our
// purposes. Use a structural shim and cast at the bridge boundary.
type ToastFn = {
    (message: ReactNode, options?: Record<string, unknown>): ToastId;
    success: (message: ReactNode, options?: Record<string, unknown>) => ToastId;
    error: (message: ReactNode, options?: Record<string, unknown>) => ToastId;
    warning: (message: ReactNode, options?: Record<string, unknown>) => ToastId;
    info: (message: ReactNode, options?: Record<string, unknown>) => ToastId;
    dismiss: (id?: ToastId) => void;
    promise: <T>(p: Promise<T>, opts: unknown) => ToastId;
};
type SonnerLike = { toast: ToastFn };

function getActive(): SonnerLike | null {
    if (HAS_SONNER) {
        return getSonner() as SonnerLike | null;
    }
    if (Platform.OS !== 'web') {
        return getSonnerNative() as SonnerLike | null;
    }
    return null;
}

/**
 * Map our cross-platform `tone` to sonner's named methods. Both sonner
 * and sonner-native expose the same `success` / `error` / `warning` /
 * `info` shortcuts plus a default callable, so a single dispatcher
 * works for both.
 */
function dispatch(tone: ToastTone, title: ReactNode, options: ToastOptions): ToastId | undefined {
    const active = getActive();
    if (!active) {
        return undefined;
    }
    const mapped: Record<string, unknown> = { ...options };
    if (options.action) {
        mapped.action = { label: options.action.label, onClick: options.action.onClick };
    }
    if (options.cancel) {
        mapped.cancel = { label: options.cancel.label, onClick: options.cancel.onClick };
    }
    delete mapped.tone;
    switch (tone) {
        case 'success':
            return active.toast.success(title, mapped);
        case 'danger':
            return active.toast.error(title, mapped);
        case 'warning':
            return active.toast.warning(title, mapped);
        case 'info':
            return active.toast.info(title, mapped);
        default:
            return active.toast(title, mapped);
    }
}

function show(title: ReactNode, options: ToastOptions = {}): ToastId {
    const tone: ToastTone = options.tone ?? 'default';
    const id = dispatch(tone, title, options);
    // Both sonner and sonner-native return string|number ids. If the
    // active provider couldn't dispatch (e.g. the package isn't installed
    // on a particular platform), return a synthetic id so the caller's
    // chained `.dismiss(id)` still resolves cleanly.
    return id ?? `nori-toast-${Date.now()}`;
}

const toastFn = show as ((title: ReactNode, options?: ToastOptions) => ToastId) & {
    success: (title: ReactNode, options?: ToastOptions) => ToastId;
    error: (title: ReactNode, options?: ToastOptions) => ToastId;
    warning: (title: ReactNode, options?: ToastOptions) => ToastId;
    info: (title: ReactNode, options?: ToastOptions) => ToastId;
    message: (title: ReactNode, options?: ToastOptions) => ToastId;
    dismiss: (id?: ToastId) => void;
    promise: <T>(
        promise: Promise<T> | (() => Promise<T>),
        opts: {
            loading: ReactNode;
            success: ReactNode | ((data: T) => ReactNode);
            error: ReactNode | ((err: unknown) => ReactNode);
        }
    ) => ToastId;
};

toastFn.success = (title, options = {}) => show(title, { ...options, tone: 'success' });
toastFn.error = (title, options = {}) => show(title, { ...options, tone: 'danger' });
toastFn.warning = (title, options = {}) => show(title, { ...options, tone: 'warning' });
toastFn.info = (title, options = {}) => show(title, { ...options, tone: 'info' });
toastFn.message = (title, options = {}) => show(title, { ...options, tone: 'default' });

toastFn.dismiss = (id) => {
    const active = getActive();
    if (!active) {
        return;
    }
    if (id === undefined) {
        active.toast.dismiss();
    } else {
        active.toast.dismiss(id);
    }
};

toastFn.promise = (promise, opts) => {
    const resolved = typeof promise === 'function' ? promise() : promise;
    const active = getActive();
    if (!active) {
        return `nori-toast-${Date.now()}`;
    }
    return active.toast.promise(resolved, opts) as ToastId;
};

export const toast = toastFn;
