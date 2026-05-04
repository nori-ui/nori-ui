import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Popover } from './Popover';

const meta: Meta<typeof Popover> = {
    title: 'Overlays/Popover',
    component: Popover,
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Help: Story = {
    render: () => (
        <Popover>
            <Popover.Trigger>
                <Button variant="secondary">What is this?</Button>
            </Popover.Trigger>
            <Popover.Content side="bottom" align="start" aria-label="Help">
                <VStack gap={2}>
                    <Text variant="body-md">Project archive</Text>
                    <Text variant="body-sm">
                        Archived projects are hidden from your dashboard but kept on your account.
                    </Text>
                </VStack>
            </Popover.Content>
        </Popover>
    ),
};
