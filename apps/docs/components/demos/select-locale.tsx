'use client';

import { SegmentedControl, Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

// Names chosen specifically to surface the difference between locales.
// In **English / German**: Å, Ä, Ö collate close to A and O — so Åke,
// Ärger, and Östen sit near the top of the list.
// In **Swedish**: those three letters live at the END of the alphabet
// (after Z) — so the same names jump to the bottom. The reordering is
// dramatic enough to make the locale picker actually mean something.
//
// In **Czech**: the digraph "ch" sorts as a single letter AFTER "h" —
// "Chvála" therefore sits AFTER "Hugo" in cs but BEFORE in everything
// else. We added two ch- entries to surface that difference too.
const NAMES: SelectOption[] = [
    { value: 'anna', label: 'Anna' },
    { value: 'ake', label: 'Åke' },
    { value: 'bertil', label: 'Bertil' },
    { value: 'osten', label: 'Östen' },
    { value: 'arger', label: 'Ärger' },
    { value: 'zoe', label: 'Zoë' },
    { value: 'yngve', label: 'Yngve' },
    { value: 'hugo', label: 'Hugo' },
    { value: 'chvala', label: 'Chvála' },
    { value: 'ivan', label: 'Ivan' },
];

const HINT: Record<'en' | 'de' | 'sv' | 'cs', string> = {
    en: 'English: Å, Ä, Ö collate near A/O — Åke, Ärger, Östen sit near the top.',
    de: 'German: same as English for these names — umlauts treated as base letter.',
    sv: 'Swedish: Å, Ä, Ö are letters at the END of the alphabet — they jump below Z.',
    cs: 'Czech: the digraph "ch" sorts as a single letter AFTER "h" — Chvála lands after Hugo.',
};

/**
 * Picker resorts on every locale change via Intl.Collator. Choose from
 * four locales whose collation rules produce visibly different orderings
 * for the same input — Åke and Östen migrate to the bottom in Swedish;
 * Chvála leaps past Hugo in Czech.
 */
export default function SelectLocale() {
    const [locale, setLocale] = useState<'en' | 'de' | 'sv' | 'cs'>('en');
    return (
        <VStack gap={3}>
            <SegmentedControl
                value={locale}
                onChange={setLocale}
                options={[
                    { value: 'en', label: 'English' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'sv', label: 'Svenska' },
                    { value: 'cs', label: 'Čeština' },
                ]}
            />
            <Text variant="body-sm">{HINT[locale]}</Text>
            <Select options={NAMES} locale={locale} placeholder="Select a name" aria-label="Name" />
        </VStack>
    );
}
