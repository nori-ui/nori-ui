import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Text } from '../Text';
import { Carousel } from './Carousel';

const meta: Meta<typeof Carousel> = {
    title: 'Navigation/Carousel',
    component: Carousel,
};
export default meta;
type Story = StoryObj<typeof Carousel>;

const SLIDES = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

export const Basic: Story = {
    render: () => (
        <View style={{ width: 320, height: 180 }}>
            <Carousel>
                <Carousel.Content>
                    {SLIDES.map((color, i) => (
                        <Carousel.Item key={color}>
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Slide {i + 1}</Text>
                            </View>
                        </Carousel.Item>
                    ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
                <Carousel.Dots />
            </Carousel>
        </View>
    ),
};

export const Loop: Story = {
    render: () => (
        <View style={{ width: 320, height: 180 }}>
            <Carousel loop>
                <Carousel.Content>
                    {SLIDES.slice(0, 3).map((color, i) => (
                        <Carousel.Item key={color}>
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Slide {i + 1}</Text>
                            </View>
                        </Carousel.Item>
                    ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
                <Carousel.Dots />
            </Carousel>
        </View>
    ),
};

export const NoDots: Story = {
    render: () => (
        <View style={{ width: 320, height: 180 }}>
            <Carousel>
                <Carousel.Content>
                    {SLIDES.slice(0, 3).map((color, i) => (
                        <Carousel.Item key={color}>
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Slide {i + 1}</Text>
                            </View>
                        </Carousel.Item>
                    ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
            </Carousel>
        </View>
    ),
};
