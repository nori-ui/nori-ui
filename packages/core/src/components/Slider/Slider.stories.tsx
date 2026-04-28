import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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

export const Single: Story = { render: () => <Volume /> };
export const RangeStory: Story = { name: 'Range', render: () => <Range /> };
