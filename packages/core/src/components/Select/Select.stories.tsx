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
