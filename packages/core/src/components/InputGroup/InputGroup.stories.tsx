import type { Meta, StoryObj } from '@storybook/react';
import { VStack } from '../VStack';
import { InputGroup, InputGroupAddon, InputGroupInput } from './InputGroup';

const meta: Meta<typeof InputGroup> = {
    title: 'Inputs/InputGroup',
    component: InputGroup,
};
export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Prefix: Story = {
    render: () => (
        <InputGroup>
            <InputGroupAddon>@</InputGroupAddon>
            <InputGroupInput placeholder="username" />
        </InputGroup>
    ),
};
export const Suffix: Story = {
    render: () => (
        <InputGroup>
            <InputGroupInput placeholder="amount" />
            <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
    ),
};
export const Both: Story = {
    render: () => (
        <VStack gap={3}>
            <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <InputGroupInput placeholder="example.com" />
                <InputGroupAddon>/path</InputGroupAddon>
            </InputGroup>
        </VStack>
    ),
};
