import type { Meta, StoryObj } from '@storybook/react';
import { VStack } from '../VStack';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
    title: 'Feedback/Progress',
    component: Progress,
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const WithLabels: Story = {
    render: () => (
        <VStack gap={4}>
            <Progress value={25} label="Uploading" />
            <Progress value={64} label="Syncing files" />
            <Progress value={92} label="Almost done" />
        </VStack>
    ),
};
export const Tones: Story = {
    render: () => (
        <VStack gap={3}>
            <Progress value={50} tone="primary" label="Primary" />
            <Progress value={50} tone="success" label="Success" />
            <Progress value={50} tone="warning" label="Warning" />
            <Progress value={50} tone="danger" label="Danger" />
        </VStack>
    ),
};
