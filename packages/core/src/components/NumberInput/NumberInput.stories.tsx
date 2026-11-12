import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Field } from '../Field';
import { VStack } from '../VStack';
import { NumberInput } from './NumberInput';

const meta: Meta<typeof NumberInput> = {
    title: 'Inputs/NumberInput',
    component: NumberInput,
    args: { 'aria-label': 'Quantity', defaultValue: 1 },
};
export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Bare: Story = {};

export const MinMax: Story = { args: { min: 0, max: 5, defaultValue: 4 } };

export const DecimalStep: Story = { args: { step: 0.1, defaultValue: 0.1, min: 0, max: 1 } };

export const FixedPrecision: Story = { args: { step: 0.5, precision: 2, defaultValue: 9.5, min: 0 } };

export const Empty: Story = { args: { defaultValue: null, placeholder: '0' } };

export const Disabled: Story = { args: { disabled: true, defaultValue: 3 } };

export const Sizes: Story = {
    render: () => (
        <VStack gap={3}>
            <NumberInput aria-label="Small" size="sm" defaultValue={1} />
            <NumberInput aria-label="Medium" size="md" defaultValue={1} />
            <NumberInput aria-label="Large" size="lg" defaultValue={1} />
        </VStack>
    ),
};

export const InsideField = () => (
    <Field label="Guests" description="Between 1 and 8.">
        <NumberInput min={1} max={8} defaultValue={2} />
    </Field>
);

export const InsideFieldWithError = () => (
    <Field label="Guests" error="Enter the number of guests.">
        <NumberInput min={1} max={8} />
    </Field>
);

export const Controlled = () => {
    const [value, setValue] = useState<number | null>(2);
    return (
        <Field label="Guests" description={value === null ? 'No value' : `Value: ${value}`}>
            <NumberInput value={value} onChange={setValue} min={1} max={8} />
        </Field>
    );
};
