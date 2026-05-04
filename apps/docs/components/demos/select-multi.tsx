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

export default function SelectMulti() {
    const [values, setValues] = useState<ReadonlyArray<string>>([]);
    return (
        <VStack gap={3}>
            <Select
                multiple
                options={FRUIT_OPTIONS}
                value={values}
                onChange={(next) => setValues(next)}
                placeholder="Pick some fruits"
                aria-label="Fruits"
            />
            <Text>{values.length === 0 ? 'No selection' : `Picked: ${values.join(', ')}`}</Text>
        </VStack>
    );
}
