'use client';

import { useContext } from 'react';
import type { SemanticIcons } from './default-semantic-icons';
import { SemanticIconsContext } from './semantic-context';

export function useSemanticIcon<K extends keyof SemanticIcons>(name: K): SemanticIcons[K] {
    const icons = useContext(SemanticIconsContext);
    return icons[name];
}
