import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from '../HStack';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
    title: 'Primitives/Separator',
    component: Separator,
};
export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
    render: () => (
        <VStack gap={3}>
            <Text>Account</Text>
            <Separator />
            <Text>Email preferences</Text>
            <Separator />
            <Text>Danger zone</Text>
        </VStack>
    ),
};

export const Vertical: Story = {
    render: () => (
        // Inline height so the vertical rule has something to occupy —
        // `self-stretch` on Separator requires the parent to have a
        // defined cross-axis size.
        <HStack gap={3} style={{ alignItems: 'center', height: 24 }}>
            <Text>Edit</Text>
            <Separator orientation="vertical" />
            <Text>Share</Text>
            <Separator orientation="vertical" />
            <Text>Delete</Text>
        </HStack>
    ),
};
