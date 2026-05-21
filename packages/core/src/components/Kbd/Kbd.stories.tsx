import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { HStack } from '../HStack';
import { Text } from '../Text';
import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
    title: 'Display/Kbd',
    component: Kbd,
};
export default meta;
type Story = StoryObj<typeof Kbd>;

export const Basic: Story = {
    render: () => (
        <HStack gap={2} align="center">
            <Kbd>⌘K</Kbd>
            <Kbd>Ctrl+S</Kbd>
            <Kbd>Shift+?</Kbd>
            <Kbd>Esc</Kbd>
        </HStack>
    ),
};

export const InlineText: Story = {
    render: () => (
        <View style={{ maxWidth: 320 }}>
            <Text>
                Press <Kbd>⌘K</Kbd> to open the command palette or <Kbd>Esc</Kbd> to close it.
            </Text>
        </View>
    ),
};
