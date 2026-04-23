// i18n types — API shape intentionally mirrors i18next so consumers who already use
// i18next can pass their `t` function directly to <NoriProvider i18n={t}>.

/** Options accepted by the library's internal t() calls. Subset of i18next's TOptions. */
export type I18nOptions = {
    /** Used for pluralization (e.g. `items_one` vs `items_other`). */
    count?: number;
    /** Default text to render if the key is missing from the active dictionary. */
    defaultValue?: string;
    /** Any other key is an interpolation value — consumed by {{var}} replacement. */
    [key: string]: unknown;
};

/** Shape-compatible with i18next's TFunction, narrowed for library usage. */
export type TranslateFn = (key: string | string[], options?: I18nOptions) => string;

/**
 * Consumer-facing i18n input. One of:
 *   - undefined: use library defaults
 *   - TranslateFn: call it (this is the i18next drop-in path)
 *   - Dictionary: flat key → value map; value may contain `{{vars}}` and/or `_one|_other` plural suffixes
 */
export type I18nInput = TranslateFn | Dictionary | undefined;

export type Dictionary = Readonly<Record<string, string>>;

/**
 * Keys shipped by the library — augmentable by consumers via module augmentation:
 *
 * ```ts
 * declare module 'nori-ui' {
 *     interface I18nKeys {
 *         'myApp.customLabel': string;
 *     }
 * }
 * ```
 *
 * Plan 05 extends this interface as each component registers its keys.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmentation target for consumers
export interface I18nKeys {
    // seeded by default-dictionary.ts — every key is a member
}
