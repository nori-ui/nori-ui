'use client';

import { Combobox } from '@nori-ui/core';
import { useState } from 'react';

export default function ComboboxBasicDemo() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
        <Combobox
            {...(value !== undefined ? { value } : {})}
            onChange={(next) => setValue(next)}
            options={[
                { value: 'apple', label: 'Apple' },
                { value: 'banana', label: 'Banana' },
                { value: 'cherry', label: 'Cherry' },
                { value: 'date', label: 'Date' },
                { value: 'elderberry', label: 'Elderberry' },
                { value: 'fig', label: 'Fig' },
                { value: 'grape', label: 'Grape' },
            ]}
            placeholder="Pick a fruit"
            aria-label="Fruit"
        />
    );
}
