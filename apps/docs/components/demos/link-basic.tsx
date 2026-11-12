import { Link, Text, VStack } from '@nori-ui/core';

export default function LinkBasic() {
    return (
        <VStack gap={3}>
            <Link href="https://reactnative.dev">React Native documentation</Link>
            <Link href="https://reactnative.dev" external variant="muted" underline="hover">
                Opens in a new tab
            </Link>
            <Text variant="body-sm">
                By continuing you agree to the{' '}
                <Link href="/terms" size="inherit">
                    terms of service
                </Link>
                .
            </Text>
        </VStack>
    );
}
