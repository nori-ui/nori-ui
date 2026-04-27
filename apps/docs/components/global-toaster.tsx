'use client';

import { Toaster } from '@nori-ui/core/client';

/**
 * One global `<Toaster />` for the docs site. Sonner's `toast()` is a
 * global emitter — every mounted Toaster shows every toast — so a
 * single instance lives here in a client component the RSC layout can
 * embed without crossing the server/client boundary itself.
 *
 * `richColors` is on so the tone-driven palettes are visible across
 * the docs without per-demo configuration.
 */
export function GlobalToaster() {
    return <Toaster richColors />;
}
