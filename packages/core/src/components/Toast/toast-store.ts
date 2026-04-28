'use client';

import type { ActiveToast, ToastOptions } from './types';

/**
 * Native toast store. Holds the currently-visible toasts and notifies
 * subscribers (the `<Toaster>` viewport) when the list changes.
 *
 * On web, sonner's own internal store is the source of truth and this
 * file is unused for active toasts. We still export the same API
 * surface so the imperative entry point can branch cleanly.
 *
 * Pattern: a Map keyed by id, plus a Set of subscribers. Each `add`/
 * `dismiss` produces a new snapshot array (not in-place mutation) so
 * `useSyncExternalStore` consumers get stable identity-based change
 * detection.
 */

type Listener = () => void;

let counter = 0;
const toasts = new Map<string | number, ActiveToast>();
const listeners = new Set<Listener>();
let snapshot: readonly ActiveToast[] = [];

function rebuildSnapshot(): void {
    snapshot = Array.from(toasts.values());
}

function notify(): void {
    for (const l of listeners) {
        l();
    }
}

function nextId(): string {
    counter += 1;
    return `t${counter}`;
}

export function add(title: ActiveToast['title'], options: ToastOptions = {}): string | number {
    const id = options.id ?? nextId();
    const entry: ActiveToast = {
        ...options,
        id,
        title,
        insertedAt: Date.now(),
    };
    toasts.set(id, entry);
    rebuildSnapshot();
    notify();
    return id;
}

export function update(id: string | number, patch: Partial<ActiveToast>): void {
    const existing = toasts.get(id);
    if (!existing) {
        return;
    }
    toasts.set(id, { ...existing, ...patch, id });
    rebuildSnapshot();
    notify();
}

export function dismiss(id?: string | number): void {
    if (id === undefined) {
        if (toasts.size === 0) {
            return;
        }
        toasts.clear();
    } else if (!toasts.delete(id)) {
        return;
    }
    rebuildSnapshot();
    notify();
}

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getSnapshot(): readonly ActiveToast[] {
    return snapshot;
}
