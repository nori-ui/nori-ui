'use client';

import { type LoadOptionsResult, Select, Text, VStack } from '@nori-ui/core';
import { useCallback, useState } from 'react';

// Simulated server. In a real app this is a fetch() to your API.
const ALL_COUNTRIES = [
    'Argentina',
    'Australia',
    'Austria',
    'Belgium',
    'Brazil',
    'Canada',
    'Chile',
    'China',
    'Colombia',
    'Czechia',
    'Denmark',
    'Egypt',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'India',
    'Indonesia',
    'Ireland',
    'Israel',
    'Italy',
    'Japan',
    'Kenya',
    'Mexico',
    'Netherlands',
    'New Zealand',
    'Norway',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Romania',
    'Spain',
    'Sweden',
    'Switzerland',
    'Thailand',
    'Turkey',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Vietnam',
];

const fakeApi = async ({
    search,
    offset,
    limit,
}: {
    search: string;
    offset: number;
    limit: number;
}): Promise<LoadOptionsResult> => {
    // Network jitter so the loading state actually shows.
    await new Promise((resolve) => setTimeout(resolve, 250));
    const filtered = ALL_COUNTRIES.filter((name) => name.toLowerCase().includes(search.toLowerCase()));
    const slice = filtered.slice(offset, offset + limit);
    return {
        items: slice.map((name) => ({ value: name.toLowerCase().replace(/\s+/g, '-'), label: name })),
        total: filtered.length,
    };
};

export default function SelectAsync() {
    const [country, setCountry] = useState<string | undefined>(undefined);
    const loadOptions = useCallback(fakeApi, []);
    return (
        <VStack gap={3}>
            <Text>
                Async loader with simulated network jitter and 8-item pages. Type to refilter; scroll to load the next
                page.
            </Text>
            <Select
                {...(country !== undefined ? { value: country } : {})}
                onChange={(next) => setCountry(next)}
                loadOptions={loadOptions}
                pageSize={8}
                placeholder="Select a country"
                aria-label="Country"
            />
        </VStack>
    );
}
