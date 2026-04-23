// RSC-safe i18n exports.
// Provider + hook live in './context' and './use-translation' — these are re-exported
// from packages/core/src/client.ts (which has 'use client'), NOT from here.

export { defaultDictionary } from './default-dictionary';
export { resolveI18n } from './resolve';
export type { Dictionary, I18nInput, I18nKeys, I18nOptions, TranslateFn } from './types';
