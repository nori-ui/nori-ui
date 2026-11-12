'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { defaultSemanticIcons, type SemanticIcons } from './default-semantic-icons';

export const SemanticIconsContext = createContext<SemanticIcons>(defaultSemanticIcons);
SemanticIconsContext.displayName = 'SemanticIconsContext';

export type SemanticIconsProviderProps = {
    icons?: Partial<SemanticIcons>;
    children?: ReactNode;
};

export function SemanticIconsProvider({ icons, children }: SemanticIconsProviderProps) {
    // Overrides layer on top of the surrounding icon set, so a nested
    // provider keeps what an outer one configured.
    const parent = useContext(SemanticIconsContext);
    const merged = useMemo<SemanticIcons>(() => (icons ? { ...parent, ...icons } : parent), [icons, parent]);
    return <SemanticIconsContext.Provider value={merged}>{children}</SemanticIconsContext.Provider>;
}
