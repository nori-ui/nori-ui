import { Text, VStack } from '@nori-ui/core';

export default function TextBasic() {
    return (
        <VStack gap={3}>
            <Text variant="heading-1">Heading 1</Text>
            <Text variant="heading-2">Heading 2</Text>
            <Text>Body text at the default size.</Text>
            <Text variant="body-sm">Small body text for secondary info.</Text>
        </VStack>
    );
}
