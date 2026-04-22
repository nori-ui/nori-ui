import type { Dictionary } from './types';

/**
 * Default English strings used by library components.
 *
 * Key naming convention:
 *   <component>.<purpose>[_plural-form]
 *
 * Plural suffixes follow i18next: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`.
 * Interpolation uses `{{name}}` — double braces, no spaces, by convention.
 */
export const defaultDictionary: Dictionary = {
    // generic / shared
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.loading': 'Loading',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',

    // button
    'button.loadingLabel': 'Loading',

    // input
    'input.clear': 'Clear',
    'input.passwordShow': 'Show password',
    'input.passwordHide': 'Hide password',

    // checkbox / switch
    'checkbox.checked': 'Checked',
    'checkbox.unchecked': 'Unchecked',
    'switch.on': 'On',
    'switch.off': 'Off',
};
