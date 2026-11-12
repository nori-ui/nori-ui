'use client';

import { Button, HStack, Stepper, VStack } from '@nori-ui/core';
import { useState } from 'react';

const STEP_COUNT = 4;

export default function StepperBasic() {
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
                <Button variant="secondary" disabled={step === 0} onPress={() => setStep((current) => current - 1)}>
                    Back
                </Button>
                <Button disabled={step === STEP_COUNT} onPress={() => setStep((current) => current + 1)}>
                    {step >= STEP_COUNT - 1 ? 'Place order' : 'Continue'}
                </Button>
            </HStack>
        </VStack>
    );
}
