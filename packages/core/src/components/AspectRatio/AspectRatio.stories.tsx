import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Text } from '../Text';
import { AspectRatio } from './AspectRatio';

const meta: Meta<typeof AspectRatio> = {
    title: 'Layout/AspectRatio',
    component: AspectRatio,
};
export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Widescreen: Story = {
    render: () => (
        <View style={{ width: 320 }}>
            <AspectRatio ratio={16 / 9}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text>16 / 9</Text>
                </View>
            </AspectRatio>
        </View>
    ),
};

export const Square: Story = {
    render: () => (
        <View style={{ width: 200 }}>
            <AspectRatio ratio={1}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#dbeafe',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text>1 / 1</Text>
                </View>
            </AspectRatio>
        </View>
    ),
};

export const Portrait: Story = {
    render: () => (
        <View style={{ width: 160 }}>
            <AspectRatio ratio={2 / 3}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#fce7f3',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text>2 / 3</Text>
                </View>
            </AspectRatio>
        </View>
    ),
};
