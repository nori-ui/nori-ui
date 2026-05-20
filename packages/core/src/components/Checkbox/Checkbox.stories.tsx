import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Field } from '../Field';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
    title: 'Controls/Checkbox',
    component: Checkbox,
    args: { label: 'Accept terms' },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);
        return <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />;
    },
};

export const Checked: Story = {
    render: () => {
        const [checked, setChecked] = useState(true);
        return <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />;
    },
};

export const Disabled: Story = { args: { disabled: true } };

const PERMISSIONS = ['Read', 'Write', 'Admin'] as const;

/**
 * Indeterminate is only meaningful as a parent-of-children "select all"
 * checkbox: the parent is indeterminate when some — but not all —
 * children are checked. A single solo `indeterminate={true}` checkbox
 * has nothing to mean. So the story is the actual interactive pattern.
 *
 * Listed last because it's the advanced/compound use case — Default,
 * Checked and Disabled are the three core states a developer needs to
 * see first.
 */
export const InsideField: Story = {
    render: () => (
        <Field>
            <Field.Label>Notifications</Field.Label>
            <Field.Description>Choose how you'd like to be notified.</Field.Description>
            <Field.Control>
                <Checkbox label="Accept email digests" />
            </Field.Control>
        </Field>
    ),
};

export const InsideFieldWithError: Story = {
    render: () => (
        <Field error="You must accept the terms to continue.">
            <Field.Label>Terms</Field.Label>
            <Field.Control>
                <Checkbox label="Accept terms" />
            </Field.Control>
            <Field.Error />
        </Field>
    ),
};

export const Indeterminate: Story = {
    render: () => {
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
                if (next.has(perm)) {
                    next.delete(perm);
                } else {
                    next.add(perm);
                }
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
    },
};
