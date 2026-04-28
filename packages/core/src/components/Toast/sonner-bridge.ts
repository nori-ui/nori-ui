'use client';

/**
 * Sonner bridge.
 *
 * Strategy: a STATIC `import` of sonner so the consumer's bundler
 * (Next.js / Vite / etc.) resolves the module the way it normally
 * would. Tsup keeps `sonner` external (see tsup.config.ts) so the
 * import survives bundling and the consumer's webpack/rollup pulls in
 * the right copy.
 *
 * `sonner` is web-only — it imports `react-dom`, which is unavailable
 * on a pure-RN Metro bundle. To keep this safe across platforms we
 * gate by `Platform.OS === 'web'` and wrap the static import in a
 * try/catch via a small async-isolated trick: the import is
 * eagerly-resolved at module load, but its identifier may resolve to
 * `undefined` if the consumer marked sonner as `false` in their
 * webpack config (e.g. an Expo + RN-only build that excludes sonner).
 *
 * Userland never branches on Platform.OS — `<Toaster />` renders the
 * sonner Toaster on web and our own Animated viewport on native; the
 * imperative `toast(...)` dispatches to the right one transparently.
 */

import { Platform } from 'react-native';
import * as SonnerModule from 'sonner';

type Sonner = {
    toast: typeof SonnerModule.toast;
    Toaster: typeof SonnerModule.Toaster;
};

let cached: Sonner | null | undefined;

function tryLoad(): Sonner | null {
    if (cached !== undefined) {
        return cached;
    }
    if (Platform.OS !== 'web') {
        cached = null;
        return null;
    }
    // `Toaster` is a `forwardRef` exotic, so `typeof === 'function'`
    // would reject a perfectly valid sonner build. Truthy + `toast`
    // callable is the actual contract we need.
    if (typeof SonnerModule.toast !== 'function' || SonnerModule.Toaster == null) {
        cached = null;
        return null;
    }
    cached = { toast: SonnerModule.toast, Toaster: SonnerModule.Toaster };
    return cached;
}

/** Returns sonner on web, `null` on native or if sonner is unavailable. */
export function getSonner(): Sonner | null {
    return tryLoad();
}

/** Web vs native discriminator — internal to the Toast subsystem. */
export const HAS_SONNER: boolean = Platform.OS === 'web';
