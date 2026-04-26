import { Alert, VStack } from '@nori-ui/core';

export default function AlertBasic() {
    return (
        <VStack gap={3}>
            <Alert tone="info" title="Heads up" description="Your storage limit is approaching." />
            <Alert tone="success" title="Saved" description="Profile changes are live." />
            <Alert
                tone="warning"
                title="Action required"
                description="Verify your email to keep your account active."
            />
            <Alert tone="danger" title="Build failed" description="Three checks are blocking the merge." />
        </VStack>
    );
}
