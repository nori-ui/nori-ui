import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { HStack } from '../HStack';
import { Toaster } from './Toaster';
import { toast } from './toast';

// Toast is global — the showcase mounts a single Toaster here so the
// triggers below produce visible toasts when invoked.

const meta: Meta<typeof Toaster> = {
    title: 'Feedback/Toast',
    component: Toaster,
};
export default meta;
type Story = StoryObj<typeof Toaster>;

export const Triggers: Story = {
    render: () => (
        <>
            <HStack gap={2}>
                <Button onPress={() => toast('Saved successfully')}>Default</Button>
                <Button onPress={() => toast.success('Synced 42 records')}>Success</Button>
                <Button onPress={() => toast.error('Failed to save')} variant="destructive">
                    Error
                </Button>
            </HStack>
            <Toaster />
        </>
    ),
};
