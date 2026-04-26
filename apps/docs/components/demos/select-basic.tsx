'use client';

import { Select, type SelectOption, VStack } from '@nori-ui/core';
import { useState } from 'react';

const FRUIT_OPTIONS: SelectOption[] = [
    { value: 'apple', label: 'Apple', group: 'Pomes' },
    { value: 'pear', label: 'Pear', group: 'Pomes' },
    { value: 'cherry', label: 'Cherry', group: 'Stone fruit' },
    { value: 'peach', label: 'Peach', group: 'Stone fruit' },
    { value: 'banana', label: 'Banana', group: 'Tropical' },
    { value: 'mango', label: 'Mango', group: 'Tropical' },
];

export default function SelectBasic() {
    const [fruit, setFruit] = useState<string | undefined>(undefined);
    return (
        <VStack gap={3}>
            <Select
                options={FRUIT_OPTIONS}
                {...(fruit !== undefined ? { value: fruit } : {})}
                onChange={(next) => setFruit(next)}
                placeholder="Pick a fruit"
                aria-label="Fruit"
            />
        </VStack>
    );
}
