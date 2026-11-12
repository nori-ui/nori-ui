'use client';

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type OverlayLayer = {
    onEscape: (event: KeyboardEvent) => void;
};

// Open overlays in the order they opened. Only the last entry may react to
// Escape, so one keypress dismisses the menu and not the dialog behind it.
const layers: OverlayLayer[] = [];

function onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
        return;
    }
    layers[layers.length - 1]?.onEscape(event);
}

function pushOverlayLayer(layer: OverlayLayer): () => void {
    if (layers.length === 0) {
        document.addEventListener('keydown', onDocumentKeyDown);
    }
    layers.push(layer);
    return () => {
        const index = layers.indexOf(layer);
        if (index !== -1) {
            layers.splice(index, 1);
        }
        if (layers.length === 0) {
            document.removeEventListener('keydown', onDocumentKeyDown);
        }
    };
}

/**
 * Registers an overlay (dialog, sheet, popover, tooltip, ...) in the shared
 * layer stack while `active`. `onEscape` runs only when this overlay is the
 * topmost one. Overlays that must not close on Escape (AlertDialog) still
 * register, with a no-op, so the key does not fall through to a layer below.
 *
 * Web only; native has no document-level key events.
 */
export function useEscapeLayer(active: boolean, onEscape: () => void): void {
    // The latest handler is read at call time so an inline callback does not
    // re-register the layer (which would move it to the top of the stack).
    const onEscapeRef = useRef(onEscape);
    onEscapeRef.current = onEscape;

    useEffect(() => {
        if (!active || Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }
        return pushOverlayLayer({
            onEscape: (event) => {
                event.preventDefault();
                onEscapeRef.current();
            },
        });
    }, [active]);
}
