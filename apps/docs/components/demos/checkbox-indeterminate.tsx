'use client';

import { Checkbox, Text, VStack } from '@nori-ui/core';
import { useMemo, useState } from 'react';

const PERMISSIONS = ['Read', 'Write', 'Admin'] as const;

/**
 * "Select all" parent checkbox that's indeterminate when some — but not
 * all — children are checked. Standard interactive pattern; `indeterminate`
 * is purely a controlled prop driven by the parent's logic.
 */
export default function CheckboxIndeterminate() {
    const [selected, setSelected] = useState<Set<string>>(new Set(['Read']));
    const allChecked = selected.size === PERMISSIONS.length;
    const someChecked = selected.size > 0 && !allChecked;

    const toggleAll = useMemo(
        () => () => {
            setSelected(allChecked ? new Set() : new Set(PERMISSIONS));
        },
        [allChecked]
    );
    const toggleOne = (perm: string) => () => {
        setSelected((cur) => {
            const next = new Set(cur);
            next.has(perm) ? next.delete(perm) : next.add(perm);
            return next;
        });
    };

    return (
        <VStack gap={3}>
            <Checkbox
                label="Select all permissions"
                checked={allChecked}
                indeterminate={someChecked}
                onChange={toggleAll}
            />
            <VStack gap={2} style={{ paddingLeft: 28 }}>
                {PERMISSIONS.map((perm) => (
                    <Checkbox key={perm} label={perm} checked={selected.has(perm)} onChange={toggleOne(perm)} />
                ))}
            </VStack>
            <Text variant="body-sm">
                {selected.size} of {PERMISSIONS.length} selected
            </Text>
        </VStack>
    );
}
