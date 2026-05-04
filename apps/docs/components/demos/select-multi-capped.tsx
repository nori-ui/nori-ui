'use client';

import { Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

const FRUIT_OPTIONS: SelectOption[] = [
    { value: 'apple', label: 'Apple', group: 'Pomes' },
    { value: 'pear', label: 'Pear', group: 'Pomes' },
    { value: 'cherry', label: 'Cherry', group: 'Stone fruit' },
    { value: 'peach', label: 'Peach', group: 'Stone fruit' },
    { value: 'banana', label: 'Banana', group: 'Tropical' },
    { value: 'mango', label: 'Mango', group: 'Tropical' },
];

export default function SelectMultiCapped() {
    const [values, setValues] = useState<ReadonlyArray<string>>(['apple']);
    return (
        <VStack gap={3}>
            <Select
                multiple
                options={FRUIT_OPTIONS}
                value={values}
                onChange={(next) => setValues(next)}
                maxSelected={3}
                maxChips={2}
                placeholder="Pick up to 3"
                aria-label="Fruits (max 3)"
            />
            <Text>
                {values.length}/3 picked — {values.join(', ') || '—'}
            </Text>
        </VStack>
    );
}
