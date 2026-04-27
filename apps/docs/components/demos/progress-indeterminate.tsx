import { Progress, VStack } from '@nori-ui/core';

export default function ProgressIndeterminate() {
    return (
        <VStack gap={4}>
            <Progress label="Loading" aria-label="Loading account" />
            <Progress size="sm" aria-label="Slim indeterminate" />
            <Progress size="lg" tone="info" aria-label="Large indeterminate" />
        </VStack>
    );
}
