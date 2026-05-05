'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

export type LocaleInput = string | Intl.Locale;

/**
 * Resolve the runtime's default locale. Works under Hermes (which ships
 * Intl on iOS via system ICU and on Android via bundled ICU) and any
 * browser. Returns a BCP 47 tag.
 */
export const detectLocale = (): string => {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
        return 'en-US';
    }
};

const toTag = (input: LocaleInput | undefined): string =>
    input === undefined ? detectLocale() : typeof input === 'string' ? input : input.toString();

const LocaleContext = createContext<string | null>(null);
LocaleContext.displayName = 'LocaleContext';

export type LocaleProviderProps = {
    locale?: LocaleInput;
    children?: ReactNode;
};

export const LocaleProvider = ({ locale, children }: LocaleProviderProps) => {
    const value = useMemo(() => toTag(locale), [locale]);
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): string => {
    const ctx = useContext(LocaleContext);
    return ctx ?? detectLocale();
};
