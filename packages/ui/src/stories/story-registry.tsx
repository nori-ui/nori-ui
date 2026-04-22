// Story registry — enumerated list of CSF stories in the library.
// Used by playground-native (which can't auto-discover via Storybook) to
// render the same set of variants.
//
// Each entry maps a display title to a render function. Plan 05 adds one
// entry per component variant.

import type { ComponentType } from 'react';
import { View } from 'react-native';
import { Box } from '../components/Box';
import { Button } from '../components/Button';
import { HStack } from '../components/HStack';
import { Spinner } from '../components/Spinner';
import { Text } from '../components/Text';
import { VStack } from '../components/VStack';

export type StoryEntry = {
    /** Dot-separated story id, e.g. "Button/Primary" */
    id: string;
    /** Human title shown in Storybook + playground-native */
    title: string;
    /** Renderable component (already wrapped with its args) */
    render: ComponentType<Record<string, never>>;
};

export const stories: StoryEntry[] = [
    {
        id: 'text.body-md',
        title: 'Text · body-md',
        render: () => <Text testID="story-text-body-md">Hello world</Text>,
    },
    {
        id: 'text.heading-1',
        title: 'Text · heading-1',
        render: () => (
            <Text variant="heading-1" testID="story-text-heading-1">
                Heading
            </Text>
        ),
    },
    {
        id: 'box.default',
        title: 'Box · default',
        render: () => (
            <Box testID="story-box-default" className="p-4 bg-primary-50 rounded-md">
                <Text>Box content</Text>
            </Box>
        ),
    },
    {
        id: 'hstack.gap-4',
        title: 'HStack · gap 4',
        render: () => (
            <HStack testID="story-hstack-gap-4" gap={4}>
                <View testID="story-hstack-a" style={{ padding: 8, backgroundColor: '#dbeafe' }}>
                    <Text>A</Text>
                </View>
                <View testID="story-hstack-b" style={{ padding: 8, backgroundColor: '#bfdbfe' }}>
                    <Text>B</Text>
                </View>
            </HStack>
        ),
    },
    {
        id: 'vstack.gap-4',
        title: 'VStack · gap 4',
        render: () => (
            <VStack testID="story-vstack-gap-4" gap={4}>
                <View testID="story-vstack-a" style={{ padding: 8, backgroundColor: '#dbeafe' }}>
                    <Text>A</Text>
                </View>
                <View testID="story-vstack-b" style={{ padding: 8, backgroundColor: '#bfdbfe' }}>
                    <Text>B</Text>
                </View>
            </VStack>
        ),
    },
    {
        id: 'spinner.md',
        title: 'Spinner · md',
        render: () => <Spinner testID="story-spinner-md" size="md" />,
    },
    {
        id: 'spinner.lg',
        title: 'Spinner · lg',
        render: () => <Spinner testID="story-spinner-lg" size="lg" />,
    },
    {
        id: 'button.primary',
        title: 'Button · primary',
        render: () => <Button testID="story-button-primary">Click me</Button>,
    },
    {
        id: 'button.destructive',
        title: 'Button · destructive',
        render: () => (
            <Button testID="story-button-destructive" variant="destructive">
                Delete
            </Button>
        ),
    },
    {
        id: 'button.loading',
        title: 'Button · loading',
        render: () => (
            <Button testID="story-button-loading" loading>
                Saving
            </Button>
        ),
    },
];
