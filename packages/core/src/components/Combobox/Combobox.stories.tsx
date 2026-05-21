import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NoriProvider } from '../../provider';
import { Combobox } from './Combobox';

const meta: Meta<typeof Combobox> = {
    title: 'Components/Combobox',
    decorators: [
        (Story) => (
            <NoriProvider>
                <Story />
            </NoriProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const FRUITS = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
    { value: 'fig', label: 'Fig' },
    { value: 'grape', label: 'Grape' },
];

function BasicCombobox() {
    const [value, setValue] = useState<string>('');
    return (
        <Combobox
            options={FRUITS}
            {...(value ? { value } : {})}
            onChange={(next) => setValue(next)}
            placeholder="Pick a fruit"
            aria-label="Fruit"
        />
    );
}

export const Basic: Story = { render: () => <BasicCombobox /> };
