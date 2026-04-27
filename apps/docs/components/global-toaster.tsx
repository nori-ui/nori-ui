'use client';

import { Toaster } from '@nori-ui/core/client';

/**
 * One global `<Toaster />` for the docs site. Sonner's `toast()` is a
 * global emitter — every mounted Toaster shows every toast — so a
 * single instance lives here in a client component the RSC layout can
 * embed without crossing the server/client boundary itself.
 *
 * `richColors` and `closeButton` are on so toast demos visibly use
 * those features without each demo having to ship its own (now
 * disallowed) Toaster.
 */
export function GlobalToaster() {
    return <Toaster richColors closeButton />;
}
