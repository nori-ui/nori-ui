import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { InputOTP } from './InputOTP';

const meta: Meta<typeof InputOTP> = {
    title: 'Forms/InputOTP',
    component: InputOTP,
};
export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Basic: Story = {
    render: () => {
        const [code, setCode] = useState('');
        return (
            <View style={{ gap: 8 }}>
                <InputOTP value={code} onChange={setCode} length={6} />
                <Text>Value: {code}</Text>
            </View>
        );
    },
};

export const FourDigit: Story = {
    render: () => {
        const [code, setCode] = useState('');
        return (
            <View style={{ gap: 8 }}>
                <InputOTP value={code} onChange={setCode} length={4} />
                <Text>Value: {code}</Text>
            </View>
        );
    },
};

export const Alphanumeric: Story = {
    render: () => {
        const [code, setCode] = useState('');
        return (
            <View style={{ gap: 8 }}>
                <InputOTP value={code} onChange={setCode} length={6} pattern="alphanumeric" />
                <Text>Value: {code}</Text>
            </View>
        );
    },
};

export const WithCompletion: Story = {
    render: () => {
        const [code, setCode] = useState('');
        const [completed, setCompleted] = useState<string | null>(null);
        return (
            <View style={{ gap: 8 }}>
                <InputOTP value={code} onChange={setCode} onComplete={(v) => setCompleted(v)} length={6} />
                {completed ? <Text>Completed: {completed}</Text> : <Text>Enter 6 digits</Text>}
            </View>
        );
    },
};

export const Disabled: Story = {
    render: () => <InputOTP value="123" length={6} disabled />,
};
