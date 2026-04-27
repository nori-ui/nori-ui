import { Progress, VStack } from '@nori-ui/core';

export default function ProgressTones() {
    return (
        <VStack gap={4}>
            <Progress value={70} tone="primary" label="Primary" />
            <Progress value={70} tone="info" label="Info" />
            <Progress value={70} tone="success" label="Success" />
            <Progress value={70} tone="warning" label="Warning" />
            <Progress value={70} tone="danger" label="Danger" />
        </VStack>
    );
}
