'use client';

import type { ReactNode } from 'react';
import { createContext, useMemo } from 'react';
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
    const value = useMemo<I18nContextValue>(() => ({ t: resolveI18n(i18n, defaultDictionary) }), [i18n]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
