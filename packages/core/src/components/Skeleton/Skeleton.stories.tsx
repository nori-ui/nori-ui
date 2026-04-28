import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from '../HStack';
import { VStack } from '../VStack';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'Feedback/Skeleton',
    component: Skeleton,
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Profile: Story = {
    render: () => (
        <HStack gap={3} align="center">
            <Skeleton width={48} height={48} radius="full" />
            <VStack gap={2} style={{ flex: 1 }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="80%" height={12} />
            </VStack>
        </HStack>
    ),
};
export const Block: Story = {
    args: { width: '100%', height: 64 },
};
