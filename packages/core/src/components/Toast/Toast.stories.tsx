import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { HStack } from '../HStack';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Toaster } from './Toaster';
import { toast } from './toast';

// The native showcase already mounts a `<Toaster>` at the app root
// (see playground-native/app/_layout.tsx) and the docs site does the
// same via `<GlobalToaster>`. So these stories deliberately DON'T
// render their own Toaster — they only fire toasts. That way you see
// the real, app-level positioning + stacking, not a story-scoped
// island that overlays the canvas in a misleading place.

const meta: Meta<typeof Toaster> = {
    title: 'Feedback/Toast',
    component: Toaster,
};
export default meta;
type Story = StoryObj<typeof Toaster>;

export const Tones: Story = {
    render: () => (
        <VStack gap={2}>
            <HStack gap={2}>
                <Button onPress={() => toast('Saved successfully')}>Default</Button>
                <Button onPress={() => toast.success('Synced 42 records')}>Success</Button>
                <Button onPress={() => toast.error('Failed to save')} variant="destructive">
                    Error
                </Button>
            </HStack>
            <HStack gap={2}>
                <Button onPress={() => toast.warning('Approaching the rate limit')}>Warning</Button>
                <Button onPress={() => toast.info('A new version is available')}>Info</Button>
            </HStack>
        </VStack>
    ),
};

export const WithDescription: Story = {
    render: () => (
        <Button
            onPress={() =>
                toast('Event created', {
                    description: 'Monday, January 3rd at 6:00pm',
                })
            }
        >
            Show toast with description
        </Button>
    ),
};

/**
 * Tap "Stack three" to fire three toasts in quick succession. The
 * front toast is in focus; the others sit behind it, scaled and
 * offset. Tap any visible toast to expand the stack and see them
 * laid out flat (sonner-native treats this as the touch equivalent
 * of sonner's hover-to-expand). Swipe up or down to dismiss the
 * front one.
 */
export const Stacked: Story = {
    render: () => (
        <VStack gap={3}>
            <Button
                onPress={() => {
                    toast('Event has been created', { description: 'Monday, January 3rd at 6:00pm' });
                    setTimeout(() => {
                        toast('Calendar synced', { description: 'iCloud · 142 events' });
                    }, 250);
                    setTimeout(() => {
                        toast.success('Invitations sent', { description: '3 attendees notified' });
                    }, 500);
                }}
            >
                Stack three
            </Button>
            <Text>Tap any toast in the stack to expand it. Swipe up or down to dismiss.</Text>
        </VStack>
    ),
};

export const WithAction: Story = {
    render: () => (
        <Button
            onPress={() =>
                toast('Item moved to trash', {
                    description: 'You can undo this action.',
                    action: { label: 'Undo', onClick: () => toast.success('Restored') },
                })
            }
        >
            Show toast with action
        </Button>
    ),
};

export const PromiseLifecycle: Story = {
    render: () => (
        <Button
            onPress={() =>
                toast.promise(
                    new Promise<{ name: string }>((resolve) =>
                        setTimeout(() => resolve({ name: 'design-tokens.json' }), 1500)
                    ),
                    {
                        loading: 'Uploading file…',
                        success: (data) => `${data.name} uploaded`,
                        error: 'Upload failed',
                    }
                )
            }
        >
            Run a promise
        </Button>
    ),
};
