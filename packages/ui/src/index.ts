// Public entry for `nori-ui`. RSC-safe exports only.
//
// Stateful / client-only surface (NoriProvider, useTheme, useTranslation,
// SemanticIconsProvider, useSemanticIcon) lives in `nori-ui/client`.
// Consumers who use any hook or provider MUST import from `nori-ui/client`
// and add `'use client'` to the importing file.

// components (RSC-safe pure primitives)
export * from './components';
// i18n (RSC-safe subset: types + defaults + resolver)
export {
    type Dictionary,
    defaultDictionary,
    type I18nInput,
    type I18nKeys,
    type I18nOptions,
    resolveI18n,
    type TranslateFn,
} from './i18n';
// icons (RSC-safe subset: wrapper component + type)
export {
    defaultSemanticIcons,
    Icon,
    type IconComponentProps,
    type IconProps,
    type IconSize,
    type SemanticIcons,
} from './icons';
// slot / composition
export { composeRefs, Slot, type SlotProps } from './slot';
// theme (RSC-safe subset: types + constants)
export { type Theme, theme, themeDark } from './theme';
// utilities
export { type ClassInput, cn } from './utils/cn';
