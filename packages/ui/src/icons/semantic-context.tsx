'use client';

import type { ReactNode } from 'react';
import { createContext } from 'react';
import { defaultSemanticIcons, type SemanticIcons } from './default-semantic-icons';

export const SemanticIconsContext = createContext<SemanticIcons>(defaultSemanticIcons);
SemanticIconsContext.displayName = 'SemanticIconsContext';

export type SemanticIconsProviderProps = {
    icons?: Partial<SemanticIcons>;
    children?: ReactNode;
};

export function SemanticIconsProvider({ icons, children }: SemanticIconsProviderProps) {
    const merged: SemanticIcons = icons ? { ...defaultSemanticIcons, ...icons } : defaultSemanticIcons;
    return <SemanticIconsContext.Provider value={merged}>{children}</SemanticIconsContext.Provider>;
}
