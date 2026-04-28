import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

const meta: Meta<typeof Popover> = {
    title: 'Overlays/Popover',
    component: Popover,
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Help: Story = {
    render: () => (
        <Popover>
            <PopoverTrigger>
                <Button variant="secondary">What is this?</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" aria-label="Help">
                <VStack gap={2}>
                    <Text variant="body-md">Project archive</Text>
                    <Text variant="body-sm">
                        Archived projects are hidden from your dashboard but kept on your account.
                    </Text>
                </VStack>
            </PopoverContent>
        </Popover>
    ),
};
