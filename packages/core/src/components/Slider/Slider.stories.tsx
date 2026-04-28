import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HStack } from '../HStack';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
    title: 'Inputs/Slider',
    component: Slider,
};
export default meta;
type Story = StoryObj<typeof Slider>;

function Volume() {
    const [v, setV] = useState<number[]>([60]);
    return (
        <VStack gap={2}>
            <Text>Volume — {v[0]}%</Text>
            <Slider value={v} onValueChange={setV} aria-label="Volume" min={0} max={100} step={1} />
        </VStack>
    );
}

function Range() {
    const [r, setR] = useState<number[]>([200, 800]);
    return (
        <VStack gap={2}>
            <Text>
                Price — ${r[0]} to ${r[1]}
            </Text>
            <Slider
                value={r}
                onValueChange={setR}
                min={0}
                max={1000}
                step={10}
                minStepsBetweenThumbs={2}
                ariaLabelForThumb={(i) => (i === 0 ? 'Minimum price' : 'Maximum price')}
            />
        </VStack>
    );
}

function VerticalFader() {
    const [v, setV] = useState<number[]>([40]);
    // The component-detail screen wraps every story in a ScrollView, so
    // a vertical slider inevitably nests inside one. Same scrollEnabled
    // toggle pattern as InsideScrollView — without it, the outer scroll
    // view eats the vertical drag on iOS.
    const [, setScrollEnabled] = useState(true);
    return (
        <HStack gap={4}>
            <View>
                <Slider
                    orientation="vertical"
                    length={200}
                    value={v}
                    onValueChange={setV}
                    onInteractionStart={() => setScrollEnabled(false)}
                    onInteractionEnd={() => setScrollEnabled(true)}
                    aria-label="Channel level"
                    min={0}
                    max={100}
                    step={1}
                />
            </View>
            <VStack gap={1}>
                <Text>Channel level</Text>
                <Text>{v[0]}%</Text>
            </VStack>
        </HStack>
    );
}

function InsideScrollView() {
    const [v, setV] = useState<number[]>([50]);
    // iOS UIScrollView's native pan recognizer can't be preempted from JS
    // alone — `onStartShouldSetResponderCapture` doesn't reach far enough
    // into the native side. The canonical fix is to disable scroll while
    // the user is actively dragging the slider, then re-enable on release.
    const [scrollEnabled, setScrollEnabled] = useState(true);
    return (
        <ScrollView style={{ maxHeight: 240 }} scrollEnabled={scrollEnabled}>
            <VStack gap={3}>
                <Text>Slider inside a vertical ScrollView — drag should not scroll the list.</Text>
                <Slider
                    value={v}
                    onValueChange={setV}
                    onInteractionStart={() => setScrollEnabled(false)}
                    onInteractionEnd={() => setScrollEnabled(true)}
                    aria-label="Inside scroll"
                    min={0}
                    max={100}
                    step={1}
                />
                <Text>Value: {v[0]}</Text>
                <Text>Filler line 1</Text>
                <Text>Filler line 2</Text>
                <Text>Filler line 3</Text>
                <Text>Filler line 4</Text>
            </VStack>
        </ScrollView>
    );
}

export const Single: Story = { render: () => <Volume /> };
export const RangeStory: Story = { name: 'Range', render: () => <Range /> };
export const Vertical: Story = { render: () => <VerticalFader /> };
export const InScrollView: Story = { name: 'Inside ScrollView', render: () => <InsideScrollView /> };
