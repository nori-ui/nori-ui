import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Collapsible } from './Collapsible';

const meta: Meta<typeof Collapsible> = {
    title: 'Disclosure/Collapsible',
    component: Collapsible,
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Basic: Story = {
    render: () => (
        <VStack gap={2} style={{ maxWidth: 400 }}>
            <Collapsible>
                <Collapsible.Trigger>Show details</Collapsible.Trigger>
                <Collapsible.Content>
                    <Text variant="body-sm">
                        This content is hidden until the trigger is pressed. On web it animates open/closed via a CSS
                        max-height transition. On native it mounts/unmounts immediately.
                    </Text>
                </Collapsible.Content>
            </Collapsible>
        </VStack>
    ),
};

export const DefaultOpen: Story = {
    render: () => (
        <Collapsible defaultOpen>
            <Collapsible.Trigger>Hide details</Collapsible.Trigger>
            <Collapsible.Content>
                <Text variant="body-sm">This section starts open.</Text>
            </Collapsible.Content>
        </Collapsible>
    ),
};
