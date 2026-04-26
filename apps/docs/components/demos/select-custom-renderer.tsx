'use client';

import { Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

type User = { name: string; email: string; role: string };

const USERS: SelectOption<User>[] = [
    { value: 'ada', label: 'Ada Lovelace', data: { name: 'Ada Lovelace', email: 'ada@nori-ui.dev', role: 'Owner' } },
    {
        value: 'grace',
        label: 'Grace Hopper',
        data: { name: 'Grace Hopper', email: 'grace@nori-ui.dev', role: 'Admin' },
    },
    {
        value: 'margaret',
        label: 'Margaret Hamilton',
        data: { name: 'Margaret Hamilton', email: 'margaret@nori-ui.dev', role: 'Editor' },
    },
];

export default function SelectCustomRenderer() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
        <VStack gap={3}>
            <Text>Custom item renderer — name + email + role per row.</Text>
            <Select<User>
                options={USERS}
                {...(value !== undefined ? { value } : {})}
                onChange={(next) => setValue(next)}
                placeholder="Assign to…"
                aria-label="Assignee"
                renderOption={(option, { selected }) => (
                    <VStack gap={0} className="flex-1">
                        <Text>
                            {option.data?.name}
                            {selected ? ' ✓' : ''}
                        </Text>
                        <Text variant="body-sm">
                            {option.data?.email} · {option.data?.role}
                        </Text>
                    </VStack>
                )}
            />
        </VStack>
    );
}
