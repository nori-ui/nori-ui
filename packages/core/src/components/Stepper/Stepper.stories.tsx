import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../Button';
import { HStack } from '../HStack';
import { VStack } from '../VStack';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
    title: 'Navigation/Stepper',
    component: Stepper,
};
export default meta;
type Story = StoryObj<typeof Stepper>;

function Checkout() {
    const [step, setStep] = useState(1);
    return (
        <VStack gap={4}>
            <Stepper value={step} onStepPress={setStep} aria-label="Checkout progress">
                <Stepper.Step title="Cart" />
                <Stepper.Step title="Shipping" description="Address and method" />
                <Stepper.Step title="Payment" />
                <Stepper.Step title="Review" />
            </Stepper>
            <HStack gap={2}>
                <Button variant="secondary" disabled={step === 0} onPress={() => setStep((s) => s - 1)}>
                    Back
                </Button>
                <Button disabled={step === 4} onPress={() => setStep((s) => s + 1)}>
                    Continue
                </Button>
            </HStack>
        </VStack>
    );
}

export const Horizontal: Story = { render: () => <Checkout /> };

export const Vertical: Story = {
    render: () => (
        <Stepper value={1} orientation="vertical" aria-label="Account setup">
            <Stepper.Step title="Create account" description="Email and password" />
            <Stepper.Step title="Verify email" description="Enter the six-digit code we sent you" />
            <Stepper.Step title="Choose a plan" />
        </Stepper>
    ),
};

export const WithError: Story = {
    render: () => (
        <Stepper value={2}>
            <Stepper.Step title="Cart" />
            <Stepper.Step title="Shipping" status="error" description="Address could not be verified" />
            <Stepper.Step title="Payment" />
        </Stepper>
    ),
};
