// Barrel for `@nori-ui/core/stories`.
//
// Re-exports the CSF-derived `components` array (the runtime source of
// truth for the native playground) plus the helper types. The legacy
// flat `stories` export from `story-registry.tsx` is gone — consumers
// now iterate `components[i].stories[j]` instead.

export {
    buildComponents,
    type ComponentEntry,
    components,
    humanise,
    pascalToKebab,
    type Story,
} from './csf-loader';
