'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { defaultDictionary } from './default-dictionary';
import { resolveI18n } from './resolve';
import type { I18nInput, TranslateFn } from './types';

export type I18nContextValue = {
    t: TranslateFn;
};

// Default context value uses the built-in English dictionary; consumers without
// a provider still get a working t().
const defaultValue: I18nContextValue = {
    t: resolveI18n(undefined, defaultDictionary),
};

export const I18nContext = createContext<I18nContextValue>(defaultValue);
I18nContext.displayName = 'I18nContext';

export type I18nProviderProps = {
    i18n?: I18nInput;
    children?: ReactNode;
};

export function I18nProvider({ i18n, children }: I18nProviderProps) {
    // Without an `i18n` prop a nested provider inherits the surrounding
    // translations instead of resetting the subtree to the English defaults.
    const parent = useContext(I18nContext);
    const value = useMemo<I18nContextValue>(
        () => (i18n === undefined ? parent : { t: resolveI18n(i18n, defaultDictionary) }),
        [i18n, parent]
    );
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
