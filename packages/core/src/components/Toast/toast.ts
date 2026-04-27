'use client';

import type { ReactNode } from 'react';
import { getSonner, HAS_SONNER } from './sonner-bridge';
import * as store from './toast-store';
import type { ToastOptions, ToastTone } from './types';

/**
 * Imperative toast API.
 *
 * - Web: delegates to `sonner` directly. Identical syntax to sonner so
 *   the upstream docs apply 1:1, and existing sonner muscle memory
 *   transfers.
 * - Native: pushes to our own pub/sub store, which `<Toaster>` reads.
 *
 * The exported surface is identical on both platforms — userland never
 * branches on `Platform.OS` to call a toast.
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

/**
 * Map our cross-platform `tone` to sonner's named methods. Sonner has
 * no public `tone` option; you have to call the right method to get
 * the right styling.
 */
function dispatchSonner(tone: ToastTone, title: ReactNode, options: ToastOptions): ToastId | undefined {
    const sonner = getSonner();
    if (!sonner) return undefined;
    // Map our action shape (onClick) onto sonner's action shape (onClick).
    // Identical today, but kept as an explicit mapping so a future drift
    // (e.g. our action growing a `variant` prop) is contained here.
    const sonnerOptions: Record<string, unknown> = { ...options };
    if (options.action) {
        sonnerOptions.action = { label: options.action.label, onClick: options.action.onClick };
    }
    if (options.cancel) {
        sonnerOptions.cancel = { label: options.cancel.label, onClick: options.cancel.onClick };
    }
    delete sonnerOptions.tone;
    switch (tone) {
        case 'success':
            return sonner.toast.success(title as string, sonnerOptions as never);
        case 'danger':
            return sonner.toast.error(title as string, sonnerOptions as never);
        case 'warning':
            return sonner.toast.warning(title as string, sonnerOptions as never);
        case 'info':
            return sonner.toast.info(title as string, sonnerOptions as never);
        case 'default':
        default:
            return sonner.toast(title as string, sonnerOptions as never);
    }
}

function show(title: ReactNode, options: ToastOptions = {}): ToastId {
    const tone: ToastTone = options.tone ?? 'default';
    if (HAS_SONNER) {
        const id = dispatchSonner(tone, title, options);
        if (id !== undefined) return id;
        // sonner unavailable on web (e.g. SSR or pruned bundle) — fall
        // through to the store so the call still resolves.
    }
    return store.add(title, { ...options, tone });
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
    if (HAS_SONNER) {
        const sonner = getSonner();
        if (sonner) {
            if (id === undefined) sonner.toast.dismiss();
            else sonner.toast.dismiss(id);
            return;
        }
    }
    store.dismiss(id);
};

toastFn.promise = (promise, opts) => {
    const resolved = typeof promise === 'function' ? promise() : promise;
    if (HAS_SONNER) {
        const sonner = getSonner();
        if (sonner) {
            return sonner.toast.promise(resolved, opts as never) as ToastId;
        }
    }
    // Native fallback: show a loading toast, then update on resolve.
    const id = show(opts.loading, { tone: 'default', duration: Number.POSITIVE_INFINITY });
    resolved.then(
        (data) => {
            const title = typeof opts.success === 'function' ? opts.success(data) : opts.success;
            store.update(id, { title, tone: 'success', duration: 4000, insertedAt: Date.now() });
        },
        (err) => {
            const title = typeof opts.error === 'function' ? opts.error(err) : opts.error;
            store.update(id, { title, tone: 'danger', duration: 4000, insertedAt: Date.now() });
        }
    );
    return id;
};

export const toast = toastFn;
