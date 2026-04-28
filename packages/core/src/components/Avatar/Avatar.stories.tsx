import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from '../HStack';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
    title: 'Display/Avatar',
    component: Avatar,
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Sizes: Story = {
    render: () => (
        <HStack gap={3} align="center">
            <Avatar name="Ada Lovelace" size="sm" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Margaret Hamilton" size="lg" />
            <Avatar size="xl" />
        </HStack>
    ),
};
export const WithName: Story = { args: { name: 'Ada Lovelace' } };
export const Fallback: Story = { args: { size: 'lg' } };
