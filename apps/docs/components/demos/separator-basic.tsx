import { Separator, Text, VStack } from '@nori-ui/core';

export default function SeparatorBasic() {
    return (
        <VStack gap={3}>
            <Text>Account</Text>
            <Separator />
            <Text>Email preferences</Text>
            <Separator />
            <Text>Danger zone</Text>
        </VStack>
    );
}
