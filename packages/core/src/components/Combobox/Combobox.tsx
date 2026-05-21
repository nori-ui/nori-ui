'use client';

import { Select, type SelectProps } from '../Select';

/**
 * Combobox — a Select with search defaulted on.
 *
 * Use Combobox for long lists or async options where users benefit from
 * typeahead filtering. Use Select directly for short static lists where
 * clicking is enough.
 *
 * Every prop, behavior, and type is identical to Select; this is purely a
 * default + naming convenience.
 */
export const Combobox = <T = unknown>(props: SelectProps<T>) => {
    return <Select searchable {...props} />;
};
