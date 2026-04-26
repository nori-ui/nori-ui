'use client';

import { Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useMemo, useState } from 'react';

export default function SelectVirtualized() {
    const options = useMemo<SelectOption[]>(
        () =>
            Array.from({ length: 1000 }, (_, i) => ({
                value: `row-${i}`,
                label: `Row ${i + 1}`,
            })),
        []
    );
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
        <VStack gap={3}>
            <Text>1000 static items — only the visible window is rendered, scroll to see more.</Text>
            <Select
                options={options}
                {...(value !== undefined ? { value } : {})}
                onChange={(next) => setValue(next)}
                placeholder="Select a row"
                aria-label="Row"
            />
        </VStack>
    );
}
