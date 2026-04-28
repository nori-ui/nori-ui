import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from '../HStack';
import { VStack } from '../VStack';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
    title: 'Display/Badge',
    component: Badge,
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Tones: Story = {
    render: () => (
        <VStack gap={3}>
            <HStack gap={2} align="center">
                <Badge>Neutral</Badge>
                <Badge tone="primary">Primary</Badge>
                <Badge tone="success">Active</Badge>
                <Badge tone="warning">Pending</Badge>
                <Badge tone="danger">Failed</Badge>
            </HStack>
        </VStack>
    ),
};
export const Appearances: Story = {
    render: () => (
        <HStack gap={2} align="center">
            <Badge appearance="solid" tone="primary">
                Solid
            </Badge>
            <Badge appearance="outline" tone="primary">
                Outline
            </Badge>
            <Badge tone="primary">Soft</Badge>
        </HStack>
    ),
};
