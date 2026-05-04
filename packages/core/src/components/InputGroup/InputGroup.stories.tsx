import type { Meta, StoryObj } from '@storybook/react';
import { VStack } from '../VStack';
import { InputGroup } from './InputGroup';

const meta: Meta<typeof InputGroup> = {
    title: 'Inputs/InputGroup',
    component: InputGroup,
};
export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Prefix: Story = {
    render: () => (
        <InputGroup>
            <InputGroup.Addon>@</InputGroup.Addon>
            <InputGroup.Input placeholder="username" />
        </InputGroup>
    ),
};
export const Suffix: Story = {
    render: () => (
        <InputGroup>
            <InputGroup.Input placeholder="amount" />
            <InputGroup.Addon>USD</InputGroup.Addon>
        </InputGroup>
    ),
};
export const Both: Story = {
    render: () => (
        <VStack gap={3}>
            <InputGroup>
                <InputGroup.Addon>https://</InputGroup.Addon>
                <InputGroup.Input placeholder="example.com" />
                <InputGroup.Addon>/path</InputGroup.Addon>
            </InputGroup>
        </VStack>
    ),
};
