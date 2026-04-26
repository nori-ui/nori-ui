'use client';

import { SegmentedControl, Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

const CITIES: SelectOption[] = [
    { value: 'zurich', label: 'Zürich' },
    { value: 'aarhus', label: 'Århus' },
    { value: 'beijing', label: 'Beijing' },
    { value: 'osaka', label: 'Osaka' },
    { value: 'oslo', label: 'Oslo' },
    { value: 'paris', label: 'Paris' },
    { value: 'aalst', label: 'Aalst' },
];

export default function SelectLocale() {
    const [locale, setLocale] = useState<'en' | 'de' | 'sv'>('en');
    return (
        <VStack gap={3}>
            <SegmentedControl
                value={locale}
                onChange={setLocale}
                options={[
                    { value: 'en', label: 'English' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'sv', label: 'Svenska' },
                ]}
            />
            <Text>
                Switch locale — the option list re-sorts via Intl.Collator. (English: Aalst, Århus, … vs Swedish: Aalst,
                …, Århus.)
            </Text>
            <Select options={CITIES} locale={locale} placeholder="Select a city" aria-label="City" />
        </VStack>
    );
}
