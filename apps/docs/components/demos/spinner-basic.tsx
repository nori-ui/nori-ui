import { HStack, Spinner } from '@nori-ui/core';

export default function SpinnerBasic() {
    return (
        <HStack gap={6}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
        </HStack>
    );
}
