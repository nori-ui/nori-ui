'use client';

/**
 * Native implementation of the Select popup host. Select renders its popup in
 * an RN `<Modal>` on native, so there is nothing to portal; this file exists
 * so native bundles never resolve the `react-dom` import in `SelectPortal.tsx`.
 */

import type { ReactNode } from 'react';

export type SelectPortalProps = {
    children: ReactNode;
};

export const SelectPortal = ({ children }: SelectPortalProps): ReactNode => children;
