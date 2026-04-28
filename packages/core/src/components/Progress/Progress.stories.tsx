import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
    title: 'Feedback/Progress',
    component: Progress,
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const WithLabels: Story = {
    render: () => (
        <VStack gap={4}>
            <Progress value={25} label="Uploading" />
            <Progress value={64} label="Syncing files" />
            <Progress value={92} label="Almost done" />
        </VStack>
    ),
};
export const Tones: Story = {
    render: () => (
        <VStack gap={3}>
            <Progress value={50} tone="primary" label="Primary" />
            <Progress value={50} tone="success" label="Success" />
            <Progress value={50} tone="warning" label="Warning" />
            <Progress value={50} tone="danger" label="Danger" />
        </VStack>
    ),
};

function AnimatedProgress() {
    // Drive a determinate progress bar from 0 → 100 → 0 in a 4s cycle so
    // the smooth fill transition is visible. The bar interpolates its
    // width between value updates, so a coarse setInterval is enough.
    const [value, setValue] = useState(0);
    useEffect(() => {
        const id = setInterval(() => {
            setValue((v) => (v >= 100 ? 0 : v + 4));
        }, 120);
        return () => clearInterval(id);
    }, []);
    return (
        <VStack gap={3}>
            <Progress value={value} label={`Loading ${value}%`} />
            <Text>Determinate bar animating between renders.</Text>
        </VStack>
    );
}

export const Animated: Story = { render: () => <AnimatedProgress /> };

/**
 * When `value` is omitted, Progress runs an indeterminate "marquee"
 * animation — a sliver loops left → right continuously. Use this when
 * you don't know how long an operation will take.
 */
export const Indeterminate: Story = {
    render: () => (
        <VStack gap={3}>
            <Progress label="Connecting…" />
            <Progress label="Syncing repository…" tone="success" />
        </VStack>
    ),
};
