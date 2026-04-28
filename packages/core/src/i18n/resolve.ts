import type { Dictionary, I18nInput, I18nOptions, TranslateFn } from './types';

/**
 * Normalizes the consumer's i18n input (undefined | dictionary | function) into a
 * uniform TranslateFn. Internal code only calls the returned function.
 *
 * Precedence for a given key lookup:
 *   1. consumer function (if provided) — called verbatim, no further fallback
 *   2. consumer dictionary (if provided)
 *   3. library defaults
 *   4. options.defaultValue
 *   5. the key itself (so missing strings are visible in dev, not silent)
 */
export function resolveI18n(input: I18nInput, defaults: Dictionary): TranslateFn {
    if (typeof input === 'function') {
        // Wrap so the consumer fn is always invoked with (key, options) — enables
        // Jest `toHaveBeenCalledWith(key, undefined)` assertions and mirrors i18next's
        // own call signature exactly.
        return (keyOrKeys, options) => input(keyOrKeys, options);
    }

    const dict = input ?? {};

    return (keyOrKeys, options) => {
        const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
        for (const rawKey of keys) {
            const key = pluralize(rawKey, options?.count);
            const template = dict[key] ?? defaults[key];
            if (template !== undefined) {
                return interpolate(template, options);
            }
        }
        // exhausted the key list
        const lastKey = keys[keys.length - 1];
        if (options?.defaultValue !== undefined) {
            return interpolate(options.defaultValue, options);
        }
        return lastKey ?? '';
    };
}

function pluralize(key: string, count: number | undefined): string {
    if (count === undefined) {
        return key;
    }
    // Minimal English pluralization — extend with ICU rules later if needed.
    if (count === 1) {
        return `${key}_one`;
    }
    return `${key}_other`;
}

function interpolate(template: string, options: I18nOptions | undefined): string {
    if (!options) {
        return template;
    }
    return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? '' : String(value);
    });
}
