import type { Meta, StoryObj } from '@storybook/react';
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
