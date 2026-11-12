import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Rating } from './Rating';

const meta: Meta<typeof Rating> = {
    title: 'Inputs/Rating',
    component: Rating,
};
export default meta;
type Story = StoryObj<typeof Rating>;

function Controlled({ allowHalf = false }: { allowHalf?: boolean }) {
    const [value, setValue] = useState(3);
    return (
        <VStack gap={2}>
            <Rating value={value} onChange={setValue} allowHalf={allowHalf} allowClear aria-label="Rate this product" />
            <Text>Value: {value}</Text>
        </VStack>
    );
}

export const Basic: Story = { render: () => <Controlled /> };
export const HalfSteps: Story = { render: () => <Controlled allowHalf /> };

export const ReadOnly: Story = {
    render: () => (
        <VStack gap={2}>
            <Rating readOnly value={4} />
            <Rating readOnly value={3.5} />
            <Rating readOnly value={4.3} />
        </VStack>
    ),
};

export const Sizes: Story = {
    render: () => (
        <VStack gap={2}>
            <Rating size="sm" defaultValue={3} />
            <Rating size="md" defaultValue={3} />
            <Rating size="lg" defaultValue={3} />
        </VStack>
    ),
};

export const Disabled: Story = { render: () => <Rating disabled defaultValue={2} /> };
