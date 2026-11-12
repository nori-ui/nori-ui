'use client';

/**
 * Web implementation of the Select popup host. Metro resolves
 * `SelectPortal.native.tsx` on iOS/Android, so `react-dom` (an optional peer)
 * is only ever imported by web bundles.
 *
 * Portaling to `<body>` matters even though the popup is `position: fixed`:
 * an ancestor with `transform`, `filter`, or `will-change` creates a
 * containing block that traps fixed positioning and a stacking context that
 * traps z-index.
 */

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type SelectPortalProps = {
    children: ReactNode;
};

export const SelectPortal = ({ children }: SelectPortalProps): ReactNode => {
    if (typeof document === 'undefined') {
        return null;
    }
    return createPortal(children, document.body);
};
