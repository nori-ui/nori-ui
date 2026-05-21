import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Text } from '../Text';
import { HoverCard } from './HoverCard';

const meta: Meta<typeof HoverCard> = {
    title: 'Overlays/HoverCard',
    component: HoverCard,
};
export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Basic: Story = {
    render: () => (
        <HoverCard>
            <HoverCard.Trigger>
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#6366f1',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>MB</Text>
                </View>
            </HoverCard.Trigger>
            <HoverCard.Content>
                <View style={{ padding: 12, gap: 4 }}>
                    <Text style={{ fontWeight: 'bold' }}>@manuelbieh</Text>
                    <Text>Senior dev at Wiremore</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Joined April 2020</Text>
                </View>
            </HoverCard.Content>
        </HoverCard>
    ),
};

export const SlowOpen: Story = {
    render: () => (
        <HoverCard openDelay={800} closeDelay={300}>
            <HoverCard.Trigger>
                <View
                    style={{
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer',
                    }}
                >
                    <Text>Hover me (800ms delay)</Text>
                </View>
            </HoverCard.Trigger>
            <HoverCard.Content>
                <View style={{ padding: 12 }}>
                    <Text>Card content</Text>
                </View>
            </HoverCard.Content>
        </HoverCard>
    ),
};
