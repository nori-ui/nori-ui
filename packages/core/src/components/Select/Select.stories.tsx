import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select, type SelectOption } from './Select';

const meta: Meta<typeof Select> = {
    title: 'Inputs/Select',
    component: Select,
};
export default meta;
type Story = StoryObj<typeof Select>;

const FRUIT: SelectOption[] = [
    { value: 'apple', label: 'Apple', group: 'Pomes' },
    { value: 'pear', label: 'Pear', group: 'Pomes' },
    { value: 'cherry', label: 'Cherry', group: 'Stone fruit' },
    { value: 'peach', label: 'Peach', group: 'Stone fruit' },
    { value: 'banana', label: 'Banana', group: 'Tropical' },
    { value: 'mango', label: 'Mango', group: 'Tropical' },
];

function FruitPicker() {
    const [v, setV] = useState<string | undefined>(undefined);
    return (
        <Select
            options={FRUIT}
            {...(v !== undefined ? { value: v } : {})}
            onChange={(next) => setV(next)}
            placeholder="Pick a fruit"
            aria-label="Fruit"
        />
    );
}

export const Grouped: Story = { render: () => <FruitPicker /> };

function MultiFruitPicker() {
    const [values, setValues] = useState<ReadonlyArray<string>>([]);
    return (
        <Select
            multiple
            options={FRUIT}
            value={values}
            onChange={(next) => setValues(next)}
            placeholder="Pick some fruits"
            aria-label="Fruits"
        />
    );
}

/** Multi-select with chip preview, "Clear all", and `aria-multiselectable`. */
export const Multiple: Story = { render: () => <MultiFruitPicker /> };

function MultiCappedPicker() {
    const [values, setValues] = useState<ReadonlyArray<string>>(['apple']);
    return (
        <Select
            multiple
            options={FRUIT}
            value={values}
            onChange={(next) => setValues(next)}
            maxSelected={3}
            maxChips={2}
            placeholder="Pick up to 3"
            aria-label="Fruits (max 3)"
        />
    );
}

/** Multi-select capped at 3 items + chip overflow at 2. */
export const MultipleCapped: Story = { render: () => <MultiCappedPicker /> };
